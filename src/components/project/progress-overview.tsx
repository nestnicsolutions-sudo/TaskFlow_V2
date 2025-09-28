"use client"

import type { Task } from "@/lib/data";
import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
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
    const { chartData, totalTasks, completionPercentage, statusCounts } = useMemo(() => {
        const counts = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const allStatuses: (keyof typeof chartConfig)[] = ['To Do', 'In Progress', 'Pending', 'Completed'];
        allStatuses.forEach(status => {
            if (!counts[status]) {
                counts[status] = 0;
            }
        });

        const chartData = Object.entries(counts).map(([name, value]) => ({ name, value, fill: chartConfig[name as keyof typeof chartConfig]?.color || '#ccc' }));
        const totalTasks = tasks.length;
        const completedTasks = counts['Completed'] || 0;
        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return { chartData, totalTasks, completionPercentage, statusCounts: counts };
    }, [tasks]);


    return (
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
            <CardDescription>{completionPercentage}% of all tasks completed.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center gap-4">
             <div className="w-1/3">
                <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square h-full"
                >
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel nameKey="name" />}
                        />
                        <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={30}
                        strokeWidth={2}
                        >
                        {chartData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                        ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                </ChartContainer>
            </div>
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(statusCounts).map(([status, count]) => {
                    const config = chartConfig[status as keyof typeof chartConfig];
                    return (
                        <div key={status} className="flex items-center gap-2">
                             <span
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: config.color }}
                            />
                            <div>
                                <p className="text-sm text-muted-foreground">{config.label}</p>
                                <p className="text-lg font-bold">{count}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
          </CardContent>
        </Card>
    );
}
