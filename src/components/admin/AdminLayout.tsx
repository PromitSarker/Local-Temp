import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Settings, Users, CreditCard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const routes = [
    {
      href: "/admin-dashboard",
      label: "Overview",
      icon: LayoutDashboard,
      active: pathname === "/admin-dashboard",
    },
    {
      href: "/admin-dashboard/users", // Placeholder
      label: "Users",
      icon: Users,
      active: pathname.startsWith("/admin-dashboard/users"),
    },
    {
      href: "/admin-dashboard/finance", // Placeholder
      label: "Finance",
      icon: CreditCard,
      active: pathname.startsWith("/admin-dashboard/finance"),
    },
    {
      href: "/admin-dashboard/settings",
      label: "Settings",
      icon: Settings,
      active: pathname.startsWith("/admin-dashboard/settings"),
    },
  ];

  return (
    <div className={cn("pb-12 w-64 border-r bg-primary text-white min-h-screen shadow-lg", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center gap-3 px-4 mb-6">
            <div className="bg-primary-light rounded w-8 h-8 flex items-center justify-center font-bold text-white shadow-sm">
              L
            </div>
            <div>
              <div className="text-sm font-bold">Local Temp</div>
              <div className="text-xs opacity-75">Admin Panel</div>
            </div>
          </div>
          <div className="space-y-1">
            {routes.map((route) => (
              <Link key={route.href} to={route.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start transition-all",
                    route.active 
                      ? "bg-white text-primary font-semibold hover:bg-white hover:text-primary" 
                      : "text-white hover:bg-primary-light hover:text-white"
                  )}
                >
                  <route.icon className="mr-2 h-4 w-4" />
                  {route.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="px-3 py-2 mt-auto absolute bottom-0 w-64">
           <Button variant="ghost" className="w-full justify-start text-white/80 hover:text-white hover:bg-primary-light">
               <LogOut className="mr-2 h-4 w-4" />
               Logout
           </Button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
