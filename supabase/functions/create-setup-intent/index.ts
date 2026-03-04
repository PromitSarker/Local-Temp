import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log('create-setup-intent: Function started');

        // User client - for auth verification
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Admin client - for reading secret settings & updating profiles (bypasses RLS)
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
        if (!serviceRoleKey) {
            console.error('CRITICAL: Service Role Key is missing');
            throw new Error('Server configuration error: Missing service role key');
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            serviceRoleKey
        );

        // 1. Verify user auth
        console.log('Verifying user auth...');
        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser()

        if (userError) {
            console.error('Error getting user:', userError);
            throw new Error(`Auth error: ${userError.message}`)
        }

        if (!user) {
            console.error('No user found');
            throw new Error('User not found')
        }

        console.log('User authenticated:', user.id);

        // 2. Get Stripe Secret Key using ADMIN client (RLS blocks non-admin reads of secrets)
        console.log('Fetching Stripe key from system_settings via admin client...');
        const { data: settings, error: settingsError } = await supabaseAdmin
            .from('system_settings')
            .select('value')
            .eq('key', 'STRIPE_SECRET_KEY')
            .single();

        if (settingsError) {
            console.error('Error fetching Stripe key from DB:', settingsError);
        }

        const stripeKey = settings?.value || Deno.env.get('STRIPE_SECRET_KEY') || '';
        if (!stripeKey) {
            console.error('Stripe key not found in DB or env');
            throw new Error('Stripe configuration missing');
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2022-11-15',
            httpClient: Stripe.createFetchHttpClient(),
        })

        // 3. Get Profile (use admin client to avoid any RLS issues)
        console.log('Fetching profile...');
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (profileError || !profile) {
            console.error('Profile error:', profileError);
            throw new Error('Profile not found')
        }

        console.log('Profile found:', profile.id);
        let customerId = profile.stripe_customer_id;

        // 4. If no customer ID, create one
        if (!customerId) {
            console.log('Creating new Stripe customer...');
            const customer = await stripe.customers.create({
                email: profile.email,
                name: profile.full_name,
                metadata: {
                    supabase_id: profile.id
                }
            });
            customerId = customer.id;
            console.log('Stripe customer created:', customerId);

            // Save to profile using admin client
            await supabaseAdmin
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', profile.id);
        } else {
            console.log('Existing Stripe customer:', customerId);
        }

        // 5. Create Setup Intent
        console.log('Creating setup intent...');
        const setupIntent = await stripe.setupIntents.create({
            customer: customerId,
            payment_method_types: ['card'],
        })

        console.log('Setup intent created:', setupIntent.id);
        return new Response(
            JSON.stringify({ clientSecret: setupIntent.client_secret }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Function error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})

