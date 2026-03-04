import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, parseISO, format } from 'date-fns';

export interface PaymentData {
  id: string;
  locum: string;
  initials: string;
  invoice: string;
  date: string;
  hours: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Processing';
}

export interface InvoiceData {
  id: string;
  locum: string;
  initials: string;
  date: string;
  dueDate: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Processing';
  pdf_url?: string;
}

export const usePracticePayments = () => {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [chartData, setChartData] = useState<{ month: string, spending: number }[]>([]);
  const [specialtyData, setSpecialtyData] = useState<{ name: string, value: number, color: string }[]>([]);
  const [stats, setStats] = useState({
    totalPaid: 0,
    countPaid: 0,
    totalPending: 0,
    countPending: 0,
    thisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!profile) return;

      const practiceId = profile.id;

      // 1. Fetch Payments (Bookings that are paid or held)
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          id,
          date,
          start_time,
          end_time,
          hourly_rate,
          payment_status,
          locum:profiles!bookings_locum_id_fkey(full_name, job_type)
        `)
        .eq('practice_id', practiceId)
        .in('payment_status', ['paid', 'held', 'released', 'pending'])
        .order('date', { ascending: false }) as any;

      let totalPaid = 0;
      let countPaid = 0;
      let totalPending = 0;
      let countPending = 0;
      let thisMonth = 0;
      const now = new Date();
      const monthStart = startOfMonth(now);

      const monthlyBuckets: Record<string, number> = {
        'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'May': 0, 'Jun': 0,
        'Jul': 0, 'Aug': 0, 'Sep': 0, 'Oct': 0, 'Nov': 0, 'Dec': 0
      };

      const specialtyMap = new Map<string, number>();

      const formattedPayments: PaymentData[] = (bookings || []).map((b: any) => {
        const [sh, sm] = b.start_time.split(':').map(Number);
        const [eh, em] = b.end_time.split(':').map(Number);
        const durationMins = (eh * 60 + em) - (sh * 60 + sm);
        const hours = durationMins > 0 ? durationMins / 60 : 0;
        const amount = b.hourly_rate * hours;
        const name = b.locum?.full_name || 'Unknown Locum';
        
        const isPaid = b.payment_status === 'paid' || b.payment_status === 'released' || b.payment_status === 'held';

        if (isPaid) {
          totalPaid += amount;
          countPaid++;
          
          const bookingDate = parseISO(b.date);
          if (bookingDate >= monthStart) {
            thisMonth += amount;
          }

          // Aggregate for monthly chart (this year)
          if (bookingDate.getFullYear() === now.getFullYear()) {
            const monthKey = format(bookingDate, 'MMM');
            monthlyBuckets[monthKey] = (monthlyBuckets[monthKey] || 0) + amount;
          }

          // Aggregate for specialty chart
          const specialty = b.locum?.job_type?.[0] || 'General Dentist';
          specialtyMap.set(specialty, (specialtyMap.get(specialty) || 0) + amount);
        } else if (b.payment_status === 'pending') {
          totalPending += amount;
          countPending++;
        }

        return {
          id: b.id,
          locum: name,
          initials: name.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2),
          invoice: `INV-${b.id.slice(0, 8).toUpperCase()}`,
          date: format(parseISO(b.date), 'dd MMM yyyy'),
          hours: durationMins % 60 === 0 ? `${hours}h` : `${Math.floor(hours)}h ${durationMins % 60}m`,
          amount: `£${amount.toFixed(2)}`,
          status: (isPaid ? 'Paid' : b.payment_status === 'pending' ? 'Pending' : 'Processing') as any
        };
      });

      // Prepare Chart Data
      const chartDataLine = Object.entries(monthlyBuckets).map(([month, spending]) => ({
        month,
        spending: Math.round(spending)
      }));

      const colors = ["#047857", "#059669", "#10b981", "#34d399", "#6ee7b7"];
      const specialtyDataPie = Array.from(specialtyMap.entries())
        .map(([name, value], index) => ({
          name,
          value: Math.round(value),
          color: colors[index % colors.length]
        }))
        .sort((a, b) => b.value - a.value);

      setStats({
        totalPaid,
        countPaid,
        totalPending,
        countPending,
        thisMonth
      });

      // 2. Fetch Invoices
      const { data: invoiceRowsCorrected } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          generated_at,
          amount_total,
          signed_url,
          booking:bookings!inner(
            practice_id,
            locum:profiles!bookings_locum_id_fkey(full_name)
          )
        `)
        .eq('booking.practice_id', practiceId)
        .order('generated_at', { ascending: false }) as any;

      const formattedInvoices: InvoiceData[] = (invoiceRowsCorrected || []).map((inv: any) => {
        const name = inv.booking?.locum?.full_name || 'Unknown Locum';
        return {
          id: inv.invoice_number,
          locum: name,
          initials: name.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2),
          date: format(parseISO(inv.generated_at), 'dd MMM yyyy'),
          dueDate: format(new Date(new Date(inv.generated_at).getTime() + 7 * 24 * 60 * 60 * 1000), 'dd MMM yyyy'),
          amount: `£${inv.amount_total}`,
          status: 'Paid',
          pdf_url: inv.signed_url
        };
      });

      setPayments(formattedPayments);
      setInvoices(formattedInvoices);
      setChartData(chartDataLine);
      setSpecialtyData(specialtyDataPie);

    } catch (error) {
      console.error('Error fetching practice payments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateInvoice = async (bookingId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { bookingId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Refresh data to show the new invoice
      await fetchData();
      
      return data;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    payments, 
    invoices, 
    chartData, 
    specialtyData, 
    stats, 
    loading, 
    refresh: fetchData,
    generateInvoice
  };
};
