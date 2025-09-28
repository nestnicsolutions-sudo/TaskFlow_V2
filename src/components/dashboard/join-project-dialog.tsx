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

export default function JoinProjectDialog() {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!projectId) {
      toast({
        title: "Project ID is required.",
        variant: "destructive",
      });
      return;
    }
    const result = await requestToJoinProject(projectId);
    if (result.success) {
      toast({
        title: "Request Sent",
        description: "Your request to join the project has been sent to the owner.",
      });
      setOpen(false);
      setProjectId("");
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
              Enter the Project ID you received from a team member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="projectId" className="text-right">
                Project ID
              </Label>
              <Input
                id="projectId"
                name="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="col-span-3"
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
