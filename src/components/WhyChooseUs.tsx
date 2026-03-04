import { Shield, Clock, Users, Award, TrendingUp, Headphones } from "lucide-react";

export const WhyChooseUs = () => {
  const benefits = [
    {
      icon: Shield,
      title: "Verified Professionals",
      description: "All locums are GDC verified with complete documentation and indemnity insurance",
    },
    {
      icon: Clock,
      title: "Instant Bookings",
      description: "Fill urgent shifts within hours with our real-time availability system",
    },
    {
      icon: Users,
      title: "Trusted Network",
      description: "Join 500+ dental practices and 1,000+ locums across the UK",
    },
    {
      icon: Award,
      title: "Quality Assured",
      description: "Thorough vetting process ensures only qualified professionals join our platform",
    },
    {
      icon: TrendingUp,
      title: "Fair Rates",
      description: "Transparent pricing with competitive rates set by locums themselves",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Dedicated support team ready to assist practices and locums anytime",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Local Temp?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The most reliable platform for dental staffing in the UK
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 hover:border-primary/30"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
