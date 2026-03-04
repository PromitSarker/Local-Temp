import { Gavel, Receipt, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

const benefits = [
  {
    icon: Gavel,
    title: "Automated Compliance",
    description: "Stay audit-ready. Our system automatically tracks GDC numbers, indemnity expirations, and DBS checks.",
  },
  {
    icon: Receipt,
    title: "Instant Invoicing",
    description: "Eliminate manual bookkeeping. Invoices are generated and processed immediately after shift completion.",
  },
  {
    icon: FileText,
    title: "Paperless Timesheets",
    description: "Digital sign-offs directly on your mobile device. No more scanning or posting physical timesheets.",
  },
];

export const Benefits = () => {
  return (
    <section className="py-24 bg-[#f8fafc]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#1e293b] mb-4">Benefits for the Modern Practice</h2>
          <p className="text-lg text-[#64748b] max-w-2xl mx-auto">
            Streamline your clinic's operations with tools designed for high-efficiency dental environments.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className="p-10 border-none shadow-sm bg-white rounded-2xl hover:shadow-md transition-all duration-300 text-center flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-[#f8fafc] rounded-2xl flex items-center justify-center mb-8">
                <benefit.icon className="w-8 h-8 text-[#059669]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1e293b] mb-4">{benefit.title}</h3>
              <p className="text-[#64748b] leading-relaxed">{benefit.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
