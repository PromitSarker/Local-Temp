import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const FAQ = () => {
  const faqs = [
    {
      question: "How does Local Temp verify locums?",
      answer: "All locums must provide GDC registration, professional qualifications, indemnity insurance, DBS certification, and other required documentation. Our team manually reviews each application before approval.",
    },
    {
      question: "What are the fees for using Local Temp?",
      answer: "Registration is completely free for both practices and locums. Practices pay a small service fee per booking, while locums keep their full hourly rate. No hidden charges.",
    },
    {
      question: "How quickly can I fill a shift?",
      answer: "Most urgent shifts are filled within 2-4 hours. Our real-time notification system alerts available locums immediately, and you can confirm bookings with just a few clicks.",
    },
    {
      question: "Can I set my own rates as a locum?",
      answer: "Absolutely. Locums have full control over their hourly or daily rates. You can adjust your rates based on location, type of practice, and your expertise level.",
    },
    {
      question: "What if I need to cancel a booking?",
      answer: "Both parties can cancel bookings according to our cancellation policy. Early cancellations (48+ hours) incur no penalties. Late cancellations may result in fees to protect both parties.",
    },
    {
      question: "Is my payment secure?",
      answer: "Yes, all payments are processed through secure, encrypted payment gateways. Practices pay upfront, and locums receive payment within 24 hours after shift completion.",
    },
  ];

  return (
    <section className="py-20 bg-secondary/10">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Got questions? We've got answers.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
