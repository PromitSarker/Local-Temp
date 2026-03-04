#!/bin/bash

# Test send-email Edge Function
# Make sure to run this after deploying the function

echo "Testing send-email function..."

SUPABASE_URL="https://symrdtyghvrvkktsvucc.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5bXJkdHlnaHZydmtrdHN2dWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDU5MzcsImV4cCI6MjA4NTY4MTkzN30.t8TU0FAmcSgCL7FFFv1bKhh2rgyIUX0BAExeamyC-y0"

curl -X POST "${SUPABASE_URL}/functions/v1/send-email" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "promitwho@gmail.com",
    "subject": "✅ Test Email from Local Smile Connect",
    "html": "<h1>Success!</h1><p>Your email system is working correctly!</p><p>This confirms that the <code>send-email</code> Edge Function is operational.</p>"
  }'

echo ""
echo "Check the response above. If you see an error about the function not being deployed, run:"
echo "supabase functions deploy send-email --no-verify-jwt"
