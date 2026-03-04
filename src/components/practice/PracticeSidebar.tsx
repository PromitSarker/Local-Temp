import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Calendar,
  DollarSign,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { path: "/practice-dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    path: "/practice-dashboard/find-locums",
    label: "Find Locums",
    icon: Search,
  },
  { path: "/practice-dashboard/bookings", label: "Bookings", icon: Calendar },
  { path: "/practice-dashboard/payments", label: "Payments", icon: DollarSign },
  {
    path: "/practice-dashboard/messages",
    label: "Messages",
    icon: MessageSquare,
  },
  { path: "/practice-dashboard/settings", label: "Settings", icon: Settings },
];

interface PracticeSidebarProps {
  onLogout: () => void;
  isMobileSheet?: boolean;
}

export function PracticeSidebar({
  onLogout,
  isMobileSheet = false,
}: PracticeSidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    if (path === "/practice-dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        "h-screen bg-background border-r border-border flex flex-col transition-all duration-300",
        isMobileSheet
          ? "relative w-full"
          : "fixed left-0 top-0 hidden md:flex z-40",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-xl">
              LT
            </span>
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-foreground">
              Local Temp
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
              isActive(item.path)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "w-6 h-6 rounded-full bg-background border border-border shadow-sm",
          isMobileSheet
            ? "relative -right-0 top-0"
            : "absolute -right-3 top-20",
        )}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </Button>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed && "justify-center",
          )}
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
