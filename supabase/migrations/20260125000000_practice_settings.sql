-- Create practices table for billing information
CREATE TABLE IF NOT EXISTS practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  billing_name TEXT NOT NULL,
  vat_number TEXT,
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_city TEXT,
  billing_postcode TEXT,
  billing_country TEXT DEFAULT 'United Kingdom',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Owner', 'Manager', 'Staff')),
  avatar_color TEXT DEFAULT '#16a34a',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  invoice_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'GBP',
  status TEXT NOT NULL CHECK (status IN ('Paid', 'Pending', 'Overdue')) DEFAULT 'Pending',
  download_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for practices
-- RLS Policies for practices
DO $$ BEGIN
    CREATE POLICY "Users can view their own practices" ON practices 
      FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own practices" ON practices 
      FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own practices" ON practices 
      FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- RLS Policies for team_members (via practice ownership)
DO $$ BEGIN
    CREATE POLICY "Users can view team members of their practices" ON team_members 
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM practices WHERE practices.id = team_members.practice_id AND practices.user_id = auth.uid())
      );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert team members to their practices" ON team_members 
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM practices WHERE practices.id = team_members.practice_id AND practices.user_id = auth.uid())
      );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update team members of their practices" ON team_members 
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM practices WHERE practices.id = team_members.practice_id AND practices.user_id = auth.uid())
      );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete team members from their practices" ON team_members 
      FOR DELETE USING (
        EXISTS (SELECT 1 FROM practices WHERE practices.id = team_members.practice_id AND practices.user_id = auth.uid())
      );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- RLS Policies for invoices (via practice ownership)
DO $$ BEGIN
    CREATE POLICY "Users can view invoices of their practices" ON invoices 
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM practices WHERE practices.id = invoices.practice_id AND practices.user_id = auth.uid())
      );
EXCEPTION WHEN duplicate_object THEN null; END $$;
