import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PracticeSidebar } from "@/components/practice/PracticeSidebar";
import { BookingCard } from "@/components/practice/BookingCard";
import { StatCards } from "@/components/practice/StatCards";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Search, Download, Calendar as CalendarIcon, Menu, Loader2 } from "lucide-react";
import { isSameDay, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { ReviewModal } from "@/components/ReviewModal";
import { PaymentModal } from "@/components/practice/PaymentModal";
import { useToast } from "@/hooks/use-toast";
import { useTickets } from "@/hooks/useTickets";
import { PracticeHeader } from "@/components/practice/PracticeHeader";




type BookingStatus = "confirmed" | "pending" | "completed" | "cancelled" | "rejected";


interface PracticeBooking {
  id: string;
  name: string;
  specialty: string;
  status: BookingStatus;
  dateLabel: string;
  dateValue: Date;
  time: string;
  duration: string;
  location: string;
  cost: string;
  paymentStatus: 'pending' | 'paid' | 'released' | 'refunded' | 'held' | 'disputed';
  locumId: string; // Added for review
}

const tabs = ["Active Bookings", "History", "Calendar View"] as const;
type Tab = (typeof tabs)[number];

export default function PracticeBookings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("Active Bookings");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookings, setBookings] = useState<PracticeBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<{id: string, locumId: string, name: string} | null>(null);
  
  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<{
    id: string;
    locumName: string;
    date: string;
    time: string;
    amount: number;
  } | null>(null);
  
  const { toast } = useToast();
  const { createTicket } = useTickets();

  // Refund/Dispute dialog state
  const [refundBookingId, setRefundBookingId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);


  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (!profile) return;

        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            date,
            start_time,
            end_time,
            status,
            payment_status,
            hourly_rate,
            locum:profiles!bookings_locum_id_fkey (
              id,
              full_name,
              job_type,
              city
            )
          `)
          .eq('practice_id', profile.id)
          .order('date', { ascending: false });

        if (error) throw error;

        const formattedBookings: PracticeBooking[] = (data || []).map((booking: any) => {
          const [sh, sm] = booking.start_time.split(':').map(Number);
          const [eh, em] = booking.end_time.split(':').map(Number);
          let durationMins = (eh * 60 + em) - (sh * 60 + sm);
          // Handle overnight shifts (e.g. 22:00 - 02:00)
          if (durationMins < 0) durationMins += 24 * 60;
          const hours = durationMins / 60;
          const cost = hours * booking.hourly_rate;

          
          return {
            id: booking.id,
            name: booking.locum?.full_name || "Unknown Locum",
            specialty: booking.locum?.job_type?.[0] || "General Dentist",
            status: booking.status,
            dateLabel: format(new Date(booking.date), "EEE, d MMM"),
            dateValue: new Date(booking.date),
            time: `${booking.start_time.slice(0, 5)} - ${booking.end_time.slice(0, 5)}`,
            duration: durationMins % 60 === 0 ? `${hours}h` : `${Math.floor(hours)}h ${durationMins % 60}m`,
            location: booking.locum?.city || "London",
            cost: `£${cost.toFixed(2)}`,
            paymentStatus: booking.payment_status as any || 'pending',
            locumId: booking.locum?.id
          };
        });

        setBookings(formattedBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const activeBookings = useMemo(
    () => bookings.filter((booking) => booking.status !== "completed" && booking.status !== "cancelled" && booking.status !== "rejected"),
    [bookings],
  );

  const filteredActiveBookings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return activeBookings;
    }

    return activeBookings.filter((booking) => {
      return (
        booking.name.toLowerCase().includes(query) ||
        booking.specialty.toLowerCase().includes(query)
      );
    });
  }, [activeBookings, searchTerm]);

  const historyBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "completed" || booking.status === "cancelled" || booking.status === "rejected"),
    [bookings],
  );

  const highlightedDates = useMemo(
    () => bookings.map((booking) => booking.dateValue),
    [bookings],
  );

  const bookingsOnDate = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    return bookings.filter((booking) =>
      isSameDay(booking.dateValue, selectedDate),
    );
  }, [selectedDate, bookings]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleExport = () => {
    const rows = [
      [
        "Name",
        "Specialty",
        "Date",
        "Time",
        "Duration",
        "Location",
        "Cost",
        "Status",
      ],
      ...filteredActiveBookings.map((booking) => [
        booking.name,
        booking.specialty,
        booking.dateLabel,
        booking.time,
        booking.duration,
        booking.location,
        booking.cost,
        booking.status,
      ]),
    ];

    const csvContent = rows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "active-bookings.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    navigate("/login");
  };

  const handleMessage = (userId: string, userName: string) => {
    const event = new CustomEvent('open-chat', { 
        detail: { userId, userName } 
    });
    window.dispatchEvent(event);
  };

  const handleMarkComplete = async (bookingId: string) => {
    try {
        // Just update status to 'held' to start the review period
        const { error } = await supabase
            .from('bookings')
            .update({ 
                status: 'completed',
                payment_status: 'held', // @ts-ignore
                completed_at: new Date().toISOString()
            } as any)
            .eq('id', bookingId);

        if (error) throw error;

        toast({
            title: "Booking Completed",
            description: "Funds are now held for a 24-hour review period.",
        });

        // Update local state
        setBookings(prev => prev.map(b => 
            b.id === bookingId ? { ...b, status: 'completed' as BookingStatus, paymentStatus: 'held' } : b
        ));

    } catch (error: any) {
        console.error('Error marking as complete:', error);
        toast({
            title: "Error",
            description: error.message || "Failed to mark as complete",
            variant: "destructive"
        });
    }
  };

  const handleRequestRefund = (bookingId: string) => {
    setRefundBookingId(bookingId);
    setRefundReason("");
  };

  const handleSubmitRefund = async () => {
    if (!refundBookingId || !refundReason.trim()) return;
    setIsSubmittingRefund(true);
    try {
        const { error } = await createTicket(refundBookingId, "Refund Request", refundReason.trim());
        if (error) throw new Error(String(error));

        toast({
            title: "Refund Requested",
            description: "The admin has been notified and will review your request.",
        });

        setBookings(prev => prev.map(b =>
            b.id === refundBookingId ? { ...b, paymentStatus: 'disputed' } : b
        ));
        setRefundBookingId(null);
    } catch (error: any) {
        toast({
            title: "Error",
            description: error.message || "Failed to request refund",
            variant: "destructive"
        });
    } finally {
        setIsSubmittingRefund(false);
    }
  };

  
  const handlePayNow = (booking: PracticeBooking) => {
    // Calculate total amount
    const costNumber = parseFloat(booking.cost.replace('£', ''));
    
    setSelectedBookingForPayment({
      id: booking.id,
      locumName: booking.name,
      date: booking.dateLabel,
      time: booking.time,
      amount: costNumber
    });
    setPaymentModalOpen(true);
  };
  
  const handlePaymentSuccess = () => {
    // Refetch bookings to update UI
    setBookings(prev => prev.map(b => 
      b.id === selectedBookingForPayment?.id 
        ? { ...b, paymentStatus: 'paid' as const }
        : b
    ));
    setPaymentModalOpen(false);
    setSelectedBookingForPayment(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Refund Request Dialog */}
      <Dialog open={!!refundBookingId} onOpenChange={(open) => !open && setRefundBookingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Refund</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">
            Describe the reason for your refund request. An admin will review this and contact both parties.
          </p>
          <Textarea
            placeholder="Describe the issue in detail..."
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            rows={4}
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setRefundBookingId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleSubmitRefund}
              disabled={!refundReason.trim() || isSubmittingRefund}
            >
              {isSubmittingRefund ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PracticeSidebar onLogout={handleLogout} />

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <PracticeSidebar onLogout={handleLogout} isMobileSheet={true} />
        </SheetContent>
      </Sheet>


      <main className="md:ml-64 min-h-screen">
        <PracticeHeader
          title="Booking Management"
          subtitle="Manage and track all your locum bookings"
          onMenuToggle={() => setMobileMenuOpen(true)}
        />


        <section className="p-4 md:p-8 space-y-4 md:space-y-6">
          <StatCards />

          <div className="space-y-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              {activeTab === "Active Bookings" && (
                <div className="flex w-full flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search by locum name or specialty..."
                      className="h-11 w-full rounded-lg border-0 bg-muted/40 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="h-11 gap-2 border-border bg-background px-4 sm:px-6 font-medium text-foreground hover:bg-muted/50 w-full sm:w-auto"
                    onClick={handleExport}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-1 border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors relative",
                    activeTab === tab
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "Active Bookings" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
              {filteredActiveBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  name={booking.name}
                  specialty={booking.specialty}
                  status={booking.status}
                  date={booking.dateLabel}
                  time={booking.time}
                  duration={booking.duration}
                  location={booking.location}
                  cost={booking.cost}
                  paymentStatus={booking.paymentStatus}
                  onMessage={() => handleMessage(booking.locumId, booking.name)}
                  onComplete={() => handleMarkComplete(booking.id)}
                  onPayNow={booking.status === 'confirmed' && booking.paymentStatus === 'pending' 
                    ? () => handlePayNow(booking) 
                    : undefined}
                />
              ))}
            </div>
          )}

          {activeTab === "History" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
              {historyBookings.map((booking) => (
                <div key={booking.id} className="relative">
                  <BookingCard
                    name={booking.name}
                    specialty={booking.specialty}
                    status={booking.status}
                    date={booking.dateLabel}
                    time={booking.time}
                    duration={booking.duration}
                    location={booking.location}
                    cost={booking.cost}
                    paymentStatus={booking.paymentStatus}
                    onMessage={() => handleMessage(booking.locumId, booking.name)}
                    onRefund={() => handleRequestRefund(booking.id)}
                  />
                  {booking.status === "completed" && (
                    <div className="absolute top-4 right-4 z-10 w-fit">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="bg-white/80 backdrop-blur-sm shadow-sm"
                        onClick={() => {
                          setSelectedBookingForReview({
                            id: booking.id,
                            locumId: booking.locumId,
                            name: booking.name
                          });
                          setReviewModalOpen(true);
                        }}
                      >
                        Rate
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "Calendar View" && (
            <div className="bg-background border border-border rounded-xl p-4 md:p-6 space-y-4 md:space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 md:gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Booking Calendar
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    View scheduled coverage at a glance.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Days with bookings highlighted in green</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
                <div className="w-full lg:w-96">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    className="rounded-2xl border border-border"
                    modifiers={{
                      booked: highlightedDates,
                    }}
                    modifiersStyles={{
                      booked: {
                        backgroundColor: "hsl(var(--primary))",
                        color: "hsl(var(--primary-foreground))",
                        borderRadius: "50%",
                      },
                    }}
                  />
                </div>

                <div className="flex-1 space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {selectedDate
                      ? `Bookings on ${selectedDate.toLocaleDateString(
                          "en-GB",
                          {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          },
                        )}`
                      : "Select a date to see bookings"}
                  </h3>
                  {selectedDate && bookingsOnDate.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No bookings for this day.
                    </div>
                  )}
                  {bookingsOnDate.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-border p-4 bg-background"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground">
                          {booking.name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {booking.duration}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {booking.specialty}
                      </p>
                      <p className="text-sm text-foreground mt-2">
                        {booking.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.location}
                      </p>
                      <div className="text-sm text-primary font-semibold mt-2">
                        {booking.cost}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {selectedBookingForReview && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          bookingId={selectedBookingForReview.id}
          revieweeId={selectedBookingForReview.locumId}
          revieweeName={selectedBookingForReview.name}
        />
      )}
      
      {/* Payment Modal */}
      {paymentModalOpen && selectedBookingForPayment && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          bookingId={selectedBookingForPayment.id}
          bookingDetails={selectedBookingForPayment}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
