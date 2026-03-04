import { Menu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NotificationPopover } from "@/components/NotificationPopover";

interface PracticeHeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle: () => void;
}

export function PracticeHeader({ title, subtitle, onMenuToggle }: PracticeHeaderProps) {
  const [initials, setInitials] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, practice_name')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          const name = profile.practice_name || profile.full_name || 'Practice';
          const inits = name
            .split(' ')
            .filter(Boolean)
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          setInitials(inits || 'P');
        }
      } catch (error) {
        console.error("Error fetching practice profile:", error);
      } finally {
        setLoading(false);
      }
    };
    getProfile();
  }, []);

  return (
    <header className="bg-background border-b border-border px-4 md:px-8 py-4 md:py-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden flex-shrink-0"
          onClick={onMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm md:text-base text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <NotificationPopover viewAllPath="/practice-dashboard/notifications" />
        
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0 shadow-sm ring-2 ring-emerald-50/50">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            initials
          )}
        </div>
      </div>
    </header>
  );
}
