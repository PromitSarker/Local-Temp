import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Calendar as CalendarIcon,
  DollarSign,
  FileText,
  Clock,
  X,
  Star,
  TrendingUp,
  ChevronRight,
  User,
  Loader2,
  CheckCircle,
  Slash,
  Download,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ProfileCompletionBanner } from "../ProfileCompletionBanner";
import { format, isSameDay } from "date-fns";
import { useShifts } from "@/hooks/useShifts";
import { useToast } from "@/hooks/use-toast";
import { useLocumDashboard } from "@/hooks/useLocumDashboard";
import { useNotifications } from "@/hooks/useNotifications";
import { useAvailability } from "@/hooks/useAvailability";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface DashboardOverviewProps {
  userName: string;
  completionPercentage: number;
  isProfileComplete: boolean;
  reliabilityScore: number;
}

export function DashboardOverview({
  userName,
  completionPercentage,
  isProfileComplete,
  reliabilityScore,
}: DashboardOverviewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);

  /* New logic for DashboardOverview using upcomingShifts */
  const { upcomingShifts, loading: shiftsLoading, completeShift } = useShifts();
  const { stats, earningsData, loading: statsLoading } = useLocumDashboard();
  const { notifications, loading: notificationsLoading } = useNotifications();
  const { availability, updateAvailability, loading: availabilityLoading } = useAvailability();
  const { toast } = useToast();

  const loading = shiftsLoading || statsLoading || availabilityLoading;

  const handleCompleteShift = async (shiftId: string) => {
    try {
      await completeShift(shiftId);
      toast({
        title: "Shift Completed",
        description: "The shift has been marked as completed.",
      });
      setShowBookingPanel(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark shift as completed.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadSummary = (shift: typeof selectedShift) => {
    if (!shift) return;

    const [startH, startM] = shift.start_time.split(":").map(Number);
    const [endH, endM] = shift.end_time.split(":").map(Number);
    const durationMins = (endH * 60 + endM) - (startH * 60 + startM);
    const durationHrs = durationMins / 60;
    const total = (durationHrs * shift.hourly_rate).toFixed(2);
    const durationLabel = durationMins % 60 === 0
      ? `${durationHrs}h`
      : `${Math.floor(durationHrs)}h ${durationMins % 60}m`;

    const practiceLabel = (shift as any).practice?.full_name ?? "Practice";
    const locationLabel = (shift as any).practice?.city ?? "";
    const dateLabel = format(new Date(shift.date), "EEEE, d MMMM yyyy");
    const startLabel = shift.start_time.slice(0, 5);
    const endLabel = shift.end_time.slice(0, 5);
    const generatedOn = format(new Date(), "d MMM yyyy, h:mm a");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Shift Summary — ${dateLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #116a4d; margin-bottom: 28px; }
    .brand { font-size: 20px; font-weight: 700; color: #116a4d; }
    .brand span { font-weight: 400; color: #555; font-size: 13px; display: block; margin-top: 2px; }
    .badge { background: #f0faf5; color: #116a4d; border: 1px solid #a7d9c0; border-radius: 6px; padding: 4px 12px; font-size: 12px; font-weight: 600; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 28px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 14px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
    .field { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 14px 16px; }
    .field label { font-size: 11px; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 4px; }
    .field value { font-size: 15px; font-weight: 600; color: #1a1a1a; }
    .total-box { background: #f0faf5; border: 2px solid #116a4d; border-radius: 10px; padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; }
    .total-box .label { font-size: 14px; color: #444; font-weight: 600; }
    .total-box .amount { font-size: 28px; font-weight: 800; color: #116a4d; }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #aaa; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">LocalSmileConnect <span>Shift Summary Document</span></div>
    <div class="badge">CONFIRMED SHIFT</div>
  </div>
  <h1>Shift Summary</h1>
  <p class="subtitle">${practiceLabel}${locationLabel ? ` &mdash; ${locationLabel}` : ""}</p>
  <p class="section-title">Shift Details</p>
  <div class="grid">
    <div class="field"><label>Date</label><value>${dateLabel}</value></div>
    <div class="field"><label>Practice</label><value>${practiceLabel}</value></div>
    <div class="field"><label>Start Time</label><value>${startLabel}</value></div>
    <div class="field"><label>End Time</label><value>${endLabel}</value></div>
    <div class="field"><label>Duration</label><value>${durationLabel}</value></div>
    <div class="field"><label>Hourly Rate</label><value>&pound;${shift.hourly_rate}/hr</value></div>
  </div>
  <div class="total-box">
    <span class="label">Estimated Total Earnings</span>
    <span class="amount">&pound;${total}</span>
  </div>
  <div class="footer">Generated on ${generatedOn} &bull; This is an estimated summary. Final payment is subject to completion confirmation.</div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=700,height=900");
    if (!win) {
      toast({ title: "Popup blocked", description: "Please allow popups to download the summary.", variant: "destructive" });
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const bookingDates = useMemo(() => {
    return upcomingShifts.map((shift) => new Date(shift.date));
  }, [upcomingShifts]);

  const selectedShift = selectedDate
    ? upcomingShifts.find((shift) => isSameDay(new Date(shift.date), selectedDate))
    : undefined;

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined);
      setShowBookingPanel(false);
      return;
    }

    setSelectedDate(date);

    // If it's a shift day, show the panel
    if (bookingDates.some((d) => isSameDay(d, date))) {
      setShowBookingPanel(true);
    } else {
      // Show availability dialog
      setShowAvailabilityDialog(true);
      setShowBookingPanel(false);
    }
  };

  const handleSetAvailability = async (isAvailable: boolean) => {
    if (!selectedDate) return;

    await updateAvailability(selectedDate, isAvailable);
    setShowAvailabilityDialog(false);
    toast({
      title: "Availability Updated",
      description: `Successfully marked as ${isAvailable ? "available" : "unavailable"} for ${format(selectedDate, "PPP")}`,
    });
  };

  const handleViewDetails = (shift: typeof upcomingShifts[0]) => {
    setSelectedDate(new Date(shift.date));
    setShowBookingPanel(true);
  };

  const chartConfig = {
    amount: {
      label: "Earnings",
      color: "#059669",
    },
  };

  return (
    <div className="space-y-6">
      {/* Profile Completion Banner */}
      <ProfileCompletionBanner
        completionPercentage={completionPercentage}
        isComplete={isProfileComplete}
      />

      {/* Reliability Score Card */}
      <Card className="p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Reliability Score</h3>
            <p className="text-xs text-muted-foreground">
              Based on cancellations & reviews
            </p>
          </div>
          <div
            className={`text-2xl font-bold ${reliabilityScore >= 80 ? "text-green-600" : reliabilityScore >= 50 ? "text-yellow-600" : "text-red-600"}`}
          >
            {reliabilityScore}%
          </div>
        </div>
        <Progress
          value={reliabilityScore}
          className={`h-2 ${reliabilityScore >= 80 ? "[&>div]:bg-green-500" : reliabilityScore >= 50 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"}`}
        />
      </Card>

      {/* Upcoming Shifts Card */}
      <Card className="p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary">
            Upcoming Shifts
          </h3>
          <Link
            to="/locum-dashboard/shifts"
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading shifts...</p>
          </div>
        ) : isProfileComplete ? (
          upcomingShifts.length > 0 ? (
            <div className="space-y-3">
              {upcomingShifts.slice(0, 3).map((shift) => (
                <div
                  key={shift.id}
                  className="p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleViewDetails(shift)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-primary">
                        {shift.practice?.name || "Dental Practice"}
                      </p>
                      <p className="text-sm text-primary mt-1">
                        {format(new Date(shift.date), "EEE, d MMM")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Confirmed
                      </span>
                      <p className="font-bold mt-2">£{shift.hourly_rate}/hr</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming shifts</p>
            </div>
          )
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Complete your profile to view and apply for shifts</p>
            <Button asChild className="mt-4">
              <Link to="/locum-dashboard/documents">Complete Profile</Link>
            </Button>
          </div>
        )}
      </Card>

      {/* Stats Cards - 4 columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mb-4">
            <CalendarIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <p className="text-sm text-primary mb-2">Upcoming Shifts</p>
          <p className="text-3xl font-bold">
            {isProfileComplete ? upcomingShifts.length : 0}
          </p>
          <p className="text-sm text-primary flex items-center mt-2">
            <TrendingUp className="w-4 h-4 mr-1" />
            Total confirmed
          </p>
        </Card>

        <Card className="p-5 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">This Month</p>
          <p className="text-3xl font-bold">
            £{isProfileComplete ? stats.monthlyEarnings.toLocaleString() : 0}
          </p>
          <p className="text-sm text-primary flex items-center mt-2">
            <TrendingUp className="w-4 h-4 mr-1" />
            Paid this month
          </p>
        </Card>

        <Card className="p-5 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">Rating</p>
          <p className="text-3xl font-bold">{stats.averageRating || "N/A"}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Based on {stats.totalReviews} reviews
          </p>
        </Card>

        <Card className="p-5 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">Hours This Week</p>
          <p className="text-3xl font-bold">{stats.hoursThisWeek}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Confirmed & completed
          </p>
        </Card>
      </div>

      {/* Calendar Section */}
      <Card className="p-6 animate-fade-in">
        <h3 className="text-xl font-bold mb-4">My Booking Calendar</h3>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border pointer-events-auto"
              modifiers={{
                booked: bookingDates,
                unavailable: availability.filter(a => !a.is_available).map(a => new Date(a.date))
              }}
              modifiersStyles={{
                booked: {
                  backgroundColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  borderRadius: "50%",
                },
                unavailable: {
                  textDecoration: "line-through",
                  color: "hsl(var(--muted-foreground))",
                  backgroundColor: "hsl(var(--muted)/0.5)",
                  borderRadius: "50%",
                }
              }}
            />
            <div className="flex justify-center gap-4 mt-2">
              <p className="text-xs text-muted-foreground">
                <span className="inline-block w-3 h-3 rounded-full bg-primary mr-1"></span>
                Bookings
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="inline-block w-3 h-3 rounded-full bg-muted mr-1"></span>
                Unavailable
              </p>
            </div>
          </div>

          {/* Booking Details Side Panel */}
          {showBookingPanel && selectedShift && (
            <div className="flex-1 bg-muted/30 rounded-lg p-4 relative animate-fade-in">
              <button
                onClick={() => setShowBookingPanel(false)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
              <h4 className="font-semibold text-lg mb-3">
                {format(new Date(selectedShift.date), "EEEE, MMMM d, yyyy")}
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Practice</p>
                  <p className="font-medium">{selectedShift.practice?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shift</p>
                  <p className="font-medium">Confirmed Booking</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hours</p>
                  <p className="font-medium">
                    {selectedShift.start_time.slice(0, 5)} - {selectedShift.end_time.slice(0, 5)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rate</p>
                  <p className="font-medium text-primary">
                    £{selectedShift.hourly_rate}/hr
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                    Confirmed
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => handleDownloadSummary(selectedShift)}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Summary
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleCompleteShift(selectedShift.id)}
                  >
                    Mark as Completed
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!showBookingPanel && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click on a booked day to view details</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* This Week's Earnings */}
      <Card className="p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-semibold text-foreground">
            This Week's Earnings
          </h3>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart
            data={earningsData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickFormatter={(value) => `${value}`}
              domain={[0, 600]}
              ticks={[0, 150, 300, 450, 600]}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#059669"
              strokeWidth={3}
              dot={{ fill: "#059669", strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: "#059669" }}
            />
          </LineChart>
        </ChartContainer>
      </Card>

      {/* Recent Notifications */}
      <Card className="p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Notifications</h3>
          <Link
            to="/locum-dashboard/notifications"
            className="flex items-center text-sm text-primary hover:underline"
          >
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="space-y-3">
          {notifications.slice(0, 3).map((n) => (
            <div key={n.id} className="p-4 bg-muted/30 border border-border rounded-lg flex flex-col gap-1">
              <p className="font-medium text-foreground">
                {n.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {n.message}
              </p>
              <p className="text-xs opacity-80">
                {format(new Date(n.created_at), "MMM d, h:mm a")}
              </p>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No new notifications
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 bg-white hover:bg-gray-50 border-gray-200"
            asChild
          >
            <Link to="/locum-dashboard/shifts">
              <CalendarIcon className="w-6 h-6 text-foreground" />
              <span className="text-sm font-medium text-foreground">
                Browse Shifts
              </span>
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 bg-white hover:bg-gray-50 border-gray-200"
            asChild
          >
            <Link to="/locum-dashboard/documents">
              <FileText className="w-6 h-6 text-foreground" />
              <span className="text-sm font-medium text-foreground">
                Upload Documents
              </span>
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 bg-white hover:bg-gray-50 border-gray-200"
            asChild
          >
            <Link to="/locum-dashboard/payments">
              <DollarSign className="w-6 h-6 text-foreground" />
              <span className="text-sm font-medium text-foreground">
                View Payments
              </span>
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 bg-white hover:bg-gray-50 border-gray-200"
            asChild
          >
            <Link to="/locum-dashboard/profile">
              <User className="w-6 h-6 text-foreground" />
              <span className="text-sm font-medium text-foreground">
                Update Profile
              </span>
            </Link>
          </Button>
        </div>
      </div>

      {/*         )}
                </div>
              </div>
            </div>
          )}

          {!showBookingPanel && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click on a booked day to view details</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Profile Completion Card */}
      <Card className="p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">Profile Completion</h3>
            <p className="text-sm text-muted-foreground">
              {isProfileComplete
                ? "All documents verified"
                : "Complete your profile to get more bookings"}
            </p>
          </div>
          <div className="text-3xl font-bold text-primary">
            {completionPercentage}%
          </div>
        </div>
        <Progress value={completionPercentage} className="mb-4" />
        <div className="flex items-center text-primary">
          <FileText className="w-5 h-5 mr-2" />
          <span className="font-medium">
            {isProfileComplete
              ? "All documents verified ✓"
              : "Documents pending upload"}
          </span>
        </div>
        {!isProfileComplete && (
          <Button asChild className="mt-4">
            <Link to="/locum-dashboard/documents">Upload Documents</Link>
          </Button>
        )}
      </Card>
      <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Availability</DialogTitle>
            <DialogDescription>
              {selectedDate && `Set your availability for ${format(selectedDate, "PPPP")}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 text-emerald-600"
              onClick={() => handleSetAvailability(true)}
            >
              <CheckCircle className="w-8 h-8" />
              <span className="font-semibold">Available</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 text-slate-500"
              onClick={() => handleSetAvailability(false)}
            >
              <Slash className="w-8 h-8" />
              <span className="font-semibold">Unavailable</span>
            </Button>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
