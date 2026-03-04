import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Ticket {
  id: string;
  booking_id: string;
  creator_id: string;
  subject: string;
  description: string;
  status: 'open' | 'resolved' | 'closed';
  resolution_notes?: string;
  created_at: string;
}

export function useTickets(bookingId?: string) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      let query = (supabase.from('tickets' as any) as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingId) {
        query = query.eq('booking_id', bookingId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets((data || []) as any as Ticket[]);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [bookingId]);

  const createTicket = async (booking_id: string, subject: string, description: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!profile) throw new Error("Profile not found");

      const { data, error } = await (supabase.from('tickets' as any) as any)
        .insert({
          booking_id,
          creator_id: profile.id,
          subject,
          description
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchTickets(); // Refetch tickets after creation
      return { data, error: null };
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      return { data: null, error };
    }
  };

  return {
    tickets,
    loading,
    createTicket,
    refetch: fetchTickets
  };
}
