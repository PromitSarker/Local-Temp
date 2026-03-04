#!/usr/bin/env bash
set -e

# Script to process the email queue and send emails via Resend
# This can be run as a cron job or background worker

PROJECT_ID="${VITE_SUPABASE_PROJECT_ID}"
SUPABASE_URL="${SUPABASE_URL}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

echo "Processing email queue..."

# Fetch pending emails
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/get_pending_emails" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json")

# Process each email
echo "$RESPONSE" | jq -c '.[]' | while read -r email; do
    EMAIL_ID=$(echo "$email" | jq -r '.id')
    TO_EMAIL=$(echo "$email" | jq -r '.to_email')
    TO_NAME=$(echo "$email" | jq -r '.to_name')
    SUBJECT=$(echo "$email" | jq -r '.subject')
    HTML_BODY=$(echo "$email" | jq -r '.html_body')
    
    echo "Sending email to $TO_EMAIL..."
    
    # Call send-email Edge Function
    SEND_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/send-email" \
      -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"to\": \"$TO_EMAIL\",
        \"subject\": \"$SUBJECT\",
        \"html\": $(echo "$HTML_BODY" | jq -Rs .)
      }")
    
    # Check if successful
    if echo "$SEND_RESPONSE" | jq -e '.error' > /dev/null; then
        ERROR_MSG=$(echo "$SEND_RESPONSE" | jq -r '.error')
        echo "Error sending email: $ERROR_MSG"
        
        # Mark as failed
        curl -s -X PATCH "$SUPABASE_URL/rest/v1/email_queue?id=eq.$EMAIL_ID" \
          -H "apikey: $SERVICE_ROLE_KEY" \
          -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
          -H "Content-Type: application/json" \
          -H "Prefer: return=minimal" \
          -d "{\"status\": \"failed\", \"error_message\": \"$ERROR_MSG\"}"
    else
        echo "Email sent successfully!"
        
        # Mark as sent
        curl -s -X PATCH "$SUPABASE_URL/rest/v1/email_queue?id=eq.$EMAIL_ID" \
          -H "apikey: $SERVICE_ROLE_KEY" \
          -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
          -H "Content-Type: application/json" \
          -H "Prefer: return=minimal" \
          -d "{\"status\": \"sent\", \"sent_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
    fi
done

echo "Email queue processing complete!"
