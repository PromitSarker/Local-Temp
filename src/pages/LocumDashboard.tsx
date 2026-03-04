import { Routes, Route, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LocumSidebar } from "@/components/locum/LocumSidebar";
import { LocumHeader } from "@/components/locum/LocumHeader";
import { DashboardOverview } from "@/components/locum/sections/DashboardOverview";
import { ShiftsSection } from "@/components/locum/sections/ShiftsSection";
import { ProfileSection } from "@/components/locum/sections/ProfileSection";
import { DocumentsSection } from "@/components/locum/sections/DocumentsSection";
import { PaymentsSection } from "@/components/locum/sections/PaymentsSection";
import { NotificationsSection } from "@/components/locum/sections/NotificationsSection";
import { MessagesSection } from "@/components/locum/sections/MessagesSection";
import { SettingsSection } from "@/components/locum/sections/SettingsSection";
import { useLocumProfile } from "@/hooks/useLocumProfile";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LocumSidebar as MobileSidebar } from "@/components/locum/LocumSidebar";

export default function LocumDashboard() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, completionPercentage, isProfileComplete, uploadDocument } =
    useLocumProfile();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <LocumSidebar onLogout={handleLogout} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <MobileSidebar onLogout={handleLogout} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className={cn("transition-all duration-300", "md:ml-64")}>
        <LocumHeader
          userName={profile.basicInfo.name}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />

        <main className="p-4 md:p-6">
          <Routes>
            <Route
              index
              element={
                <DashboardOverview
                  userName={profile.basicInfo.name}
                  completionPercentage={completionPercentage}
                  isProfileComplete={isProfileComplete}
                  reliabilityScore={profile.reliabilityScore}
                />
              }
            />
            <Route
              path="shifts"
              element={<ShiftsSection isProfileComplete={isProfileComplete} />}
            />
            <Route
              path="profile"
              element={
                <ProfileSection
                  profile={profile}
                  completionPercentage={completionPercentage}
                  isProfileComplete={isProfileComplete}
                />
              }
            />
            <Route
              path="documents"
              element={
                <DocumentsSection
                  documents={profile.documents}
                  completionPercentage={completionPercentage}
                  isProfileComplete={isProfileComplete}
                  onUpload={uploadDocument}
                />
              }
            />
            <Route
              path="payments"
              element={
                <PaymentsSection isProfileComplete={isProfileComplete} />
              }
            />
            <Route path="notifications" element={<NotificationsSection />} />
            <Route path="messages" element={<MessagesSection />} />
            <Route path="settings" element={<SettingsSection />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
