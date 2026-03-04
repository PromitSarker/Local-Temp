import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const users = [
      {
        email: "admin@locum.com",
        password: "123456",
        user_type: "locum" as const,
        full_name: "Locum Admin",
      },
      {
        email: "admin@practice.com", 
        password: "123456",
        user_type: "practice" as const,
        full_name: "Practice Admin",
      },
    ];

    const results = [];

    for (const user of users) {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (authError) {
        results.push({ email: user.email, error: authError.message });
        continue;
      }

      // Create profile
      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        user_id: authData.user.id,
        user_type: user.user_type,
        full_name: user.full_name,
        email: user.email,
      });

      if (profileError) {
        results.push({ email: user.email, error: profileError.message });
        continue;
      }

      results.push({ email: user.email, success: true });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
