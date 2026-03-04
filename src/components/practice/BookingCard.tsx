import {
  Calendar,
  Clock,
  MapPin,
  MoreVertical,
  CheckCircle,
  Clock as ClockIcon,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type BookingStatus = "confirmed" | "pending" | "completed" | "cancelled" | "rejected";

interface BookingCardProps {
  name: string;
  specialty: string;
  status: BookingStatus;
  date: string;
  time: string;
  duration: string;
  location: string;
  cost: string;
  paymentStatus?: 'pending' | 'paid' | 'released' | 'refunded' | 'held' | 'disputed';
  onMessage?: () => void;
  onComplete?: () => void;
  onRefund?: () => void;
  onPayNow?: () => void; // New prop for paying for confirmed bookings
}

export function BookingCard({
  name,
  specialty,
  status,
  date,
  time,
  duration,
  location,
  cost,
  paymentStatus,
  onMessage,
  onComplete,
  onRefund,
  onPayNow,
}: BookingCardProps) {
  return (
    <div className="bg-background border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
            {name
              .split(" ")
              .slice(1)
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground">{specialty}</p>
            {status === "confirmed" ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1">
                <CheckCircle className="w-3 h-3" />
                Confirmed
              </span>
            ) : status === "pending" ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full mt-1">
                <ClockIcon className="w-3 h-3" />
                Pending
              </span>
            ) : status === "completed" ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                <CheckCircle className="w-3 h-3" />
                Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full mt-1">
                <MoreVertical className="w-3 h-3 rotate-45" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            )}
            {paymentStatus === 'held' && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    Funds Held
                </span>
            )}
            {paymentStatus === 'disputed' && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                    Disputed
                </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
            {(status === 'confirmed' || status === 'completed') && onMessage && (
                <Button variant="ghost" size="icon" onClick={onMessage} title="Message Locum">
                    <MessageSquare className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </Button>
            )}
            <button className="text-muted-foreground hover:text-foreground">
            <MoreVertical className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="space-y-2 mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>
            {time} ({duration})
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Cost</p>
          <p className="text-lg font-semibold text-foreground">{cost}</p>
        </div>
        <div className="flex gap-2">
          {onPayNow && (
            <Button 
              onClick={onPayNow}
              className="bg-[#116a4d] hover:bg-[#0d553e] text-white"
            >
              💳 Pay Now
            </Button>
          )}
          {status === 'confirmed' && onComplete && (
            <Button 
                onClick={onComplete}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Complete
            </Button>
          )}
          {status === 'completed' && paymentStatus === 'held' && onRefund && (
            <Button 
                onClick={onRefund}
                variant="destructive"
                className="bg-orange-600 hover:bg-orange-700 text-white"
            >
                Request Refund
            </Button>
          )}
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
