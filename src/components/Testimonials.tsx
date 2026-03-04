import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useState, useEffect } from "react";

const testimonials = [
  {
    name: "Dr. Sarah Jenkins",
    role: "Locum Dentist, 4 years",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200",
    text: "Local Temp has completely changed how I manage my work-life balance. I can pick up shifts that fit my schedule, and the payment process is always seamless.",
    bgColor: "bg-[#059669]",
    textColor: "text-white",
  },
  {
    name: "Mark Thompson",
    role: "Practice Manager, Smiles Dental",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200",
    text: "Filling last-minute gaps used to be a nightmare. Since joining Local Temp, we find high-quality staff in minutes. The quality of locums is consistently excellent.",
    bgColor: "bg-[#0f172a]",
    textColor: "text-white",
  },
];

export const Testimonials = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#1e293b] mb-4">Success Stories</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className={`p-8 md:p-12 border-none shadow-none rounded-3xl ${testimonial.bgColor} ${testimonial.textColor} relative overflow-hidden`}
            >
              <div className="absolute top-8 right-8 text-white/20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              <p className="text-xl md:text-2xl font-medium mb-12 italic leading-relaxed relative z-10">
                "{testimonial.text}"
              </p>
              <div className="flex items-center gap-4 relative z-10">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
                />
                <div>
                  <h4 className="font-bold text-lg">{testimonial.name}</h4>
                  <p className="opacity-80 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
