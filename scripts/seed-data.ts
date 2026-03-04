
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to read .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

let envConfig: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            let value = valueParts.join('=')?.trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            envConfig[key.trim()] = value;
        }
    });
}

const SUPABASE_URL = envConfig['VITE_SUPABASE_URL'];
const SUPABASE_SERVICE_ROLE_KEY = envConfig['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function seedData() {
    console.log('Starting data seed...');

    // 1. Create Users (Locums)
    const locums = [
        { email: 'sarah.dentist@example.com', name: 'Sarah Jenkins', city: 'London', role: 'locum' },
        { email: 'mark.hygienist@example.com', name: 'Mark Thompson', city: 'Manchester', role: 'locum' },
        { email: 'elena.therapist@example.com', name: 'Elena Rodriguez', city: 'Birmingham', role: 'locum' },
        { email: 'ahmed.dentist@example.com', name: 'Ahmed Khan', city: 'Leeds', role: 'locum' },
        { email: 'chloe.nurse@example.com', name: 'Chloe Smith', city: 'Bristol', role: 'locum' }
    ];

    for (const locum of locums) {
        console.log(`Processing locum: ${locum.name}`);

        // Create or get user
        const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
            email: locum.email,
            password: 'admin123',
            email_confirm: true,
            user_metadata: { role: 'authenticated' }
        });

        let userId = user?.id;

        if (createError) {
            // If user exists, fetch ID
            if (createError.message.includes('already registered')) {
                const { data: existingUsers } = await supabase.auth.admin.listUsers();
                const existing = existingUsers.users.find(u => u.email === locum.email);
                if (existing) userId = existing.id;
            } else {
                console.error(`Error creating user ${locum.email}:`, createError);
                continue;
            }
        }

        if (userId) {
            // Upsert profile
            const { error: profileError } = await supabase.from('profiles').upsert({
                user_id: userId,
                user_type: 'locum',
                full_name: locum.name,
                email: locum.email,
                city: locum.city,
                address_line1: '123 High St',
                postcode: 'SW1A 1AA', // Mock
                reliability_score: 95,
                hourly_rate: 45,
                experience_years: 5
            }, { onConflict: 'user_id' });

            if (profileError) console.error(`Error updating profile for ${locum.name}:`, profileError);
        }
    }

    // 2. Create Users (Practices)
    const practices = [
        { email: 'manager@centraldental.co.uk', name: 'Central Dental', city: 'London', role: 'practice' },
        { email: 'contact@smilehub.co.uk', name: 'Smile Hub', city: 'Manchester', role: 'practice' }
    ];

    for (const practice of practices) {
        console.log(`Processing practice: ${practice.name}`);
        // Create or get user
        const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
            email: practice.email,
            password: 'admin123',
            email_confirm: true,
            user_metadata: { role: 'authenticated' }
        });

        let userId = user?.id;

        if (createError) {
            if (createError.message.includes('already registered')) {
                const { data: existingUsers } = await supabase.auth.admin.listUsers();
                const existing = existingUsers.users.find(u => u.email === practice.email);
                if (existing) userId = existing.id;
            } else {
                console.error(`Error creating user ${practice.email}:`, createError);
                continue;
            }
        }

        if (userId) {
            // Upsert profile
            const { error: profileError } = await supabase.from('profiles').upsert({
                user_id: userId,
                user_type: 'practice',
                full_name: practice.name,
                practice_name: practice.name,
                email: practice.email,
                city: practice.city,
                postcode: 'W1D 1AN'
            }, { onConflict: 'user_id' });

            if (profileError) console.error(`Error updating profile for ${practice.name}:`, profileError);
        }
    }

    console.log('Seeding completed!');
}

seedData().catch(console.error);
