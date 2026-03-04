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
import { PracticeHeader } from "@/components/practice/PracticeHeader";


export default function PracticePayments() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  return (
    <div className="min-h-screen bg-background">
      <PracticeSidebar onLogout={() => navigate("/login")} />

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <PracticeSidebar onLogout={() => navigate("/login")} isMobileSheet={true} />
        </SheetContent>
      </Sheet>

      <main className="md:ml-64 min-h-screen">
        <PracticeHeader
          title="Payments & Invoices"
          subtitle="Track expenses and manage invoices for dental locum services"
          onMenuToggle={() => setMobileMenuOpen(true)}
        />


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
