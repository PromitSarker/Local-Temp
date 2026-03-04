import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTickets } from "./useTickets";



export interface Booking {
  id: string;
  practice_id: string;
  date: string;
  start_time: string;
  end_time: string;
  hourly_rate: number;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected";
  created_at: string;
  practice?: {
    name: string;
    address: string;
  };
}

export function useShifts() {
  const [requests, setRequests] = useState<Booking[]>([]);
  const [upcomingShifts, setUpcomingShifts] = useState<Booking[]>([]);
  const [completedShifts, setCompletedShifts] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { createTicket } = useTickets();

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          *,
          practice:profiles!bookings_practice_id_fkey(
            full_name,
            practice_name,
            city
          )
        `)
        .eq("locum_id", profile.id)
        .order("date", { ascending: true });

      if (error) throw error;

      if (bookings) {
        const formattedBookings = bookings.map((b: any) => ({
          ...b,
          practice: {
            name: b.practice?.practice_name || b.practice?.full_name || 'Unknown Practice',
            address: b.practice?.city || 'Unknown Location'
          }
        }));

        setRequests(formattedBookings.filter((b: Booking) => b.status === 'pending'));
        setUpcomingShifts(formattedBookings.filter((b: Booking) => b.status === 'confirmed'));
        setCompletedShifts(formattedBookings.filter((b: Booking) => b.status === 'completed'));
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'rejected' | 'completed') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
      
      await fetchShifts();
    } catch (error) {
      console.error(`Error updating booking status to ${status}:`, error);
      throw error;
    }
  };

  return {
    requests,
    upcomingShifts,
    completedShifts,
    loading,
    acceptBooking: (id: string) => updateBookingStatus(id, 'confirmed'),
    declineBooking: (id: string) => updateBookingStatus(id, 'rejected'),
    completeShift: (id: string) => updateBookingStatus(id, 'completed'),
    requestRefund: async (id: string, reason: string) => {
        return await createTicket(id, "Refund Request", reason);
    },
    refetch: fetchShifts,
  };
}
