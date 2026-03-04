export interface Practice {
  id: string;
  billing_name: string;
  vat_number: string | null;
  billing_address_line1: string | null;
  billing_address_line2: string | null;
  billing_city: string | null;
  billing_postcode: string | null;
  billing_country: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Manager" | "Staff";
  avatar_color: string;
}

export interface Invoice {
  id: string;
  invoice_date: string;
  amount: number;
  currency: string;
  status: "Paid" | "Pending" | "Overdue";
}
