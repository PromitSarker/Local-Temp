import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, parseISO, format } from 'date-fns';

export interface LocumStats {
  upcomingShifts: number;
  monthlyEarnings: number;
  hoursThisWeek: number;
  averageRating: number;
  totalReviews: number;
}

export interface LocumInvoiceData {
  id: string;
  invoice_number: string;
  date: string;
  amount: string;
  status: string;
  pdf_url?: string;
  practice_name: string;
}

export interface LocumEarningsData {
  day: string;
  amount: number;
}

export const useLocumDashboard = () => {
  const [stats, setStats] = useState<LocumStats>({
    upcomingShifts: 0,
    monthlyEarnings: 0,
    hoursThisWeek: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [earningsData, setEarningsData] = useState<LocumEarningsData[]>([]);
  const [invoices, setInvoices] = useState<LocumInvoiceData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocumData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Locum Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!profile) return;

      const locumId = profile.id;
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      // 2. Fetch Bookings for Stats
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, date, start_time, end_time, hourly_rate, status, payment_status')
        .eq('locum_id', locumId) as any;

      let monthlyEarnings = 0;
      let hoursThisWeek = 0;
      let upcomingCount = 0;
      let weekEarningsByDay: Record<string, number> = {
        'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
      };

      if (bookings) {
        bookings.forEach(b => {
          const bDate = parseISO(b.date);
          const [sh, sm] = b.start_time.split(':').map(Number);
          const [eh, em] = b.end_time.split(':').map(Number);
          let durationMins = (eh * 60 + em) - (sh * 60 + sm);
          if (durationMins < 0) durationMins += 24 * 60;
          const hours = durationMins / 60;
          const shiftEarnings = b.hourly_rate * hours;

          // Monthly earnings (completed/confirmed paid)
          if (isWithinInterval(bDate, { start: monthStart, end: monthEnd })) {
            if (b.payment_status === 'paid' || b.payment_status === 'held' || b.payment_status === 'released') {
              monthlyEarnings += shiftEarnings;
            }
          }

          // Hours this week
          if (isWithinInterval(bDate, { start: weekStart, end: weekEnd })) {
            if (b.status === 'confirmed' || b.status === 'completed') {
              hoursThisWeek += hours;
              const dayName = format(bDate, 'EEE');
              if (weekEarningsByDay[dayName] !== undefined) {
                weekEarningsByDay[dayName] += shiftEarnings;
              }
            }
          }

          // Upcoming count
          if (b.status === 'confirmed' && bDate >= now) {
            upcomingCount++;
          }
        });
      }

      // 3. Fetch Reviews for Rating
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', locumId);

      let avgRating = 0;
      let reviewCount = 0;
      if (reviews && reviews.length > 0) {
        reviewCount = reviews.length;
        avgRating = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviewCount;
      }

      setStats({
        upcomingShifts: upcomingCount,
        monthlyEarnings,
        hoursThisWeek,
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalReviews: reviewCount
      });

      setEarningsData([
        { day: 'Mon', amount: weekEarningsByDay['Mon'] },
        { day: 'Tue', amount: weekEarningsByDay['Tue'] },
        { day: 'Wed', amount: weekEarningsByDay['Wed'] },
        { day: 'Thu', amount: weekEarningsByDay['Thu'] },
        { day: 'Fri', amount: weekEarningsByDay['Fri'] },
        { day: 'Sat', amount: weekEarningsByDay['Sat'] },
        { day: 'Sun', amount: weekEarningsByDay['Sun'] },
      ]);

      // 4. Fetch Invoices
      const { data: invoiceRows } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          generated_at,
          amount_total,
          signed_url,
          booking:bookings!inner(
            locum_id,
            practice:profiles!bookings_practice_id_fkey(full_name, practice_name)
          )
        `)
        .eq('booking.locum_id', locumId)
        .order('generated_at', { ascending: false }) as any;

      const formattedInvoices: LocumInvoiceData[] = (invoiceRows || []).map((inv: any) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        date: new Date(inv.generated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        amount: `£${inv.amount_total}`,
        status: 'Paid',
        pdf_url: inv.signed_url,
        practice_name: inv.booking?.practice?.practice_name || inv.booking?.practice?.full_name || 'Practice'
      }));

      setInvoices(formattedInvoices);

    } catch (error) {
      console.error('Error fetching locum dashboard data:', error);
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
      await fetchLocumData();
      
      return data;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchLocumData();
  }, [fetchLocumData]);

  return {
    stats,
    earningsData,
    invoices,
    loading,
    refresh: fetchLocumData,
    generateInvoice
  };
};
