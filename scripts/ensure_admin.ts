
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/std@0.168.0/dotenv/load.ts";

const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL")!;
// Important: Use SERVICE_ROLE_KEY for admin operations (bypasses RLS)
// Since we don't have SERVICE_ROLE_KEY in front-end .env usually, we check if we can read it from Supabase config or assume it's passed/in env.
// For this environment, I'll try to use the one I found in edge functions, or fallback to the one in local file if present?
// Actually, local development usually has a known key or I can read it from the supabase/config or output.
// But wait, the previous .env file view did NOT show SUPABASE_SERVICE_ROLE_KEY. It showed VITE_ keys and STRIPE keys.
// Service role key is usually in supabase status output.
// I will try to read it from `npx supabase status` output in the next step if this script fails, but I can't run npx inside Deno script easily.
// I'll update the script to take key as argument.

const supabaseServiceKey = Deno.args[0];

if (!supabaseServiceKey) {
  console.error("Please provide SUPABASE_SERVICE_ROLE_KEY as the first argument.");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const email = "admin@localtemp.co.uk";
const password = "admin123";

async function ensureAdmin() {
  console.log(`Checking for user ${email}...`);

  // 1. Check if user exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error("Error listing users:", listError);
    return;
  }

  const existingUser = users.find((u) => u.email === email);

  let userId;

  if (existingUser) {
    console.log("User exists. Updating password...");
    // 2. Update password
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password: password }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return;
    }
    console.log("Password updated.");
    userId = existingUser.id;
  } else {
    console.log("User does not exist. Creating...");
    // 3. Create user
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return;
    }
    console.log("User created.");
    userId = data.user.id;
  }

  // 4. Ensure 'admin' role in profiles
  console.log("Ensuring admin role in profiles...");
  // Note: Trigger usually creates profile, but we need to update it to admin.
  // Wait a bit for trigger? Or just upsert.
  
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ user_type: "admin" })
    .eq("id", userId);

  if (profileError) {
    console.error("Error updating profile role:", profileError);
  } else {
    console.log("Profile role updated to 'admin'.");
  }
}

ensureAdmin();
