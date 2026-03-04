import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  locumId?: string;
  locumName: string;
  hourlyRate: number;
}

/** Generate time slots every 30 min from startHour to endHour (inclusive) */
function generateTimeSlots(startHour = 7, endHour = 22): string[] {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < endHour) slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots(7, 22);

function formatTimeLabel(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, "0")} ${period}`;
}

function calcDurationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function BookingModal({
  isOpen,
  onClose,
  locumId,
  locumName,
  hourlyRate,
}: BookingModalProps) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const durationMinutes = calcDurationMinutes(startTime, endTime);
  const totalCost =
    durationMinutes > 0 ? (durationMinutes / 60) * hourlyRate : 0;

  // End time options must be after start time
  const endTimeOptions = TIME_SLOTS.filter(
    (t) => calcDurationMinutes(startTime, t) > 0
  );

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    // Auto-advance end time if it's no longer valid
    if (calcDurationMinutes(value, endTime) <= 0) {
      const nextIndex = TIME_SLOTS.indexOf(value) + 1;
      setEndTime(TIME_SLOTS[Math.min(nextIndex, TIME_SLOTS.length - 1)]);
    }
  };

  const handleCreateBooking = async () => {
    if (!date || !locumId) return;

    setIsSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to book a locum",
          variant: "destructive",
        });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile) {
        toast({
          title: "Error",
          description: "Practice profile not found",
          variant: "destructive",
        });
        return;
      }

      const dateStr = format(date, "yyyy-MM-dd");
      const { error: bookingError } = await supabase
        .from("bookings")
        .insert({
          practice_id: profile.id,
          locum_id: locumId,
          date: dateStr,
          start_time: startTime,
          end_time: endTime,
          hourly_rate: hourlyRate,
          status: "pending",
          payment_status: "pending",
          notes: notes.trim() || null,
        } as any)
        .select()
        .single();

      if (bookingError) throw bookingError;

      toast({
        title: "Request Sent ✓",
        description: `Booking request sent to ${locumName}. You'll be notified when they respond.`,
      });

      // Reset form
      setDate(undefined);
      setStartTime("09:00");
      setEndTime("17:00");
      setNotes("");
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95%] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Booking — {locumName}</DialogTitle>
          <DialogDescription>
            Select a date and shift hours. The locum will be notified to
            accept or decline.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Date */}
          <div className="flex flex-col gap-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="rounded-md border shadow"
                  disabled={(d) => d < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Start Time</Label>
              <Select value={startTime} onValueChange={handleStartTimeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {TIME_SLOTS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatTimeLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>End Time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {endTimeOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatTimeLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-medium">£{hourlyRate}/hr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{formatDuration(durationMinutes)}</span>
            </div>
            <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold">
              <span>Estimated Total</span>
              <span className="text-primary text-lg">
                £{totalCost > 0 ? totalCost.toFixed(2) : "—"}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <Label>Instructions / Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              placeholder="e.g. specific procedures required, parking info, dress code..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateBooking}
            className="bg-[#116a4d] hover:bg-[#0d553e]"
            disabled={!date || durationMinutes <= 0 || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
