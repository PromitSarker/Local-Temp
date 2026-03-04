// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    // We strictly need service role for system settings if RLS blocks anon (which it does via 'admin only' policy)
    // Actually, create-payment-intent and stripe-connect currently use ANON key. 
    // If I protect system_settings with "Only Admins", the ANON client (used by regular users) CANNOT read the key!
    // CRITICAL FIX: The Edge Function itself should use the SERVICE_ROLE_KEY to read the settings, 
    // OR I need to allow public read of PUBLIC keys? No, Secret Key is private.
    // Solution: Create a separate admin client inside the function just to fetch the key?
    // Or just use Service Role for the whole function logic? 
    // Using Service Role is safer for backend logic anyway.
    // I will update the code to use SERVICE_ROLE for fetching settings.

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { stripeKey, adminFee: adminFeeRate } = await getSettings(adminClient);
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Verify User (Admin or System check?)
    // For now, checks auth user is valid. Ideally, we check if user is admin OR if user is the Locum marking it complete.
    // Let's assume the trigger is from a trusted source or "Mark as Complete" button calls this.
    // Ideally this should be called by a Database Trigger or strictly controlled endpoint.
    // For MVP, we let the frontend call it when "Mark as Completed" happens, but we verify 
    // that the current user is the Locum assigned to the booking OR the Practice confirming.
    
    // Actually, usually "Release" happens AFTER "Mark as Completed". 
    // Let's just validate the booking exists and user has rights.
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('User not found')
    }

    // Check if user is admin
    // Note: In production, use a more robust role check (e.g. JWT claims or admin table)
    // For now, we query the profiles table or check specific email
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('user_type')
        .eq('user_id', user.id)
        .single();
    
    if (profile?.user_type !== 'admin') {
        // Allow if it's the practice releasing? No, plan says ONLY Admin releases after review.
        // So strict Admin check.
        throw new Error('Unauthorized: Only admins can release funds.');
    }

    const { bookingId } = await req.json()

    // 1. Fetch booking & Locum details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*, locum:locum_id(stripe_account_id)')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      throw new Error('Booking not found')
    }

    if (booking.transfer_id) {
        return new Response(
            JSON.stringify({ message: 'Funds already released' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    if (!booking.payment_intent_id) {
        throw new Error('No payment record found for this booking')
    }

    const locumAccountId = booking.locum?.stripe_account_id;
    if (!locumAccountId) {
        throw new Error('Locum has not connected a Stripe account')
    }

    // 2. Retrieve PaymentIntent to verify amount
    const pi = await stripe.paymentIntents.retrieve(booking.payment_intent_id);
    if (pi.status !== 'succeeded') {
        throw new Error('Payment has not been captured yet')
    }

    const totalAmount = pi.amount_received; // in pennies
    const adminFee = Math.round(totalAmount * adminFeeRate);
    const transferAmount = totalAmount - adminFee;

    // 3. Create Refund (Partial)
    // We refund everything EXCEPT the admin fee to the practice.
    // The funds are currently in the Platform Account (since we haven't transferred them).
    // So we just refund the captured PaymentIntent partial amount.
    
    // Note: If stripe account balance is insufficient, this might fail, but usually for holding period funds are there?
    // Wait, Stripe Connect destination charges?
    // In create-payment-intent, are we using direct charges or destination charges?
    // If destination charges, funds might be on connected account?
    // Let's check `create-payment-intent`.
    // It calls `stripe.paymentIntents.create`. It doesn't seem to have `transfer_data`.
    // And `release-funds` creates a separate transfer.
    // So funds are in Platform Account. Correct.
    
    // Refund Amount = Total - AdminFee.
    // Meaning we keep the admin fee, and give back the rest to Practice.
    
    const refundAmount = transferAmount; // Same calculation: Total - Admin Fee

    const refund = await stripe.refunds.create({
        payment_intent: booking.payment_intent_id,
        amount: refundAmount,
        metadata: {
            booking_id: bookingId,
            reason: 'admin_resolution'
        }
    });

    // 4. Update Database
    await supabaseClient
        .from('bookings')
        .update({ 
            payment_status: 'refunded',
            refund_amount: refundAmount / 100, // Store as decimal
            status: 'cancelled'
        })
        .eq('id', bookingId)

    return new Response(
      JSON.stringify({ success: true, refundId: refund.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
