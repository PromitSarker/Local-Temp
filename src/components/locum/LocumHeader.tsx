import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationPopover } from "@/components/NotificationPopover";


interface LocumHeaderProps {
  userName: string;
  onMenuToggle?: () => void;
}

export function LocumHeader({ userName, onMenuToggle }: LocumHeaderProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuToggle}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">
            Welcome back, {userName.split(" ")[0]}!
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <NotificationPopover viewAllPath="/locum-dashboard/notifications" />
          <Avatar className="h-9 w-9">

            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
