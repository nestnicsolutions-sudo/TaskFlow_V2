"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestToJoinProject } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";
import type { User } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export default function JoinProjectDialog({ users }: { users: User[] }) {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [requestingUserId, setRequestingUserId] = useState("");
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!projectId || !requestingUserId) {
      toast({
        title: "Project ID and your user are required.",
        variant: "destructive",
      });
      return;
    }
    const result = await requestToJoinProject(projectId, requestingUserId);
    if (result.success) {
      toast({
        title: "Request Sent",
        description: "Your request to join the project has been sent to the owner.",
      });
      setOpen(false);
      setProjectId("");
      setRequestingUserId("");
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
            <LogIn className="-ml-1 mr-2 h-4 w-4" />
            Join Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Join an Existing Project</DialogTitle>
            <DialogDescription>
              Enter the Project ID you received and select your user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="requestingUser">Requesting As</Label>
              <Select onValueChange={setRequestingUserId} value={requestingUserId}>
                  <SelectTrigger id="requestingUser">
                      <SelectValue placeholder="Select your user" />
                  </SelectTrigger>
                  <SelectContent>
                      {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectId">
                Project ID
              </Label>
              <Input
                id="projectId"
                name="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e.g. 60d21b4667d0d8992e610c85"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit}>Send Join Request</Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
