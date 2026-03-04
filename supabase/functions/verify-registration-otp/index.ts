import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { identifier, type, code } = await req.json()

    if (!identifier || !type || !code) {
      throw new Error('Identifier, type, and code are required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check OTP in database
    const { data: otp, error: otpError } = await supabaseClient
      .from('otps')
      .select('*')
      .eq('identifier', identifier)
      .eq('type', type)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (otpError || !otp) {
      throw new Error('Invalid or expired verification code')
    }

    // Delete OTP after successful verification to prevent reuse
    await supabaseClient
      .from('otps')
      .delete()
      .eq('id', otp.id)

    return new Response(JSON.stringify({ message: 'Verification successful' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Verification error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
