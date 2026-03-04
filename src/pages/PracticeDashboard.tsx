import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Calendar,
  Users,
  DollarSign,
  Search,
  MessageSquare,
  CheckCircle,
  ChevronRight,
  TrendingUp,
  X,
  Menu,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PracticeSidebar } from "@/components/practice/PracticeSidebar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useState, useMemo, useEffect } from "react";
import { format, isSameDay } from "date-fns";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

import { usePracticeDashboard } from "@/hooks/usePracticeDashboard";

export default function PracticeDashboard() {
  const navigate = useNavigate();
  const { stats, upcomingBookings, spendingData, loading } = usePracticeDashboard();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [initials, setInitials] = useState("PM");

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

  // Get booking dates for calendar highlighting
  const bookingDates = useMemo(() => {
    return upcomingBookings.map((booking) => booking.date);
  }, [upcomingBookings]);

  // Find selected booking
  const selectedBooking = selectedDate
    ? upcomingBookings.find((b) => isSameDay(b.date, selectedDate))
    : undefined;

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && upcomingBookings.some((b) => isSameDay(b.date, date))) {
      setShowBookingPanel(true);
    } else {
      setShowBookingPanel(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
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

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-background border-b border-border px-4 md:px-8 py-4 md:py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
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
                Practice Dashboard
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Here's what's happening with your practice today
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0 shadow-sm ring-2 ring-emerald-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : initials}
          </div>
        </header>

        <div className="p-4 md:p-8 space-y-4 md:space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          
          {!loading && (
            <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="p-6 border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-1">
                Active Bookings
              </p>
              <p className="text-3xl font-bold text-foreground">{stats.activeBookings}</p>
              <p className="text-sm text-primary flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4" />
                Upcoming confirm/pending
              </p>
            </Card>

            <Card className="p-6 border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-1">
                Available Locums
              </p>
              <p className="text-3xl font-bold text-foreground">{stats.availableLocums}</p>
              <p className="text-sm text-muted-foreground mt-2">In the network</p>
            </Card>

            <Card className="p-6 border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-1">This Month</p>
              <p className="text-3xl font-bold text-foreground">£{stats.monthlySpending.toLocaleString()}</p>
              <p className="text-sm text-primary flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4" />
                Total paid shifts
              </p>
            </Card>

            <Card className="p-6 border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-1">
                Completed Shifts
              </p>
              <p className="text-3xl font-bold text-foreground">{stats.completedShifts}</p>
              <p className="text-sm text-muted-foreground mt-2">This month</p>
            </Card>
          </div>

          {/* Monthly Spending Chart */}
          <Card className="p-4 md:p-6 border border-border">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                Monthly Spending
              </h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spendingData}>
                  <XAxis
                    dataKey="week"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                    domain={[0, 1500]}
                    ticks={[0, 300, 600, 900, 1200]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`£${value}`, "Spending"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Upcoming Bookings & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card className="p-4 md:p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Upcoming Bookings
                </h3>
                <Button
                  variant="link"
                  className="text-primary p-0 h-auto flex items-center gap-1"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                {upcomingBookings.length > 0 ? (
                  upcomingBookings.map((booking, index) => (
                    <div
                      key={index}
                      className="p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-foreground">
                          {booking.locum}
                        </p>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            booking.status === "Confirmed"
                              ? "bg-primary/10 text-primary"
                              : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm text-primary">{booking.dateText}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground">
                          {booking.time}
                        </p>
                        <p className="font-semibold text-foreground">
                          {booking.rate}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No upcoming bookings</p>
                )}
              </div>
            </Card>

            <Card className="p-4 md:p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Recent Activity
                </h3>
                <Button
                  variant="link"
                  className="text-primary p-0 h-auto flex items-center gap-1"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                {upcomingBookings.slice(0, 3).map((booking, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        booking.status === "Confirmed"
                          ? "bg-primary"
                          : "bg-yellow-500"
                      }`}
                    />
                    <div>
                      <p className="text-foreground">
                        {booking.status === 'Confirmed' ? 'Confirmed booking' : 'Pending request'} with {booking.locum}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.dateText}
                      </p>
                    </div>
                  </div>
                ))}
                {upcomingBookings.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No recent activity</p>
                )}
              </div>
            </Card>
          </div>

          {/* Calendar Section */}
          <Card className="p-4 md:p-6 border border-border">
            <h3 className="text-lg md:text-xl font-bold mb-4">
              Booking Calendar
            </h3>
            <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
              <div className="flex-1">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border pointer-events-auto"
                  modifiers={{
                    booked: bookingDates,
                  }}
                  modifiersStyles={{
                    booked: {
                      backgroundColor: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                      borderRadius: "50%",
                    },
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-primary mr-1"></span>
                  Days with bookings
                </p>
              </div>

              {/* Booking Details Side Panel */}
              {showBookingPanel && selectedBooking && (
                <div className="flex-1 bg-muted/30 rounded-lg p-4 relative animate-fade-in">
                  <button
                    onClick={() => setShowBookingPanel(false)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <h4 className="font-semibold text-lg mb-3">
                    {format(selectedBooking.date, "EEEE, MMMM d, yyyy")}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Locum</p>
                      <p className="font-medium">{selectedBooking.locum}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{selectedBooking.time}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rate</p>
                      <p className="font-medium text-primary">
                        {selectedBooking.rate}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          selectedBooking.status === "Confirmed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {selectedBooking.status}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => navigate("/practice-dashboard/messages")}>
                        Contact Locum
                      </Button>
                      <Button size="sm" onClick={() => navigate("/practice-dashboard/bookings")}>View Details</Button>
                    </div>
                  </div>
                </div>
              )}

              {!showBookingPanel && (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      Click on a booked day to view details
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
            </>
          )}

          {/* Quick Actions */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">
              Quick Actions
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-24 bg-card hover:bg-muted/50 border-input flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all"
                onClick={() => navigate("/practice-dashboard/find-locums")}
              >
                <Search className="w-5 h-5 text-primary" />
                <span className="font-medium">Find a Locum</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 bg-card hover:bg-muted/50 border-input flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all"
                onClick={() => navigate("/practice-dashboard/bookings")}
              >
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-medium">Manage Bookings</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 bg-card hover:bg-muted/50 border-input flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all"
                onClick={() => navigate("/practice-dashboard/payments")}
              >
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="font-medium">View Payments</span>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
