import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  CreditCard,
  Calendar,
  Clock,
  TrendingUp,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { useLocumDashboard } from "@/hooks/useLocumDashboard";

interface PaymentsSectionProps {
  isProfileComplete: boolean;
}

export function PaymentsSection({ isProfileComplete }: PaymentsSectionProps) {
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { earningsData, stats, invoices, loading: loadingStats, generateInvoice } = useLocumDashboard();
  const [generatingInvoices, setGeneratingInvoices] = useState<Record<string, boolean>>({});

  const handleDownloadInvoice = async (invoice?: any) => {
    if (invoice?.pdf_url) {
        window.open(invoice.pdf_url, '_blank');
        return;
    }

    // If no invoice record yet, we might need a way to find the booking ID
    // For now, if it's in the list it usually has a PDF if generated.
    toast({
        title: "Download Unavailable",
        description: "The PDF for this invoice is not available yet.",
        variant: "destructive"
    });
  };

  useEffect(() => {
    checkStripeConnection();
    
    if (searchParams.get('success')) {
        toast({
            title: "Stripe Connected",
            description: "Your account has been successfully connected for payouts.",
        });
    }
  }, []);

  const checkStripeConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('user_id', user.id)
        .single();
    
    if (profile?.stripe_account_id) {
        setStripeConnected(true);
    }
  };

  const handleConnectStripe = async () => {
    setLoadingStripe(true);
    try {
        const { data, error } = await supabase.functions.invoke('stripe-connect', {
            method: 'POST',
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);
        if (data.url) window.location.href = data.url;
        else throw new Error('No onboarding URL received from server');

    } catch (error: any) {
        toast({
            title: "Connection Error",
            description: error.message || "Failed to initiate Stripe connection.",
            variant: "destructive"
        });
    } finally {
        setLoadingStripe(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Earnings & Payouts</h2>
          <p className="text-muted-foreground mt-1">
            Track your income and manage your payout methods
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Earnings</p>
              <h3 className="text-2xl font-bold">£{stats.monthlyEarnings}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shifts This Month</p>
              <h3 className="text-2xl font-bold">{stats.upcomingShifts}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hours This Week</p>
              <h3 className="text-2xl font-bold">{stats.hoursThisWeek}h</h3>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6">Income Overview</h3>
        <div className="h-[300px] w-full">
          {loadingStats ? (
            <div className="h-full w-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `£${val}`} />
                <Tooltip 
                  formatter={(val) => [`£${val}`, 'Earnings']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="settings" className="px-6">Payout Settings</TabsTrigger>
          <TabsTrigger value="history" className="px-6">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
            {invoices.length === 0 ? (
                <Card className="p-8 text-center flex flex-col items-center">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No invoices generated yet. Your invoices will appear here once booked shifts are completed.</p>
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                <tr>
                                    <th className="px-6 py-3">Invoice #</th>
                                    <th className="px-6 py-3">Practice</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                    <th className="px-6 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-muted/5">
                                        <td className="px-6 py-4 font-mono text-xs">{inv.invoice_number}</td>
                                        <td className="px-6 py-4 font-medium">{inv.practice_name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{inv.date}</td>
                                        <td className="px-6 py-4 text-right font-semibold">{inv.amount}</td>
                                        <td className="px-6 py-4 text-center">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 gap-2"
                                                onClick={() => handleDownloadInvoice(inv)}
                                            >
                                                <Download className="w-4 h-4" />
                                                PDF
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
            
            {stripeConnected && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex items-start gap-3 mt-4">
                  <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div className="text-sm text-emerald-800">
                      <p className="font-semibold">Stripe payouts are active</p>
                      <p className="mt-1">Detailed transaction history and tax documents are also available through your connected Stripe account.</p>
                      <Button variant="link" className="p-0 h-auto text-emerald-700 font-bold mt-2" onClick={handleConnectStripe}>
                          Go to Stripe Dashboard →
                      </Button>
                  </div>
              </div>
            )}
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Payout Method
            </h3>
            {stripeConnected ? (
                <div className="bg-[#0f766e] rounded-lg p-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <CreditCard className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-lg">Stripe Payouts</p>
                            <p className="text-sm text-emerald-100/70 font-light">
                                Your earnings are automatically paid out to your connected account.
                            </p>
                        </div>
                    </div>
                    <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Connected</span>
                </div>
            ) : (
                <div className="text-center p-8 border border-dashed rounded-lg bg-muted/20">
                    <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                    <h4 className="font-semibold mb-1">No payout method connected</h4>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                        Connect your Stripe account to start receiving payments for your completed shifts.
                    </p>
                    <Button onClick={handleConnectStripe} disabled={loadingStripe} className="px-8 shadow-lg">
                        {loadingStripe ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Connect Stripe
                    </Button>
                </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
