-- Create locum_documents table
CREATE TABLE IF NOT EXISTS locum_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_path TEXT,
  file_name TEXT,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('not_uploaded', 'uploaded', 'pending_review', 'approved', 'rejected')),
  expiry_date DATE,
  text_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, document_type)
);

-- Enable RLS
ALTER TABLE locum_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for locum_documents
-- RLS Policies for locum_documents
DO $$ BEGIN
    CREATE POLICY "Users can view their own documents" ON locum_documents
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = locum_documents.profile_id AND profiles.user_id = auth.uid())
      );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own documents" ON locum_documents
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = locum_documents.profile_id AND profiles.user_id = auth.uid())
      );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own documents" ON locum_documents
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = locum_documents.profile_id AND profiles.user_id = auth.uid())
      );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Storage bucket setup (idempotent)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('locum-documents', 'locum-documents', false) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies
-- Policy to allow authenticated users to upload files to their own folder
DO $$ BEGIN
    CREATE POLICY "Users can upload their own documents" ON storage.objects
      FOR INSERT TO authenticated 
      WITH CHECK (
        bucket_id = 'locum-documents' AND 
        (storage.foldername(name))[1] = auth.uid()::text
      );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Policy to allow users to view their own documents
DO $$ BEGIN
    CREATE POLICY "Users can view their own documents" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'locum-documents' AND 
        (storage.foldername(name))[1] = auth.uid()::text
      );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Policy to allow users to update/delete their own documents
DO $$ BEGIN
    CREATE POLICY "Users can update their own documents" ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'locum-documents' AND 
        (storage.foldername(name))[1] = auth.uid()::text
      );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their own documents" ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'locum-documents' AND 
        (storage.foldername(name))[1] = auth.uid()::text
      );
EXCEPTION WHEN duplicate_object THEN null; END $$;
