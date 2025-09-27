"use client";

import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/lib/data';
import { differenceInHours, isPast } from 'date-fns';
import * as Tone from 'tone';
import { Button } from '../ui/button';
import { BellRing } from 'lucide-react';

export default function DeadlineNotifications({ tasks }: { tasks: Task[] }) {
    const { toast } = useToast();
    const notifiedTasks = useRef(new Set<string>());
    const [audioReady, setAudioReady] = useState(false);
    const synth = useRef<Tone.Synth | null>(null);

    useEffect(() => {
        if (!audioReady) return;

        const checkDeadlines = () => {
            tasks.forEach(task => {
                if (task.status === 'Completed' || notifiedTasks.current.has(task.id)) {
                    return;
                }

                const now = new Date();
                const dueDate = new Date(task.dueDate);
                
                if (isPast(dueDate)) {
                    toast({
                        title: `Task Overdue: ${task.title}`,
                        description: `This task was due on ${dueDate.toLocaleDateString()}.`,
                        variant: 'destructive',
                    });
                    synth.current?.triggerAttackRelease("C4", "8n");
                    notifiedTasks.current.add(task.id);
                } else {
                    const hoursUntilDue = differenceInHours(dueDate, now);
                    if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
                        toast({
                            title: `Task Due Soon: ${task.title}`,
                            description: `This task is due in less than 24 hours.`,
                        });
                        synth.current?.triggerAttackRelease("E4", "8n");
                        notifiedTasks.current.add(task.id);
                    }
                }
            });
        };

        const intervalId = setInterval(checkDeadlines, 60000); // Check every minute
        return () => clearInterval(intervalId);
    }, [tasks, toast, audioReady]);

    const handleEnableAudio = async () => {
        await Tone.start();
        synth.current = new Tone.Synth().toDestination();
        setAudioReady(true);
        toast({ title: 'Notifications Enabled', description: 'You will now receive deadline alerts.' });
    };

    if (audioReady) {
        return null; // Component is active in the background
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Button onClick={handleEnableAudio}>
                <BellRing className="mr-2 h-4 w-4" />
                Enable Notifications
            </Button>
        </div>
    );
}
