import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export const Navigation = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isHashActive = (hash: string) => location.hash === hash;

  const navLinks = [
    { path: "/", label: "Home", type: "route" },
    { path: "/#why-choose-us", label: "About", type: "hash" },
    { path: "/#how-it-works", label: "How It Works", type: "hash" },
    { path: "/#contact", label: "Contact", type: "hash" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-primary transition-transform group-hover:scale-105">
              <span className="text-primary-foreground font-bold text-xl">
                LT
              </span>
            </div>
            <span className="text-xl font-bold text-foreground">
              Local Temp
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center md:space-x-4 lg:space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={link.path}
                className={`text-sm font-medium transition-colors relative group ${
                  (link.type === "route" && isActive(link.path)) ||
                  (link.type === "hash" &&
                    isHashActive(link.path.split("#")[1]))
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${
                    (link.type === "route" && isActive(link.path)) ||
                    (link.type === "hash" &&
                      isHashActive(link.path.split("#")[1]))
                      ? "w-full"
                      : "w-0 group-hover:w-full"
                  }`}
                />
              </a>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="outline" asChild>
              <Link to="/register">Register</Link>
            </Button>
            <Button asChild className="shadow-primary">
              <Link to="/login">Log In</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 animate-fade-in">
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-sm font-medium transition-colors ${
                  (link.type === "route" && isActive(link.path)) ||
                  (link.type === "hash" &&
                    isHashActive(link.path.split("#")[1]))
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  Register
                </Link>
              </Button>
              <Button asChild className="w-full shadow-primary">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  Log In
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
