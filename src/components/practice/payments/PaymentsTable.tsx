import { useState } from "react";
import {
  Search,
  Download,
  CheckCircle2,
  Clock,
  Loader2,
  CreditCard,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePracticePayments } from "@/hooks/usePracticePayments";
import { UpdateCardModal } from "./UpdateCardModal";

type PaymentStatus = "Paid" | "Pending" | "Processing";

function StatusBadge({ status }: { status: PaymentStatus }) {
  const config = {
    Paid: {
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    Pending: {
      icon: Clock,
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    Processing: {
      icon: Loader2,
      className: "bg-sky-50 text-sky-700 border-sky-200",
    },
  };

  const { icon: Icon, className } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}

export function PaymentsTable() {
  const { payments, invoices, loading, generateInvoice } = usePracticePayments();
  const [searchTerm, setSearchTerm] = useState("");
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState("");
  const [showUpdateCardModal, setShowUpdateCardModal] = useState(false);
  const { toast } = useToast();

  const filteredPayments = payments.filter((p) =>
    p.locum.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.invoice.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvoices = invoices.filter((inv) =>
    inv.locum.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
    inv.id.toLowerCase().includes(invoiceSearchTerm.toLowerCase())
  );

  const handleExport = () => {
    if (payments.length === 0) return;
    
    const headers = ["Invoice", "Locum", "Date", "Duration", "Amount", "Status"];
    const csvContent = [
      headers.join(","),
      ...payments.map(p => `"${p.invoice}","${p.locum}","${p.date}","${p.hours}","${p.amount}","${p.status}"`)
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: `Exported ${payments.length} payment records.`,
    });
  };

  const [generatingInvoices, setGeneratingInvoices] = useState<Record<string, boolean>>({});

  const handleDownloadInvoice = async (bookingId?: string, url?: string) => {
    if (url) {
      window.open(url, '_blank');
      return;
    }

    if (!bookingId) {
      toast({
        title: "Download Unavailable",
        description: "Review this booking's details or contact support.",
        variant: "destructive"
      });
      return;
    }

    try {
      setGeneratingInvoices(prev => ({ ...prev, [bookingId]: true }));
      toast({
        title: "Generating Invoice",
        description: "Please wait while we create your PDF...",
      });

      const data = await generateInvoice(bookingId);
      
      if (data?.invoiceUrl) {
        window.open(data.invoiceUrl, '_blank');
        toast({
          title: "Invoice Generated",
          description: "Your invoice has been created and opened in a new tab.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate invoice.",
        variant: "destructive"
      });
    } finally {
      setGeneratingInvoices(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  if (loading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <Tabs defaultValue="payments" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="payments" className="px-6 py-2 content-center items-center flex gap-1 justify-center align-middle">Payments</TabsTrigger>
            <TabsTrigger value="invoices" className="px-6 py-2 content-center items-center flex gap-1 justify-center align-middle">Invoices</TabsTrigger>
            <TabsTrigger value="methods" className="px-6 py-2 content-center items-center flex gap-1 justify-center align-middle">Payment Methods</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="payments" className="m-0 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by locum or invoice..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[200px] font-semibold">Locum</TableHead>
                  <TableHead className="font-semibold">Invoice</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold text-center">Duration</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No payments found
                     </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/5 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border">
                            <AvatarFallback className="text-xs bg-emerald-50 text-emerald-700 font-semibold">
                              {payment.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{payment.locum}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {payment.invoice}
                      </TableCell>
                      <TableCell className="text-sm">{payment.date}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-normal bg-muted">
                          {payment.hours}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-700">
                        {payment.amount}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          disabled={generatingInvoices[payment.id]}
                          onClick={() => handleDownloadInvoice(payment.id)}
                        >
                          {generatingInvoices[payment.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="m-0 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by locum or invoice ID..."
                className="pl-10"
                value={invoiceSearchTerm}
                onChange={(e) => setInvoiceSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[80px]">Locum</TableHead>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Generated Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No invoices found
                     </TableCell>
                   </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-muted/5 transition-colors">
                      <TableCell>
                        <Avatar className="h-8 w-8 border">
                          <AvatarFallback className="text-xs font-semibold bg-emerald-50 text-emerald-700">
                            {invoice.initials}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{invoice.id}</TableCell>
                      <TableCell className="text-sm">{invoice.date}</TableCell>
                      <TableCell className="text-sm">{invoice.dueDate}</TableCell>
                      <TableCell className="font-semibold text-emerald-700">{invoice.amount}</TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleDownloadInvoice(invoice.pdf_url)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="methods" className="m-0">
          <Card className="p-8 border border-dashed rounded-xl bg-muted/20 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <CreditCard className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Management of Payment Methods</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Primary payment methods can be managed through our secure Stripe billing portal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Badge variant="outline" className="px-4 py-2 bg-white flex items-center gap-2 justify-center">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Primary Card ending in 4242
              </Badge>
              <Button 
                variant="default" 
                className="shadow-lg shadow-emerald-700/20 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowUpdateCardModal(true)}
              >
                Update Card Details
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <UpdateCardModal 
        isOpen={showUpdateCardModal}
        onClose={() => setShowUpdateCardModal(false)}
        onSuccess={() => {
          setShowUpdateCardModal(false);
          // Optionally refresh data
        }}
      />
    </Card>
  );
}
