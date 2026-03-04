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
    .in('key', ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']);

  const settings: any = {};
  data?.forEach((item: any) => {
    settings[item.key] = item.value;
  });

  return {
    stripeKey: settings['STRIPE_SECRET_KEY'] || Deno.env.get('STRIPE_SECRET_KEY') || '',
    webhookSecret: settings['STRIPE_WEBHOOK_SECRET'] || Deno.env.get('STRIPE_WEBHOOK_SECRET') || '',
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Must use service role for webhooks
    );

    const { stripeKey, webhookSecret } = await getSettings(supabaseClient);
    
    if (!stripeKey) {
        throw new Error('Stripe Secret Key not found');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const signature = req.headers.get('Stripe-Signature');
    const body = await req.text(); // Get raw body for verification

    let event;

    // Verify signature if secret is available
    if (webhookSecret && signature) {
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: corsHeaders });
        }
    } else {
        // Fallback for testing/unconfigured secret (Not recommended for prod)
        console.warn('Webhook secret not found or signature missing. Skipping verification.');
        try {
            event = JSON.parse(body);
        } catch (e) {
             return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: corsHeaders });
        }
    }

    console.log(`Received event: ${event.type}`);

    switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object;
            // Lookup booking by payment_intent_id or metadata
            const { error } = await supabaseClient
                .from('bookings')
                .update({ payment_status: 'paid' })
                .eq('payment_intent_id', paymentIntent.id)
                .neq('payment_status', 'paid') // Only update if not already paid
                .neq('payment_status', 'released') // Don't revert released
                .neq('payment_status', 'held') // Don't revert held
                .neq('payment_status', 'refunded'); // Don't revert refunded

            if (error) console.error('Error updating booking paid status:', error);
            else console.log(`Booking paid: ${paymentIntent.id}`);
            break;
        }
        case 'payment_intent.payment_failed': {
             const paymentIntent = event.data.object;
             console.log(`Payment failed: ${paymentIntent.id}`);
             // Could update status to 'failed' or notify user
             break;
        }
        case 'charge.refunded': {
            const charge = event.data.object;
            const paymentIntentId = charge.payment_intent;
            
            const { error } = await supabaseClient
                .from('bookings')
                .update({ payment_status: 'refunded' })
                .eq('payment_intent_id', paymentIntentId);

            if (error) console.error('Error updating booking refunded status:', error);
            else console.log(`Booking refunded: ${paymentIntentId}`);
            break;
        }
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
