import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PublicProfile {
  id: string;
  fullName: string;
  city: string;
  jobType: string[];
  hourlyRate: number;
  bio: string;
  reliabilityScore: number;
  skills: string[];
  reviews: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    reviewerName: string;
  }[];
  availability: {
    day: string;
    isAvailable: boolean;
  }[];
}

export function usePublicLocumProfile(locumId: string | null) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locumId) {
      setProfile(null);
      return;
    }

    const fetchPublicProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch basic profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", locumId)
          .single();

        if (profileError) throw profileError;

        // Fetch skills
        const { data: skillsData } = await supabase
          .from("user_skills")
          .select("skills(name)")
          .eq("user_id", profileData.user_id);

        const skills = skillsData?.map((s: any) => s.skills.name) || [];

        // Fetch availability
        const { data: availabilityData } = await supabase
          .from("availability")
          .select("date, is_available")
          .eq("user_id", profileData.user_id);

        // Map to weekly view for simplicity in this dialog
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const weeklyAvailability = days.map(day => ({
          day,
          isAvailable: true // Default to true or implement complex mapping from date-based availability
        }));

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("*, profiles!reviews_reviewer_id_fkey(full_name)")
          .eq("reviewee_id", locumId)
          .order("created_at", { ascending: false })
          .limit(5);

        const reviews = reviewsData?.map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.created_at,
          reviewerName: r.profiles?.full_name || "Anonymous Practice",
        })) || [];

        setProfile({
          id: profileData.id,
          fullName: profileData.full_name,
          city: profileData.city || "Not specified",
          jobType: profileData.job_type || [],
          hourlyRate: profileData.hourly_rate || 0,
          bio: profileData.bio || "No biography provided.",
          reliabilityScore: profileData.reliability_score || 100,
          skills,
          reviews,
          availability: weeklyAvailability,
        });
      } catch (err: any) {
        console.error("Error fetching public profile:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [locumId]);

  return { profile, loading, error };
}
