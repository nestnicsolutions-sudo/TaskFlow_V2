
"use client";

import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/lib/data';
import { differenceInHours, isPast } from 'date-fns';
import * as Tone from 'tone';
import { Button } from '../ui/button';
import { BellRing, BellOff } from 'lucide-react';

export default function DeadlineNotifications({ tasks }: { tasks: Task[] }) {
    const { toast } = useToast();
    const notifiedTasks = useRef(new Set<string>());
    const [audioReady, setAudioReady] = useState(false);
    const synth = useRef<Tone.Synth | null>(null);

    useEffect(() => {
        // On component mount, check if notifications were previously enabled.
        const storedPreference = localStorage.getItem('notificationsEnabled');
        if (storedPreference === 'true') {
            initializeAudio();
        }
    }, []);

    useEffect(() => {
        if (!audioReady) return;

        const checkDeadlines = () => {
            let notificationDelay = 0;
            tasks.forEach(task => {
                if (task.status === 'Completed' || notifiedTasks.current.has(task.id)) {
                    return;
                }

                const now = new Date();
                const dueDate = new Date(task.dueDate);
                
                const playSound = (note: string) => {
                    // Schedule the sound to play with a small offset to avoid race conditions
                    Tone.Transport.scheduleOnce((time) => {
                        synth.current?.triggerAttackRelease(note, "8n", time);
                    }, `+${notificationDelay}`);
                    notificationDelay += 0.1; // Stagger subsequent sounds
                }

                if (isPast(dueDate)) {
                    toast({
                        title: `Task Overdue: ${task.title}`,
                        description: `This task was due on ${dueDate.toLocaleDateString()}.`,
                        variant: 'destructive',
                    });
                    playSound("C4");
                    notifiedTasks.current.add(task.id);
                } else {
                    const hoursUntilDue = differenceInHours(dueDate, now);
                    if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
                        toast({
                            title: `Task Due Soon: ${task.title}`,
                            description: `This task is due in less than 24 hours.`,
                        });
                        playSound("E4");
                        notifiedTasks.current.add(task.id);
                    }
                }
            });
             if (notificationDelay > 0) {
                Tone.Transport.start();
            }
        };

        const intervalId = setInterval(checkDeadlines, 60000); // Check every minute
        checkDeadlines(); // Check immediately on load

        return () => {
            clearInterval(intervalId);
            Tone.Transport.stop();
            Tone.Transport.cancel();
        }
    }, [tasks, toast, audioReady]);

    const initializeAudio = async () => {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        synth.current = new Tone.Synth().toDestination();
        setAudioReady(true);
    };

    const handleEnableAudio = async () => {
        await initializeAudio();
        localStorage.setItem('notificationsEnabled', 'true');
        toast({ title: 'Notifications Enabled', description: 'You will now receive deadline alerts.' });
    };

    const handleDisableAudio = () => {
        if (synth.current) {
            synth.current.dispose();
            synth.current = null;
        }
        setAudioReady(false);
        localStorage.setItem('notificationsEnabled', 'false');
        toast({ title: 'Notifications Disabled', description: 'You will no longer receive deadline alerts.' });
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {audioReady ? (
                <Button onClick={handleDisableAudio} variant="outline">
                    <BellOff className="mr-2 h-4 w-4" />
                    Disable Notifications
                </Button>
            ) : (
                <Button onClick={handleEnableAudio}>
                    <BellRing className="mr-2 h-4 w-4" />
                    Enable Notifications
                </Button>
            )}
        </div>
    );
}
