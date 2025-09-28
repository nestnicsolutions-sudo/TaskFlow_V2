"use client"

import type { Task } from "@/lib/data";
import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const COLORS = {
  'Completed': 'hsl(var(--chart-2))',
  'In Progress': 'hsl(var(--chart-1))',
  'To Do': 'hsl(var(--muted-foreground))',
  'Pending': 'hsl(var(--chart-4))',
};

export default function ProgressOverview({ tasks }: { tasks: Task[] }) {
    const progressData = useMemo(() => {
        const counts = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [tasks]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className="flex items-center gap-2 text-sm">
            <div className="h-10 w-10">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={[{ name: 'completed', value: completionPercentage }, { name: 'remaining', value: 100 - completionPercentage }]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={18}
                            innerRadius={12}
                            fill="#8884d8"
                            dataKey="value"
                            strokeWidth={2}
                        >
                            <Cell fill="hsl(var(--chart-2))" />
                            <Cell fill="hsl(var(--border))" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex flex-col">
                <span className="font-semibold">{completionPercentage}% complete</span>
                <span className="text-xs text-muted-foreground">{completedTasks} of {totalTasks} tasks</span>
            </div>
        </div>
    );
}
