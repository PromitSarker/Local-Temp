import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Practice, Invoice } from "./types";

interface BillingTabProps {
  practice: Practice | null;
  invoices: Invoice[];
}

function formatInvoiceDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function formatAmount(amount: number, currency: string): string {
  const symbol = currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString("en-GB", { minimumFractionDigits: 0 })}`;
}

export function BillingTab({ practice, invoices }: BillingTabProps) {
  return (
    <div className="space-y-6">
      <Card className="border border-border overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Billing Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="text-sm font-medium text-foreground">
                Billing Name
              </label>
              <div className="mt-1.5 rounded-lg bg-muted px-4 py-3 text-foreground truncate">
                {practice?.billing_name || "Not set"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                VAT Number
              </label>
              <div className="mt-1.5 rounded-lg bg-muted px-4 py-3 text-foreground">
                {practice?.vat_number || "Not set"}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Billing Address
            </label>
            <div className="mt-1.5 rounded-lg bg-muted px-4 py-3 text-foreground">
              {practice ? (
                <div className="space-y-0.5">
                  {practice.billing_address_line1 && (
                    <p>{practice.billing_address_line1}</p>
                  )}
                  {practice.billing_address_line2 && (
                    <p>{practice.billing_address_line2}</p>
                  )}
                  {practice.billing_postcode && (
                    <p>{practice.billing_postcode}</p>
                  )}
                  {practice.billing_country && (
                    <p>{practice.billing_country}</p>
                  )}
                </div>
              ) : (
                "Not set"
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {invoices.length === 0 ? (
            <p className="text-muted-foreground">No invoices yet</p>
          ) : (
            invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {formatInvoiceDate(invoice.invoice_date)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.status}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 min-w-[140px]">
                  <span className="font-medium text-foreground text-lg sm:text-base">
                    {formatAmount(invoice.amount, invoice.currency)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
