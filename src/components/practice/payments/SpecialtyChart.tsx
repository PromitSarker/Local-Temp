import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { usePracticePayments } from "@/hooks/usePracticePayments";
import { Loader2 } from "lucide-react";

export function SpecialtyChart() {
  const { specialtyData, loading } = usePracticePayments();

  return (
    <Card className="w-full xl:w-[450px]">
      <CardHeader>
        <CardTitle className="text-base font-medium">
          Spending by Specialty
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : specialtyData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="h-[200px] w-[200px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={specialtyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {specialtyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2.5 min-w-0">
              {specialtyData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="flex-1 text-sm text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.name}
                  </span>
                  <span className="text-sm font-medium whitespace-nowrap">
                    £{item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
