import {
  UserPlus,
  BellRing,
  CalendarCheck,
  Target,
  CheckCircle2,
  Search,
  MousePointerClick,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const locumSteps = [
  {
    icon: UserPlus,
    title: "Create Your Free Profile",
    description: "Set your availability, rates, and preferences to get started.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: BellRing,
    title: "Receive Booking Requests",
    description: "Get notified instantly when a practice sends you a booking request.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: CalendarCheck,
    title: "Accept & Work",
    description: "Confirm bookings, show up, and provide excellent dental care.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Target, // Or CreditCard
    title: "Get Paid Quickly",
    description: "No more delayed payments—secure and fast transactions.",
    color: "bg-rose-100 text-rose-600", // "Target" red/rose theme
  },
];

const practiceSteps = [
  {
    icon: CheckCircle2,
    title: "Create an Account",
    description: "Create an account & post a shift for FREE in minutes.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Search,
    title: "Select",
    description: "Choose from 15-30+ available verified locums in your area.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: MousePointerClick, // or Send
    title: "Book",
    description: "Send booking requests and track responses in real-time.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: ShieldCheck,
    title: "Payment",
    description: "No setup fees. All prices shown include fees and VAT.",
    color: "bg-teal-100 text-teal-600",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
            How It Works – <span className="text-primary">Simple & Seamless</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you're a dental professional looking for work or a practice in need of coverage,
            our platform makes the process effortless.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Locums Column */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-10 w-1 bg-primary rounded-full" />
              <h3 className="text-2xl font-bold text-foreground">For Locums</h3>
            </div>

            <div className="space-y-6">
              {locumSteps.map((step, index) => (
                <Card key={index} className="border-none shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group bg-background/80 backdrop-blur-sm">
                  <CardContent className="p-6 flex items-start gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${step.color} group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">{step.title}</h4>
                      <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto shadow-primary group">
                <Link to="/register?type=locum">
                  Start as a Locum
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Practices Column */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-10 w-1 bg-blue-600 rounded-full" />
              <h3 className="text-2xl font-bold text-foreground">For Dental Practices</h3>
            </div>

            <div className="space-y-6">
              {practiceSteps.map((step, index) => (
                <Card key={index} className="border-none shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group bg-background/80 backdrop-blur-sm">
                  <CardContent className="p-6 flex items-start gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${step.color} group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-2 text-foreground group-hover:text-blue-600 transition-colors">{step.title}</h4>
                      <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="pt-4">
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-blue-200 hover:bg-blue-50 text-blue-700 group">
                <Link to="/register?type=practice">
                  Register Your Practice
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
