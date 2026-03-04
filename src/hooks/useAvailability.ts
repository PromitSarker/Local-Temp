import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface Availability {
  id: string;
  user_id: string;
  date: string;
  is_available: boolean;
}

export function useAvailability() {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailability = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("availability")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const toggleAvailability = useCallback(async (date: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = format(date, "yyyy-MM-dd");
      const existing = availability.find((a) => a.date === dateStr);

      if (existing) {
        const { error } = await supabase
          .from("availability")
          .update({ is_available: !existing.is_available })
          .eq("id", existing.id);
        if (error) throw error;

        setAvailability(prev => prev.map(a => a.id === existing.id ? { ...a, is_available: !a.is_available } : a));
      } else {
        const { data, error } = await supabase
          .from("availability")
          .insert({
            user_id: user.id,
            date: dateStr,
            is_available: false, // Default to unavailable when "crossed out"
            start_time: "00:00:00",
            end_time: "23:59:59"
          })
          .select()
          .single();
        if (error) throw error;
        setAvailability(prev => [...prev, data]);
      }
    } catch (error) {
      console.error("Error toggling availability:", error);
    }
  }, [availability]);

  const updateAvailability = useCallback(async (date: Date, isAvailable: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = format(date, "yyyy-MM-dd");
      const existing = availability.find((a) => a.date === dateStr);

      if (existing) {
        const { error } = await supabase
          .from("availability")
          .update({ is_available: isAvailable })
          .eq("id", existing.id);
        if (error) throw error;

        setAvailability(prev => prev.map(a => a.id === existing.id ? { ...a, is_available: isAvailable } : a));
      } else {
        const { data, error } = await supabase
          .from("availability")
          .insert({
            user_id: user.id,
            date: dateStr,
            is_available: isAvailable,
            start_time: "00:00:00",
            end_time: "23:59:59"
          })
          .select()
          .single();
        if (error) throw error;
        setAvailability(prev => [...prev, data]);
      }
    } catch (error) {
      console.error("Error updating availability:", error);
    }
  }, [availability]);

  return {
    availability,
    loading,
    toggleAvailability,
    updateAvailability,
    refresh: fetchAvailability
  };
}
