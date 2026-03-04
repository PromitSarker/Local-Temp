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
    const { identifier, type } = await req.json()

    if (!identifier || !type) {
      throw new Error('Identifier and type are required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now

    // Upsert OTP in database
    const { error: otpError } = await supabaseClient
      .from('otps')
      .upsert(
        { identifier, type, code, expires_at: expiresAt },
        { onConflict: 'identifier,type' }
      )

    if (otpError) throw otpError

    // Log the code for backend testing
    console.log(`[VERIFICATION] Sent ${type} code for ${identifier}: ${code}`)

    // NOTE: In production, you would integrate your preferred service here (e.g., SendGrid, Postmark, Twilio)
    // For now, we return the code in the response for development/testing as requested.

    return new Response(JSON.stringify({ 
      message: 'Verification code generated.',
      code: code // REMOVE THIS IN PRODUCTION for security
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('OTP error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
