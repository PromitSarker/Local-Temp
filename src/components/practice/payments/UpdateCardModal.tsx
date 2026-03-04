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

interface UpdateCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

function UpdateCardForm({
    onSuccess,
    onCancel
}: {
    onSuccess: () => void;
    onCancel: () => void;
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

        const { error: submitError } = await stripe.confirmSetup({
            elements,
            confirmParams: {
                return_url: window.location.href, // This might not be needed for simple setup intent if not redirecting
            },
            redirect: 'if_required'
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
                <Button type="submit" disabled={!stripe || processing} className="bg-emerald-600 hover:bg-emerald-700">
                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {processing ? "Saving..." : "Save Card"}
                </Button>
            </DialogFooter>
        </form>
    );
}

export function UpdateCardModal({
    isOpen,
    onClose,
    onSuccess,
}: UpdateCardModalProps) {
    const { toast } = useToast();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);

    const initializeSetup = async () => {
        setIsInitializing(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-setup-intent', {
                method: 'POST',
            });

            if (error) {
                console.error('Function error:', error);
                throw error;
            }

            if (data.error) throw new Error(data.error);
            if (!data.clientSecret) throw new Error('No client secret received');

            setClientSecret(data.clientSecret);
        } catch (error: any) {
            console.error('Setup initialization error:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to initialize card setup",
                variant: "destructive",
            });
            onClose();
        } finally {
            setIsInitializing(false);
        }
    };

    const handleSuccess = () => {
        toast({
            title: "Card Updated",
            description: "Your payment method has been successfully updated.",
        });
        onSuccess();
        onClose();
    };

    // Initialize setup when modal opens
    if (isOpen && !clientSecret && !isInitializing) {
        initializeSetup();
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[95%] sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Update Payment Method</DialogTitle>
                    <DialogDescription>
                        Enter your card details securely to update your payment method.
                    </DialogDescription>
                </DialogHeader>

                {isInitializing ? (
                    <div className="py-8 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Initializing secure connection...</p>
                    </div>
                ) : clientSecret && stripePromise ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <UpdateCardForm
                            onSuccess={handleSuccess}
                            onCancel={onClose}
                        />
                    </Elements>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
