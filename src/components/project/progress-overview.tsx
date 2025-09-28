"use client"

import type { Task } from "@/lib/data";
import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";

const chartConfig = {
  tasks: {
    label: "Tasks",
  },
  'To Do': {
    label: "To Do",
    color: "hsl(var(--muted-foreground))",
  },
  'In Progress': {
    label: "In Progress",
    color: "hsl(var(--chart-1))",
  },
  'Pending': {
    label: "Pending",
    color: "hsl(var(--chart-4))",
  },
  'Completed': {
    label: "Completed",
    color: "hsl(var(--chart-2))",
  },
} as const;

export default function ProgressOverview({ tasks }: { tasks: Task[] }) {
    const chartData = useMemo(() => {
        const counts = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value]) => ({ name, value, fill: chartConfig[name as keyof typeof chartConfig]?.color || '#ccc' }));
    }, [tasks]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <Card className="flex flex-col h-full col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
            <CardDescription>{completionPercentage}% of all tasks completed.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      strokeWidth={5}
                      labelLine={false}
                      label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius,
                        outerRadius,
                        value,
                        index,
                      }) => {
                        const RADIAN = Math.PI / 180
                        const radius = 12 + innerRadius + (outerRadius - innerRadius)
                        const x = cx + radius * Math.cos(-midAngle * RADIAN)
                        const y = cy + radius * Math.sin(-midAngle * RADIAN)

                        return (
                          <text
                            x={x}
                            y={y}
                            className="fill-muted-foreground text-xs"
                            textAnchor={x > cx ? "start" : "end"}
                            dominantBaseline="central"
                          >
                            {chartData[index].name} ({value})
                          </text>
                        )
                      }}
                    >
                      {chartData.map((entry) => (
                         <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend content={() => null} />
                  </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
    );
}
