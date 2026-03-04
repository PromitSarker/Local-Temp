import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import locumImage from "@/assets/locum-professional.jpg";
import practiceImage from "@/assets/dental-team-new.png";

export const RegistrationSection = () => {
  return (
    <section id="register" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Locum Card */}
            <div className="group">
              <div className="relative overflow-hidden rounded-2xl mb-6 aspect-[4/3]">
                <img 
                  src={locumImage} 
                  alt="Dental locum professional" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-4">Why Join as a Locum</h3>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Work when and where you want</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Build your professional profile</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Set your own hourly rates</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Direct messaging with practices</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Automatic invoicing & fast payments</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Digital document management (GDC, Indemnity)</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>No agency fees – keep 100% of your earnings</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>GPS-based job discovery nearby</span>
                </li>
              </ul>

              <Button asChild className="shadow-primary" size="lg">
                <Link to="/register?type=locum">
                  Join as a Locum
                </Link>
              </Button>
            </div>

            {/* Practice Card */}
            <div className="group">
              <div className="relative overflow-hidden rounded-2xl mb-6 aspect-[4/3]">
                <img 
                  src={practiceImage} 
                  alt="Dental practice team" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-4">Why Register Your Practice</h3>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Access a pool of verified locums</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Easily manage your staffing needs</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Direct messaging with locums</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Secure payments & instant invoices</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Review locum ratings and reliability</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>One-click booking & scheduling</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Automated compliance & GDC checks</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Digital timesheets & performance tracking</span>
                </li>
              </ul>

              <Button asChild className="shadow-primary" size="lg">
                <Link to="/register?type=practice">
                  Register Your Practice
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
