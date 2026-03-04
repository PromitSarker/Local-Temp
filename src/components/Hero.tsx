import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { CheckCircle, Calendar, DollarSign, MapPin, Search } from "lucide-react";
import heroImage from "@/assets/hero-consultation.jpg";

const trustBadges = [
  { icon: CheckCircle, label: "Verified Professionals" },
  { icon: Calendar, label: "Instant Booking" },
  { icon: DollarSign, label: "Secure Payments" },
  { icon: MapPin, label: "UK Wide Coverage" },
];

export const Hero = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("");
  const [date, setDate] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.append("city", location);
    if (role) params.append("role", role);
    if (date) params.append("date", date);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <section className="relative pt-24 pb-8 overflow-hidden bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Main Hero Grid */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-8">
            {/* Content Column */}
            <div className="flex flex-col justify-center text-left order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-foreground mb-6 animate-fade-in leading-tight tracking-tight">
                Connecting Dental Professionals and Practices –{" "}
                <span className="text-primary">The Smart Way</span>
              </h1>

              <p className="text-base md:text-lg text-muted-foreground mb-8 animate-fade-in leading-relaxed">
                Local Temp simplifies dental staffing across the UK. Find flexible locum work or hire trusted professionals – quickly and confidently.
              </p>

              {/* Inline Search Bar */}
              <div className="bg-card border border-border rounded-xl p-2 shadow-lg animate-fade-in mb-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select onValueChange={(v) => setRole(v)}>
                    <SelectTrigger className="flex-1 border-0 bg-transparent focus:ring-0">
                      <SelectValue placeholder="Locum Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dental-nurse">Dental Nurse</SelectItem>
                      <SelectItem value="dental-hygienist">Dental Hygienist</SelectItem>
                      <SelectItem value="dental-therapist">Dental Therapist</SelectItem>
                      <SelectItem value="ortho-therapist">Ortho Therapist</SelectItem>
                      <SelectItem value="dentist">Dentist</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="hidden sm:block w-px bg-border" />
                  <Input 
                    placeholder="Location" 
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  <div className="hidden sm:block w-px bg-border" />
                  <Input 
                    type="date" 
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  <Button size="default" className="shrink-0" onClick={handleSearch}>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            {/* Image Column */}
            <div className="flex items-center justify-center animate-fade-in order-1 lg:order-2">
              <div className="relative">
                <img 
                  src={heroImage} 
                  alt="Dental professional consulting with patient" 
                  className="w-full max-w-md lg:max-w-lg rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 py-8 border-t border-border animate-fade-in">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <badge.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
