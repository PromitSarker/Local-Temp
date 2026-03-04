import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  userType?: "locum" | "practice";
}

export const ProtectedRoute = ({ children, userType }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [authorized, setAuthorized] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setAuthenticated(false);
          setLoading(false);
          return;
        }

        setAuthenticated(true);

        if (userType) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_type")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (profile && profile.user_type !== userType) {
            setAuthorized(false);
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthenticated(false);
      } else {
        setAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [userType]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authenticated) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!authorized) {
    // If authenticated but wrong user type, redirect to their correct dashboard
    // This is a simple logic, could be more sophisticated
    return <Navigate to={userType === "locum" ? "/practice-dashboard" : "/locum-dashboard"} replace />;
  }

  return <>{children}</>;
};
