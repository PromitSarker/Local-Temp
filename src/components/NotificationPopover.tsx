import { Bell, Calendar, FileText, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "shift":
      return <Calendar className="w-4 h-4" />;
    case "document":
      return <FileText className="w-4 h-4" />;
    case "payment":
      return <DollarSign className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "shift":
      return "bg-blue-50 text-blue-600";
    case "document":
      return "bg-amber-50 text-amber-600";
    case "payment":
      return "bg-emerald-50 text-emerald-600";
    default:
      return "bg-gray-50 text-gray-600";
  }
};

interface NotificationPopoverProps {
  viewAllPath: string;
}

export function NotificationPopover({ viewAllPath }: NotificationPopoverProps) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group hover:bg-primary/10 transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background shadow-sm animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium h-fit">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead()}
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="h-80">
          {recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-muted-foreground opacity-50" />
              </div>
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/50 last:border-0",
                    !notification.read && "bg-primary/5"
                  )}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                      getNotificationColor(notification.type)
                    )}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm leading-tight mb-1",
                      !notification.read ? "font-semibold text-foreground" : "text-muted-foreground"
                    )}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t border-border bg-muted/30">
          <Button variant="ghost" size="sm" className="w-full text-xs text-primary hover:text-primary-dark" asChild>
            <Link to={viewAllPath}>View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
