-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages if booking exists" ON messages;

-- Policy 1: Users can read messages where they are sender or receiver
CREATE POLICY "Users can read their own messages"
ON messages FOR SELECT
USING ( auth.uid() = sender_id OR auth.uid() = receiver_id );

-- Policy 2: Users can insert messages ONLY if a valid conversation context exists (confirmed/completed booking)
CREATE POLICY "Users can send messages if booking exists"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE 
        (status = 'confirmed' OR status = 'completed') AND
        (
          (practice_id = auth.uid() AND locum_id = receiver_id) OR
          (locum_id = auth.uid() AND practice_id = receiver_id)
        )
    )
  )
);
