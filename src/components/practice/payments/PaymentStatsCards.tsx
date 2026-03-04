import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, CheckCircle2, Clock, TrendingDown } from "lucide-react";

import { usePracticePayments } from "@/hooks/usePracticePayments";
import { Loader2 } from "lucide-react";

export function PaymentStatsCards() {
  const { stats, loading } = usePracticePayments();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="py-4">
            <CardContent className="flex flex-col gap-3 items-center justify-center h-24">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "This Month",
      value: `£${stats.thisMonth.toLocaleString()}`,
      subtitle: "Recent earnings",
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600">
          <div className="h-3 w-3 rounded-full bg-white" />
        </div>
      ),
      trend: "none",
    },
    {
      title: "Paid",
      value: `£${stats.totalPaid.toLocaleString()}`,
      subtitle: `${stats.countPaid} payments`,
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
      ),
    },
    {
      title: "Pending",
      value: `£${stats.totalPending.toLocaleString()}`,
      subtitle: `${stats.countPending} payments`,
      icon: (
        <div className="flex i-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-6 w-6 text-amber-500" />
        </div>
      ),
    },
    {
      title: "Avg Per Shift",
      value: `£${stats.countPaid > 0 ? Math.floor(stats.totalPaid / stats.countPaid).toLocaleString() : 0}`,
      subtitle: `Based on ${stats.countPaid} shifts`,
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <TrendingDown className="h-6 w-6 text-slate-500" />
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((stat) => (
        <Card key={stat.title} className="py-4">
          <CardContent className="flex flex-col gap-3">
            {stat.icon}
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-3xl font-semibold tracking-tight">
                {stat.value}
              </p>
            </div>
            {stat.trend === "up" ? (
              <div className="flex items-center gap-1 text-sm text-emerald-600">
                <TrendingUp className="h-4 w-4" />
                {stat.subtitle}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{stat.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
