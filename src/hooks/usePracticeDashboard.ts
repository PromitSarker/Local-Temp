import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

export interface DashboardStats {
  activeBookings: number;
  availableLocums: number;
  monthlySpending: number;
  completedShifts: number;
}

export interface SpendingData {
  week: string;
  amount: number;
}

export interface DashboardBooking {
  id: string;
  locum: string;
  date: Date;
  dateText: string;
  time: string;
  rate: string;
  status: 'Confirmed' | 'Pending';
}

export const usePracticeDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    activeBookings: 0,
    availableLocums: 0,
    monthlySpending: 0,
    completedShifts: 0
  });
  const [upcomingBookings, setUpcomingBookings] = useState<DashboardBooking[]>([]);
  const [spendingData, setSpendingData] = useState<SpendingData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
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
      const now = new Date();
      const firstDay = startOfMonth(now);
      const lastDay = endOfMonth(now);

      // Active confirmed bookings count
      const { count: activeCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('practice_id', practiceId)
        .eq('status', 'confirmed')
        .gte('date', now.toISOString().split('T')[0]);

      // Total registered locums on platform
      const { count: locumsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'locum');

      // All bookings this month — used for stats AND chart
      const { data: monthBookings } = await supabase
        .from('bookings')
        .select('date, hourly_rate, start_time, end_time, payment_status, status')
        .eq('practice_id', practiceId)
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0])
        .order('date', { ascending: true }) as any;

      let spending = 0;
      let completed = 0;

      // Real weekly buckets: days 1–7 = Week 1, 8–14 = Week 2, 15–21 = Week 3, 22+ = Week 4
      const weekBuckets: Record<string, number> = {
        'Week 1': 0, 'Week 2': 0, 'Week 3': 0, 'Week 4': 0,
      };

      const getWeekKey = (dayOfMonth: number): string => {
        if (dayOfMonth <= 7)  return 'Week 1';
        if (dayOfMonth <= 14) return 'Week 2';
        if (dayOfMonth <= 21) return 'Week 3';
        return 'Week 4';
      };

      if (monthBookings) {
        monthBookings.forEach((b: any) => {
          const [sh, sm] = b.start_time.split(':').map(Number);
          const [eh, em] = b.end_time.split(':').map(Number);
          const durationMins = (eh * 60 + em) - (sh * 60 + sm);
          const hours = durationMins > 0 ? durationMins / 60 : 0;
          const shiftCost = b.hourly_rate * hours;

          const isPaid =
            b.payment_status === 'paid' ||
            b.payment_status === 'released' ||
            b.payment_status === 'held';

          if (isPaid) {
            spending += shiftCost;
            const dayOfMonth = new Date(b.date).getDate();
            weekBuckets[getWeekKey(dayOfMonth)] += shiftCost;
          }

          if (b.status === 'completed') completed++;
        });
      }

      // Upcoming bookings list (for dashboard table)
      const { data: upcoming } = await supabase
        .from('bookings')
        .select(`
          id,
          date,
          start_time,
          end_time,
          hourly_rate,
          status,
          locum:profiles!bookings_locum_id_fkey(full_name)
        `)
        .eq('practice_id', practiceId)
        .in('status', ['confirmed', 'pending'])
        .gte('date', now.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(5);

      const formattedUpcoming: DashboardBooking[] = (upcoming || []).map((b: any) => {
        const [sh, sm] = b.start_time.split(':').map(Number);
        const [eh, em] = b.end_time.split(':').map(Number);
        const durationMins = (eh * 60 + em) - (sh * 60 + sm);
        const hours = durationMins > 0 ? durationMins / 60 : 0;
        return {
          id: b.id,
          locum: b.locum?.full_name || 'Unknown Locum',
          date: parseISO(b.date),
          dateText: new Date(b.date).toLocaleDateString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short'
          }),
          time: `${b.start_time.slice(0, 5)} - ${b.end_time.slice(0, 5)}`,
          rate: `£${(b.hourly_rate * hours).toFixed(0)}`,
          status: b.status === 'confirmed' ? 'Confirmed' : 'Pending'
        };
      });

      setStats({
        activeBookings: activeCount || 0,
        availableLocums: locumsCount || 0,
        monthlySpending: spending,
        completedShifts: completed
      });
      setUpcomingBookings(formattedUpcoming);

      // Chart: real weekly spending aggregated from actual paid bookings
      setSpendingData([
        { week: 'Week 1', amount: Math.round(weekBuckets['Week 1']) },
        { week: 'Week 2', amount: Math.round(weekBuckets['Week 2']) },
        { week: 'Week 3', amount: Math.round(weekBuckets['Week 3']) },
        { week: 'Week 4', amount: Math.round(weekBuckets['Week 4']) },
      ]);

    } catch (error) {
      console.error('Error fetching practice dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    upcomingBookings,
    spendingData,
    loading,
    refresh: fetchDashboardData
  };
};
