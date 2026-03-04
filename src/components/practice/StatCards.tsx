import { AlertCircle, CheckCircle, PoundSterling } from "lucide-react";

const stats = [
  {
    label: "Active Bookings",
    value: "3",
    icon: null,
    iconBg: "bg-primary",
    iconColor: "text-primary-foreground",
  },
  {
    label: "Pending",
    value: "1",
    icon: AlertCircle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-500",
  },
  {
    label: "Completed",
    value: "2",
    icon: CheckCircle,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    label: "This Month",
    value: "£1,640",
    icon: PoundSterling,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-500",
  },
];

export function StatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-background border border-border rounded-xl p-4 flex items-center gap-4"
        >
          <div
            className={`w-12 h-12 rounded-full ${stat.iconBg} flex items-center justify-center`}
          >
            {stat.icon ? (
              <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary" />
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-semibold text-foreground">
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
