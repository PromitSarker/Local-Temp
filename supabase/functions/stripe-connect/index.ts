import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const getStripeKey = async (supabase: any) => {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'STRIPE_SECRET_KEY')
    .single();
  
  return data?.value || Deno.env.get('STRIPE_SECRET_KEY') || '';
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Stripe Connect: Function started');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Check service role key availability
    // Try standard system key first, then fallback to custom key if CLI blocks setting SUPABASE_ prefix
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
    
    if (!serviceRoleKey) {
        console.error('CRITICAL: Service Role Key is missing. Checked SUPABASE_SERVICE_ROLE_KEY and SERVICE_ROLE_KEY');
        throw new Error('Server configuration error: Missing service role key');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey
    );

    const getStripeKey = async (supabase: any) => {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'STRIPE_SECRET_KEY')
          .single();
        
        if (error) {
            console.error('Error fetching Stripe key from DB:', error);
            return null;
        }
        return data?.value;
    };

    const dbStripeKey = await getStripeKey(supabaseAdmin);
    const envStripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    // Prioritize DB key, fallback to env
    const stripeKey = dbStripeKey || envStripeKey;

    if (!stripeKey) {
        console.error('CRITICAL: Stripe Secret Key not found in DB or Env');
        throw new Error('Server configuration error: Missing Stripe Secret Key');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })
    
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error('User auth error:', userError);
      throw new Error('User not found or unauthorized')
    }

    console.log(`Processing for user: ${user.email}`);

    // 1. Get current profile to check if already connected
    // Use admin client to avoid potential RLS issues reading profiles if any
    // But typically users can read their own profile. Let's stick to client for this.
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_account_id, email, full_name')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
        console.error('Error fetching profile:', profileError);
    }

    let accountId = profile?.stripe_account_id

    // 2. If no account, create one
    if (!accountId) {
      console.log('Creating new Stripe Express account...');
      try {
          const account = await stripe.accounts.create({
            type: 'express',
            country: 'GB',
            email: user.email,
            capabilities: {
              card_payments: { requested: true },
              transfers: { requested: true },
            },
            business_type: 'individual',
            individual: {
               first_name: profile?.full_name?.split(' ')[0],
               last_name: profile?.full_name?.split(' ').slice(1).join(' ') || '',
               email: user.email
            },
            settings: {
                payouts: {
                    schedule: {
                        interval: 'manual'
                    }
                }
            }
          })
    
          accountId = account.id
          console.log(`Created Stripe Account: ${accountId}`);
    
          await supabaseAdmin
            .from('profiles')
            .update({ stripe_account_id: accountId })
            .eq('user_id', user.id)
            
      } catch (stripeError) {
          console.error('Stripe Account Creation Error:', stripeError);
          throw new Error(`Stripe Error: ${stripeError.message}`);
      }
    } else {
        console.log(`Using existing Stripe Account: ${accountId}`);
    }

    // 3. Create Account Link for onboarding
    const origin = req.headers.get('origin');
    
    if (!origin) {
      console.error('Origin header missing');
      throw new Error('Missing origin header');
    }
    
    console.log('Creating Account Link...');
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/locum-dashboard/payments?refresh=true`,
      return_url: `${origin}/locum-dashboard/payments?success=true`,
      type: 'account_onboarding',
    })

    return new Response(
      JSON.stringify({ url: accountLink.url, accountId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Function Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 so client can read the error message in the body
      }
    )
  }
})
