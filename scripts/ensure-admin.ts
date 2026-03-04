import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read .env file manually
const envPath = join(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const ADMIN_EMAIL = 'admin@localtemp.co.uk';
const ADMIN_PASSWORD = 'admin123';

async function ensureAdminUser() {
  console.log(`Checking for admin user: ${ADMIN_EMAIL}...`);

  // Check if user exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const existingUser = users.find((u) => u.email === ADMIN_EMAIL);

  let userId: string;

  if (existingUser) {
    console.log('✓ User exists. Updating password...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password: ADMIN_PASSWORD }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return;
    }
    console.log('✓ Password updated to: admin123');
    userId = existingUser.id;
  } else {
    console.log('Creating new admin user...');
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }
    console.log('✓ User created');
    userId = data.user!.id;
  }

  // Ensure admin role in profiles
  console.log('Ensuring admin role in profiles...');
  
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      user_type: 'admin',
      email: ADMIN_EMAIL,
      full_name: 'System Administrator',
    });

  if (profileError) {
    console.error('Error updating profile:', profileError);
  } else {
    console.log('✓ Profile role set to admin');
  }

  console.log('\n✅ Admin user ready!');
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  const baseUrl = envVars.VITE_APP_URL || 'http://localhost:5173';
  console.log(`   Access: ${baseUrl}/admin`);
}

ensureAdminUser().catch(console.error);
