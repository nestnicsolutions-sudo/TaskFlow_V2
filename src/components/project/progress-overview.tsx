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
            <CardHeader className="pb-2">
                <CardTitle className="font-headline text-xl">Progress Overview</CardTitle>
                <CardDescription>{completionPercentage}% of tasks completed.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-row items-center gap-4">
                    <div className="h-32 w-32 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={progressData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={60}
                                    innerRadius={30}
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
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        {Object.entries(COLORS).map(([status, color]) => {
                             const count = progressData.find(d => d.name === status)?.value || 0;
                             return (
                                <div key={status} className="flex items-center">
                                    <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: color }} />
                                    <div>
                                        <div className="font-medium">{status}</div>
                                        <div className="text-muted-foreground">{count} task{count !== 1 && 's'}</div>
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
