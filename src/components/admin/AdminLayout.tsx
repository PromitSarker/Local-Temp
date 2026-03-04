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
    <div className={cn("pb-12 w-64 border-r bg-card min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Admin Portal
          </h2>
          <div className="space-y-1">
            {routes.map((route) => (
              <Link key={route.href} to={route.href}>
                <Button
                  variant={route.active ? "secondary" : "ghost"}
                  className="w-full justify-start"
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
           <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50">
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
