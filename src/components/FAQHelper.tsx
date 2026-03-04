import { useState } from "react";
import { HelpCircle, X, ChevronLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How do I sign up as a locum?",
    answer: "Click the 'Register' button in the navigation bar and select 'I am a Locum'. You'll need to provide your GDC registration and other professional documents.",
  },
  {
    question: "How do I book a locum for my practice?",
    answer: "After registering as a Practice, you can search for available locums in your area and send them booking requests directly through the dashboard.",
  },
  {
    question: "What are the service fees?",
    answer: "Registration is free. Practices pay a small service fee per confirmed booking. Locums always receive their full quoted hourly rate.",
  },
  {
    question: "How does the payment system work?",
    answer: "We use secure Stripe integration. Practices are charged when a booking is confirmed, and funds are released to locums after the shift is completed.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes, we use industry-standard encryption and secure Supabase backend to ensure all your personal and professional information is protected.",
  },
];

export const FAQHelper = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQItem | null>(null);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (isOpen) setSelectedFAQ(null);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4 pointer-events-none">
      {/* FAQ Window */}
      <div
        className={cn(
          "w-[320px] md:w-[380px] max-h-[500px] overflow-hidden transition-all duration-300 transform origin-bottom-right pointer-events-auto",
          isOpen
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-10 opacity-0 scale-95 pointer-events-none"
        )}
      >
        <Card className="flex flex-col h-full shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md">
          {/* Header */}
          <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">SmileConnect Helper</h3>
                <p className="text-[10px] opacity-80">Instant answers to your questions</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-white/20 rounded-full"
              onClick={toggleOpen}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {!selectedFAQ ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-sm font-medium text-muted-foreground mb-4 italic">
                  How can we help you today?
                </p>
                {faqs.map((faq, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedFAQ(faq)}
                    className="w-full text-left p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-medium flex items-center justify-between group"
                  >
                    <span>{faq.question}</span>
                    <ChevronLeft className="w-4 h-4 rotate-180 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                <button
                  onClick={() => setSelectedFAQ(null)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group"
                >
                  <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                  Back to questions
                </button>
                <div className="space-y-3">
                  <h4 className="font-bold text-foreground">{selectedFAQ.question}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-4 rounded-xl border border-border">
                    {selectedFAQ.answer}
                  </p>
                </div>
                <div className="pt-4 border-t border-border mt-4">
                  <p className="text-[11px] text-muted-foreground text-center">
                    Still have questions? Feel free to browse our main FAQ section below.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Toggle Button */}
      <Button
        onClick={toggleOpen}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center p-0 group pointer-events-auto",
          isOpen ? "bg-white text-primary border-2 border-primary" : "bg-primary text-primary-foreground"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 animate-in spin-in-90 duration-300" />
        ) : (
          <div className="relative">
            <HelpCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-primary animate-pulse" />
          </div>
        )}
      </Button>

      {/* Styled Scrollbar CSS (inline approach or usually in global.css) */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};
