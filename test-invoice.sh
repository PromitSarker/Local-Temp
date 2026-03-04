#!/bin/bash

# Test generate-invoice Edge Function

echo "Testing invoice generation..."

SUPABASE_URL="https://symrdtyghvrvkktsvucc.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5bXJkdHlnaHZydmtrdHN2dWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDU5MzcsImV4cCI6MjA4NTY4MTkzN30.t8TU0FAmcSgCL7FFFv1bKhh2rgyIUX0BAExeamyC-y0"

# Replace with an actual booking ID from your database
BOOKING_ID="your-booking-id-here"

curl -X POST "${SUPABASE_URL}/functions/v1/generate-invoice" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"bookingId\": \"${BOOKING_ID}\"}"

echo ""
echo "If successful, you'll receive a signed URL to download the invoice PDF"
