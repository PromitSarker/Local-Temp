import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background py-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">
                  LT
                </span>
              </div>
              <span className="text-xl font-bold">Local Temp</span>
            </div>
            <p className="text-background/70 text-sm">
              Connecting dental practices with trusted locums across the UK.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/#why-choose-us"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/#how-it-works"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="/#contact"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/#contact"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/#contact"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/#contact"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Cookie Policy
                </a>
              </li>
            </ul>
            <p className="text-xs text-background/40 mt-3">Contact us for legal inquiries.</p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Follow Us</h4>
            <p className="text-background/50 text-sm">Coming soon! We'll be on social media shortly.</p>
          </div>
        </div>

        <div className="pt-8 border-t border-background/10 flex items-center justify-between">
          <p className="text-sm text-background/70">
            &copy; {currentYear} Local Temp. All rights reserved.
          </p>
          <Link
            to="/admin"
            className="text-xs text-background/30 hover:text-background/50 transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
};
