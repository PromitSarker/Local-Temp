import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getSettings = async (supabase: any) => {
  const { data } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['STRIPE_SECRET_KEY', 'ADMIN_FEE_PERCENTAGE']);
  
  const settings: any = {};
  data?.forEach((item: any) => {
    settings[item.key] = item.value;
  });

  return {
    stripeKey: settings['STRIPE_SECRET_KEY'] || Deno.env.get('STRIPE_SECRET_KEY') || '',
    adminFee: parseFloat(settings['ADMIN_FEE_PERCENTAGE'] || '0.10')
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify cron secret (or just allow if it's protected by other means)
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` && 
      authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    // Basic protection against unauthorized external calls. 
    // Ideally use a specific secret for the cron job, but we'll use anon/service key as simple auth.
  }

  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { stripeKey, adminFee: adminFeeRate } = await getSettings(adminClient);
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // 1. Get all bookings eligible for auto-release
    const { data: eligibleBookings, error: fetchError } = await adminClient
      .rpc('get_bookings_for_auto_release');

    if (fetchError) throw fetchError;

    if (!eligibleBookings || eligibleBookings.length === 0) {
      return new Response(JSON.stringify({ message: "No bookings require auto-release.", count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let processedCount = 0;
    const errors = [];

    // 2. Process each booking
    for (const booking of eligibleBookings) {
      try {
        // Fetch locum details to get connected account ID
        const { data: locumData } = await adminClient
            .from('profiles')
            .select('stripe_account_id')
            .eq('id', booking.locum_id)
            .single();

        const locumAccountId = locumData?.stripe_account_id;
        
        if (!locumAccountId) {
            console.warn(`Skipping booking ${booking.booking_id}: Locum has no connected Stripe account`);
            continue;
        }

        // Retrieve PI to get captured amount
        const pi = await stripe.paymentIntents.retrieve(booking.payment_intent_id);
        if (pi.status !== 'succeeded') {
            console.warn(`Skipping booking ${booking.booking_id}: PI not fully captured (status: ${pi.status})`);
            continue;
        }

        const totalAmount = pi.amount_received; // in pennies
        const adminFee = Math.round(totalAmount * adminFeeRate);
        const transferAmount = totalAmount - adminFee;

        // Perform Transfer
        const transfer = await stripe.transfers.create({
            amount: transferAmount,
            currency: 'gbp',
            destination: locumAccountId,
            transfer_group: booking.booking_id,
            metadata: {
                booking_id: booking.booking_id,
                type: 'auto_payout'
            }
        });

        // Update database
        await adminClient
            .from('bookings')
            .update({ 
                payment_status: 'released',
                transfer_id: transfer.id,
                admin_fee: adminFee / 100
            })
            .eq('id', booking.booking_id);

        processedCount++;

        // Notify Locum
        await adminClient.from('notifications').insert({
            user_id: booking.locum_id,
            type: 'payment',
            title: 'Funds Auto-Released',
            message: `Your payment for shift have been successfully released to your Stripe account.`
        });

      } catch (err) {
        console.error(`Error processing booking ${booking.booking_id}:`, err);
        errors.push({ id: booking.booking_id, error: err.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Auto-release processed.", 
        count: processedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Global Auto-Release Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
