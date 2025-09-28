import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

function SubmitButton({ pending }: { pending: boolean }) {
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Creating...' : 'Create Project'}
        </Button>
    )
}

export default function CreateProjectForm({ children, open, onOpenChange }: { children: React.ReactNode, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    
    try {
      await createProject(null, formData);
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
        setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Give your project a name and description to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <SubmitButton pending={isPending} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
