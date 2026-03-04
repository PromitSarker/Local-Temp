import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon,
  Download,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { format } from "date-fns";
import { useShifts } from "@/hooks/useShifts";
import { useToast } from "@/hooks/use-toast";

interface ShiftsSectionProps {
  isProfileComplete: boolean;
}

export function ShiftsSection({ isProfileComplete }: ShiftsSectionProps) {
  const [activeTab, setActiveTab] = useState<"requests" | "upcoming" | "history">("requests");
  const { requests, upcomingShifts, completedShifts, loading, acceptBooking, declineBooking, requestRefund } = useShifts();
  const { toast } = useToast();

  const handleAccept = async (bookingId: string) => {
    try {
      await acceptBooking(bookingId);
      toast({
        title: "Booking Accepted",
        description: "You have confirmed this shift.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept booking.",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (bookingId: string) => {
    try {
      await declineBooking(bookingId);
      toast({
        title: "Booking Declined",
        description: "You have declined this shift request.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline booking.",
        variant: "destructive",
      });
    }
  };

  const handleRequestRefund = async (bookingId: string) => {
    const reason = prompt("Please enter the reason for the dispute/refund request:");
    if (!reason) return;

    try {
      const { error } = await requestRefund(bookingId, reason);
      if (error) throw error;
      toast({
        title: "Dispute Opened",
        description: "The admin has been notified and will review your request.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open dispute.",
        variant: "destructive",
      });
    }
  };

  if (!isProfileComplete) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Shift Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage your booking requests and upcoming shifts.
          </p>
        </div>
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Profile Incomplete</h3>
            <p className="text-muted-foreground mb-6">
              You need to complete your profile and upload all required
              documents before you can receive shift requests.
            </p>
            <Button asChild className="shadow-primary">
              <Link to="/locum-dashboard/documents">Complete Your Profile</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleMessage = (userId: string, userName: string) => {
    const event = new CustomEvent('open-chat', { 
        detail: { userId, userName } 
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Shift Management</h2>
        <p className="text-muted-foreground mt-1">
          Manage your booking requests and upcoming shifts.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-muted rounded-lg p-1">
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex-1 py-3 px-6 rounded-md text-sm font-medium transition-all ${
            activeTab === "requests"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Booking Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex-1 py-3 px-6 rounded-md text-sm font-medium transition-all ${
            activeTab === "upcoming"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Upcoming Shifts ({upcomingShifts.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 px-6 rounded-md text-sm font-medium transition-all ${
            activeTab === "history"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          History ({completedShifts.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading shifts...</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeTab === "requests" ? (
            requests.length > 0 ? (
              requests.map((booking) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">
                        Shift Request from {booking.practice?.name}
                      </h3>
                      <div className="flex items-center gap-1 text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>{booking.practice?.address || "Location pending"}</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      Pending Review
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date</p>
                      <p className="font-medium text-primary">
                        {format(new Date(booking.date), "EEE, d MMM yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Time</p>
                      <p className="font-medium">
                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Rate</p>
                      <p className="font-medium">£{booking.hourly_rate}/hr</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <span className="font-medium text-amber-600">Action Required</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleAccept(booking.id)}
                    >
                      Accept Request
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 md:flex-none text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDecline(booking.id)}
                    >
                      Decline
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  No new booking requests.
                </p>
              </Card>
            )
          ) : activeTab === "upcoming" ? (
            upcomingShifts.length > 0 ? (
              upcomingShifts.map((booking) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">
                        {booking.practice?.name}
                      </h3>
                      <div className="flex items-center gap-1 text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>{booking.practice?.address}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleMessage(booking.practice_id, booking.practice?.name || "Practice")}
                          title="Message Practice"
                      >
                          <MessageSquare className="h-4 w-4" />
                      </Button>
                      <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirmed
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date</p>
                      <p className="font-medium text-primary">
                        {format(new Date(booking.date), "EEE, d MMM yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Time</p>
                      <p className="font-medium">
                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Rate</p>
                      <p className="font-medium">£{booking.hourly_rate}/hr</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" className="flex-1 md:flex-none">
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 md:flex-none"
                      onClick={() => {
                        const dateLabel = format(new Date(booking.date), "EEE, d MMM yyyy");
                        const html = `<!DOCTYPE html><html><head><title>Confirmation — ${booking.practice?.name}</title><style>body{font-family:sans-serif;padding:40px;line-height:1.6}.box{border:2px solid #10b981;padding:24px;border-radius:12px;background:#f0faf5}h1{color:#065f46;margin-top:0}.field{margin-bottom:12px}strong{display:inline-block;width:120px}</style></head><body><h1>Shift Confirmation</h1><div class="box"><div class="field"><strong>Practice:</strong> ${booking.practice?.name}</div><div class="field"><strong>Location:</strong> ${booking.practice?.address}</div><div class="field"><strong>Date:</strong> ${dateLabel}</div><div class="field"><strong>Time:</strong> ${booking.start_time.slice(0,5)} - ${booking.end_time.slice(0,5)}</div><div class="field"><strong>Rate:</strong> &pound;${booking.hourly_rate}/hr</div></div><p style="margin-top:40px;color:#6b7280;font-size:12px">Generated by Local Smile Connect &bull; ${new Date().toLocaleString()}</p></body></html>`;
                        const win = window.open("", "_blank");
                        if(win){
                          win.document.write(html);
                          win.document.close();
                          setTimeout(() => win.print(), 500);
                        }
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Confirmation
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No upcoming shifts scheduled.</p>
              </Card>
            )
          ) : (
            completedShifts.length > 0 ? (
              completedShifts.map((booking: any) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">
                        {booking.practice?.name}
                      </h3>
                      <div className="flex items-center gap-1 text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>{booking.practice?.address}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completed
                      </span>
                      {booking.payment_status === 'held' && (
                        <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                          Funds Held
                        </span>
                      )}
                      {booking.payment_status === 'disputed' && (
                        <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                          Disputed
                        </span>
                      )}
                      {booking.payment_status === 'released' && (
                        <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                          Paid
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date</p>
                      <p className="font-medium text-primary">
                        {format(new Date(booking.date), "EEE, d MMM yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Time</p>
                      <p className="font-medium">
                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Rate</p>
                      <p className="font-medium">£{booking.hourly_rate}/hr</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    {booking.payment_status === 'held' && (
                      <Button 
                        variant="destructive"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={() => handleRequestRefund(booking.id)}
                      >
                        Open Dispute
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No completed shifts yet.</p>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
