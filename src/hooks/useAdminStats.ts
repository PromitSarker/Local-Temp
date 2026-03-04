import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  totalUsers: number;
  activeLocums: number;
  activePractices: number;
  activeThisWeek: number;
  totalBookings: number;
  totalRevenue: number;
  pendingPayouts: number;
  activeDisputes: number;
}

export interface AdminActivity {
  id: string;
  title: string;
  desc: string;
  timestamp: string;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface AdminTransaction {
  id: string;
  date: string;
  practice: string;
  locum: string;
  practicePayment: number;
  adminMargin: number;
  locumPayout: number;
  status: string;
}

export interface LocumRateInfo {
  id: string;
  name: string;
  baseRate: number;
  adminMargin: number;
  finalPrice: number;
}

export interface Ticket {
  id: string;
  booking_id: string;
  creator_id: string;
  subject: string;
  description: string;
  status: "open" | "resolved" | "closed";
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  creator_name?: string;
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeLocums: 0,
    activePractices: 0,
    activeThisWeek: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingPayouts: 0,
    activeDisputes: 0,
  });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [revenueTrends, setRevenueTrends] = useState<ChartData[]>([]);
  const [bookingTrends, setBookingTrends] = useState<ChartData[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [locumRates, setLocumRates] = useState<LocumRateInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      // 1. Fetch total users & active locums
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_type");
      
      if (profilesError) throw profilesError;

      const totalUsers = profiles?.length || 0;
      const activeLocums = profiles?.filter(p => p.user_type === 'locum').length || 0;
      const activePractices = profiles?.filter(p => p.user_type === 'practice').length || 0;
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const activeThisWeek = profiles?.filter(p => new Date(p.created_at) >= oneWeekAgo).length || 0;

      // 2. Fetch bookings stats
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, total_amount, payment_status, status");

      if (bookingsError) throw bookingsError;

      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const activeDisputes = bookings?.filter(b => b.status === 'disputed').length || 0;
      const pendingPayouts = bookings?.filter(b => b.payment_status === 'held').length || 0;

      setStats({
        totalUsers,
        activeLocums,
        activePractices,
        activeThisWeek,
        totalBookings,
        totalRevenue,
        pendingPayouts,
        activeDisputes,
      });

      // 3. Fetch recent activities
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select(`
            id, 
            created_at, 
            status,
            locum:profiles!bookings_locum_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentTickets } = await supabase
        .from('tickets')
        .select(`
            id, 
            created_at, 
            subject,
            creator:profiles!tickets_creator_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      const combined: AdminActivity[] = [
        ...(recentBookings || []).map((b: any) => ({
            id: b.id,
            title: `New Booking ${b.status}`,
            desc: `${b.locum?.full_name || 'Locum'} - ${new Date(b.created_at).toLocaleTimeString()}`,
            type: 'success' as const,
            timestamp: b.created_at
        })),
        ...(recentTickets || []).map((t: any) => ({
            id: t.id,
            title: `New Ticket: ${t.subject}`,
            desc: `From ${t.creator?.full_name || 'User'}`,
            type: 'info' as const,
            timestamp: t.created_at
        }))
      ].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

      setActivities(combined);

      // 4. Fetch Historical Data (Last 9 months for charts)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonth = new Date().getMonth();
      const trendData: ChartData[] = [];
      const volumeData: ChartData[] = [];

      for (let i = 8; i >= 0; i--) {
        const d = new Date();
        d.setMonth(currentMonth - i);
        const monthName = months[d.getMonth()];
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const { data: monthBookings } = await supabase
          .from('bookings')
          .select('total_amount')
          .gte('date', firstDay)
          .lte('date', lastDay);

        const revenue = monthBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
        trendData.push({ name: monthName, value: revenue });
        volumeData.push({ name: monthName, value: monthBookings?.length || 0 });
      }

      setRevenueTrends(trendData);
      setBookingTrends(volumeData);

      // 5. Fetch Transactions
      const { data: txData } = await supabase
        .from('bookings')
        .select(`
          id,
          date,
          total_amount,
          status,
          payment_status,
          hourly_rate,
          start_time,
          end_time,
          locum:profiles!bookings_locum_id_fkey(full_name),
          practice:profiles!bookings_practice_id_fkey(full_name, practice_name)
        `)
        .order('date', { ascending: false })
        .limit(50);

      const formattedTx: AdminTransaction[] = (txData || []).map((b: any) => {
        const [sh, sm] = b.start_time.split(':').map(Number);
        const [eh, em] = b.end_time.split(':').map(Number);
        const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
        const locumPayout = b.hourly_rate * (hours || 0);
        const practicePayment = b.total_amount || 0;
        
        return {
          id: b.id,
          date: b.date,
          practice: b.practice?.practice_name || b.practice?.full_name || 'Practice',
          locum: b.locum?.full_name || 'Locum',
          practicePayment,
          adminMargin: practicePayment - locumPayout,
          locumPayout,
          status: b.payment_status || b.status
        };
      });
      setTransactions(formattedTx);

      // 6. Fetch Locum Rates
      const { data: rateData } = await supabase
        .from('profiles')
        .select('id, full_name, hourly_rate')
        .eq('user_type', 'locum')
        .order('full_name');

      const formattedRates: LocumRateInfo[] = (rateData || []).map((p: any) => ({
        id: p.id,
        name: p.full_name,
        baseRate: p.hourly_rate || 0,
        adminMargin: (p.hourly_rate || 0) * 0.1, // Example 10%
        finalPrice: (p.hourly_rate || 0) * 1.1
      }));
      setLocumRates(formattedRates);

    } catch (error) {
      console.error("Error fetching admin stats:", error);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          creator:profiles!tickets_creator_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedTickets: Ticket[] = (data || []).map((t: any) => ({
        ...t,
        creator_name: t.creator?.full_name || "Unknown User",
      }));

      setTickets(formattedTickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  }, []);

  const updateTicketStatus = async (ticketId: string, status: Ticket["status"], notes?: string) => {
    try {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (status === "resolved") {
        updateData.resolved_at = new Date().toISOString();
        if (notes) updateData.resolution_notes = notes;
      }

      const { error } = await supabase
        .from("tickets")
        .update(updateData)
        .eq("id", ticketId);

      if (error) throw error;

      // Refresh tickets
      await fetchTickets();
    } catch (error) {
      console.error("Error updating ticket status:", error);
      throw error;
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchTickets()]);
      setLoading(false);
    };
    init();
  }, [fetchStats, fetchTickets]);

  return {
    stats,
    tickets,
    activities,
    revenueTrends,
    bookingTrends,
    transactions,
    locumRates,
    loading,
    refresh: async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchTickets()]);
      setLoading(false);
    },
    updateTicketStatus,
  };
}
