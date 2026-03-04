// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import { jsPDF } from "https://esm.sh/jspdf@2.5.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { bookingId } = await req.json();

    if (!bookingId) {
      throw new Error('bookingId is required');
    }

    // Fetch booking details with practice and locum info
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        practice:profiles!bookings_practice_id_fkey(full_name, email),
        locum:profiles!bookings_locum_id_fkey(full_name)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Calculate amounts
    const startTime = new Date(`${booking.date}T${booking.start_time}`);
    const endTime = new Date(`${booking.date}T${booking.end_time}`);
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const locumAmount = durationHours * booking.hourly_rate;
    const adminFee = locumAmount * 0.10;
    const totalAmount = locumAmount + adminFee;

    // Generate PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('INVOICE', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('Local Smile Connect', 105, 30, { align: 'center' });
    doc.text('Dental Locum Platform', 105, 35, { align: 'center' });
    
    // Invoice details
    doc.setFontSize(12);
    doc.text(`Invoice #: INV-${booking.id.substring(0, 8).toUpperCase()}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 57);
    doc.text(`Booking Date: ${new Date(booking.date).toLocaleDateString()}`, 20, 64);
    
    // Bill to
    doc.setFontSize(14);
    doc.text('Bill To:', 20, 80);
    doc.setFontSize(11);
    doc.text(booking.practice?.full_name || 'Practice', 20, 87);
    doc.text(booking.practice?.email || '', 20, 94);
    
    // Service details
    doc.setFontSize(14);
    doc.text('Service Details:', 20, 110);
    doc.setFontSize(11);
    doc.text(`Locum: ${booking.locum?.full_name || 'N/A'}`, 20, 117);
    doc.text(`Date: ${new Date(booking.date).toLocaleDateString()}`, 20, 124);
    doc.text(`Time: ${booking.start_time} - ${booking.end_time}`, 20, 131);
    doc.text(`Duration: ${durationHours} hours`, 20, 138);
    doc.text(`Hourly Rate: £${booking.hourly_rate.toFixed(2)}`, 20, 145);
    
    // Line items
    doc.setFontSize(12);
    doc.text('Description', 20, 165);
    doc.text('Amount', 170, 165);
    doc.line(20, 167, 190, 167);
    
    doc.setFontSize(11);
    doc.text(`Locum Services (${durationHours}h @ £${booking.hourly_rate}/hr)`, 20, 175);
    doc.text(`£${locumAmount.toFixed(2)}`, 170, 175);
    
    doc.text('Platform Fee (10%)', 20, 182);
    doc.text(`£${adminFee.toFixed(2)}`, 170, 182);
    
    doc.line(20, 187, 190, 187);
    
    doc.setFontSize(14);
    doc.text('Total Amount', 20, 195);
    doc.text(`£${totalAmount.toFixed(2)}`, 170, 195);
    
    // Footer
    doc.setFontSize(9);
    doc.text('Thank you for using Local Smile Connect!', 105, 270, { align: 'center' });
    doc.text('For inquiries, contact: support@localsmileconnect.com', 105, 275, { align: 'center' });
    
    // Get PDF as base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
    
    // Upload to Supabase Storage
    const fileName = `${booking.id}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('invoices')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get signed URL (valid for 1 year)
    const { data: urlData } = await supabaseClient
      .storage
      .from('invoices')
      .createSignedUrl(fileName, 31536000); // 1 year

    // Save invoice record to database
    const invoiceNumber = `INV-${booking.id.substring(0, 8).toUpperCase()}`;
    await supabaseClient
      .from('invoices')
      .insert({
        booking_id: bookingId,
        invoice_number: invoiceNumber,
        file_path: fileName,
        signed_url: urlData?.signedUrl,
        amount_total: totalAmount,
        amount_locum: locumAmount,
        amount_admin_fee: adminFee
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        invoiceUrl: urlData?.signedUrl,
        invoiceNumber: invoiceNumber,
        fileName: fileName
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('Invoice generation error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
