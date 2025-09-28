"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { Badge } from "../ui/badge";
import type { Notification } from "@/lib/data";
import { markNotificationsAsRead } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";

export default function NotificationPopover({ notifications: initialNotifications }: { notifications: Notification[] }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [displayedNotifications, setDisplayedNotifications] = useState(initialNotifications);
  const { toast } = useToast();

  useEffect(() => {
    setNotifications(initialNotifications);
    if (!open) {
      setDisplayedNotifications(initialNotifications);
    }
  }, [initialNotifications, open]);

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && notifications.length > 0) {
      const notificationIds = notifications.map(n => n.id);
      
      // Keep current notifications for display inside the popover
      setDisplayedNotifications(notifications);
      
      // Optimistically clear the badge count
      setNotifications([]); 

      const result = await markNotificationsAsRead(notificationIds);
      if (!result.success) {
        toast({ title: "Error", description: "Failed to mark notifications as read.", variant: "destructive" });
        // Revert optimistic update on failure
        setNotifications(displayedNotifications);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <Badge variant="destructive" className="absolute -right-1 -top-1 px-1.5 py-0.5 text-xs h-auto">
              {notifications.length}
            </Badge>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 border-b">
          <h4 className="font-medium leading-none">Notifications</h4>
          <p className="text-sm text-muted-foreground">You have {displayedNotifications.length} unread messages.</p>
        </div>
        <ScrollArea className="h-[280px]">
          <div className="p-2">
            {displayedNotifications.length > 0 ? (
              displayedNotifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={`/dashboard/projects/${notification.projectId}?tab=chat`}
                  className="block w-full"
                  onClick={() => setOpen(false)}
                >
                  <div className="rounded-md p-3 hover:bg-secondary transition-colors">
                    <p className="text-xs text-muted-foreground mb-1">
                      New message in <span className="font-semibold text-foreground">{notification.projectName}</span>
                    </p>
                    <p className="text-sm font-semibold">{notification.senderName}</p>
                    <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-10 px-4">
                <CheckCheck className="mx-auto h-8 w-8 text-green-500" />
                <p className="mt-2">You're all caught up!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
