"use client";

import { useState, useEffect, useRef } from 'react';
import type { Project, User, Message } from '@/lib/data';
import { createMessage, getMessages } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '../ui/skeleton';

type ProjectChatProps = {
    project: Project;
    users: User[];
    currentUser: User;
    initialMessages: Message[];
};

export default function ProjectChat({ project, users, currentUser, initialMessages }: ProjectChatProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const getUserById = (id: string) => users.find(u => u.id === id);

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    };
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchMessages = async () => {
            const latestMessages = await getMessages(project.id);
            setMessages(latestMessages);
        };

        const intervalId = setInterval(fetchMessages, 5000); // Poll every 5 seconds

        return () => clearInterval(intervalId);
    }, [project.id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setLoading(true);
        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            projectId: project.id,
            userId: currentUser.id,
            text: newMessage,
            createdAt: new Date(),
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
        
        try {
            const createdMessage = await createMessage(project.id, newMessage);
            if (createdMessage) {
                setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? createdMessage : m));
            } else {
                 setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-secondary/50 rounded-lg border">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {messages.map(message => {
                        const sender = getUserById(message.userId as string);
                        const isCurrentUser = message.userId === currentUser.id;
                        return (
                            <div key={message.id} className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                {sender && !isCurrentUser && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={sender.avatarUrl} />
                                        <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-3 rounded-lg max-w-xs lg:max-w-md ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                                        <p className="text-sm">{message.text}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground mt-1 px-1">
                                        {sender && !isCurrentUser ? `${sender.name} · ` : ''}
                                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                     {loading && (
                        <div className="flex items-start gap-3 flex-row-reverse">
                             <div className="flex flex-col items-end">
                                <div className="p-3 rounded-lg max-w-xs lg:max-w-md bg-primary/80">
                                   <Skeleton className="h-5 w-24" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        autoComplete="off"
                        disabled={loading}
                    />
                    <Button type="submit" size="icon" disabled={loading || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
