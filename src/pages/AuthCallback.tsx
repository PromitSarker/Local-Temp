
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth error:", error);
        toast({
          title: "Authentication Failed",
          description: error.message,
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      if (!session) {
        // Silent return if no session

        navigate("/login");
        return;
      }

      const userType = searchParams.get("type");
      
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile check error:", profileError);
        toast({
          title: "Error",
          description: "Failed to verify profile.",
          variant: "destructive",
        });
        return;
      }

      if (profile) {
        // Profile exists, redirect to dashboard
        navigate(profile.user_type === "locum" ? "/locum-dashboard" : "/practice-dashboard");
      } else if (userType === "locum" || userType === "practice") {
        // Create new profile
        const { error: createError } = await supabase
          .from("profiles")
          .insert({
            user_id: session.user.id,
            user_type: userType,
            email: session.user.email,
            full_name: session.user.user_metadata.full_name || session.user.email?.split("@")[0],
          });

        if (createError) {
          console.error("Profile creation error:", createError);
          toast({
            title: "Registration Failed",
            description: "Failed to create user profile.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          navigate("/register");
          return;
        }

        toast({
          title: "Welcome!",
          description: "Your account has been created successfully.",
        });
        navigate(userType === "locum" ? "/locum-dashboard" : "/practice-dashboard");
      } else {
        // No profile and no type specified
        toast({
          title: "Error",
          description: "User type not specified. Please try logging in again.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate("/login");
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-muted-foreground">Verifying authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
