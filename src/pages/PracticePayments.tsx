import { useNavigate } from "react-router-dom";
import { PracticeSidebar } from "@/components/practice/PracticeSidebar";
import { PaymentStatsCards } from "@/components/practice/payments/PaymentStatsCards";
import { MonthlySpendingChart } from "@/components/practice/payments/MonthlySpendingChart";
import { SpecialtyChart } from "@/components/practice/payments/SpecialtyChart";
import { PaymentsTable } from "@/components/practice/payments/PaymentsTable";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function PracticePayments() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [initials, setInitials] = useState("P");

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, practice_name')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        const name = profile.practice_name || profile.full_name || 'Practice';
        const inits = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        setInitials(inits);
      }
    };
    getProfile();
  }, []);

  const handleLogout = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <PracticeSidebar onLogout={handleLogout} />

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <PracticeSidebar onLogout={handleLogout} isMobileSheet={true} />
        </SheetContent>
      </Sheet>

      <main className="md:ml-64 min-h-screen">
        <header className="bg-background border-b border-border px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                Payments & Invoices
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Track expenses and manage invoices for dental locum services
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
            {initials}
          </div>
        </header>

        <section className="p-4 md:p-8 space-y-4 md:space-y-6">
          <PaymentStatsCards />

          <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
            <MonthlySpendingChart />
            <SpecialtyChart />
          </div>

          <PaymentsTable />
        </section>
      </main>
    </div>
  );
}
