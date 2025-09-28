"use client"

import type { Task } from "@/lib/data";
import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, Circle, Loader, PauseCircle } from "lucide-react";

const COLORS = {
  'Completed': 'hsl(var(--chart-2))',
  'In Progress': 'hsl(var(--chart-1))',
  'To Do': 'hsl(var(--muted-foreground))',
  'Pending': 'hsl(var(--chart-4))',
};

const ICONS = {
    'To Do': <Circle className="mr-2 h-4 w-4" />,
    'In Progress': <Loader className="mr-2 h-4 w-4 animate-spin" />,
    'Pending': <PauseCircle className="mr-2 h-4 w-4" />,
    'Completed': <CheckCircle className="mr-2 h-4 w-4 text-green-500" />,
}

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
        <Card>
            <CardHeader className="pb-2 pt-4">
                <CardTitle className="font-headline text-lg">Progress Overview</CardTitle>
                <CardDescription className="text-xs">{completionPercentage}% of tasks completed.</CardDescription>
            </CardHeader>
            <CardContent className="py-2">
                <div className="flex flex-row items-center gap-4">
                    <div className="h-20 w-20 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={progressData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={35}
                                    innerRadius={20}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {progressData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    background: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                  }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-1 items-center justify-around text-xs">
                        {Object.entries(COLORS).map(([status, color]) => {
                             const count = progressData.find(d => d.name === status)?.value || 0;
                             return (
                                <div key={status} className="flex items-center">
                                    <div className="h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: color }} />
                                    <div className="flex flex-col">
                                        <div className="font-medium">{status}</div>
                                        <div className="text-muted-foreground -mt-1">{count}</div>
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
