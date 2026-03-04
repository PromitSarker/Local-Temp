import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingDetails: {
    locumName: string;
    date: string;
    time: string;
    amount: number;
  };
  onSuccess: () => void;
}

function PaymentForm({ 
  clientSecret, 
  onSuccess, 
  onCancel,
  locumName 
}: { 
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
  locumName: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || "An unexpected error occurred");
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <PaymentElement />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || processing} className="bg-[#116a4d] hover:bg-[#0d553e]">
          {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {processing ? "Processing..." : "Pay & Confirm Booking"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PaymentModal({
  isOpen,
  onClose,
  bookingId,
  bookingDetails,
  onSuccess,
}: PaymentModalProps) {
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const initializePayment = async () => {
    setIsInitializing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in");
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookingId })
      });

      const { clientSecret: secret, error } = await response.json();

      if (error) throw new Error(error);
      
      setClientSecret(secret);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
      onClose();
    } finally {
      setIsInitializing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    // Update payment status
    await supabase
      .from('bookings')
      .update({ payment_status: 'paid' } as any)
      .eq('id', bookingId);

    toast({
      title: "Payment Successful",
      description: `Booking with ${bookingDetails.locumName} is now confirmed.`,
    });

    onSuccess();
    onClose();
  };

  // Initialize payment when modal opens
  if (isOpen && !clientSecret && !isInitializing) {
    initializePayment();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95%] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            {bookingDetails.locumName} has accepted your booking request. Complete payment to confirm.
          </DialogDescription>
        </DialogHeader>

        {isInitializing ? (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Initializing payment...</p>
          </div>
        ) : clientSecret && stripePromise ? (
          <div>
            <div className="bg-muted/50 p-4 rounded-lg mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Locum</span>
                <span className="font-medium">{bookingDetails.locumName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{bookingDetails.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{bookingDetails.time}</span>
              </div>
              <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold">
                <span>Total Amount</span>
                <span className="text-primary text-lg">£{bookingDetails.amount.toFixed(2)}</span>
              </div>
            </div>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm 
                clientSecret={clientSecret} 
                onSuccess={handlePaymentSuccess}
                onCancel={onClose}
                locumName={bookingDetails.locumName}
              />
            </Elements>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
