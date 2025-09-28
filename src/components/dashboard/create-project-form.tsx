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
import { useActionState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFormStatus } from "react-dom";

type FormState = {
  success: boolean;
  message: string | null;
}

const initialState: FormState = {
  success: false,
  message: null,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Creating...' : 'Create Project'}
        </Button>
    )
}

export default function CreateProjectForm({ children, open, onOpenChange }: { children: React.ReactNode, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  
  const createProjectAction = async (prevState: FormState, formData: FormData): Promise<FormState> => {
    try {
      await createProject(formData);
      return { success: true, message: "Project created successfully!" };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : "An unknown error occurred." };
    }
  };

  const [state, formAction] = useActionState(createProjectAction, initialState);

  useEffect(() => {
    if (open && state.success) {
      onOpenChange(false);
      toast({
        title: "Success",
        description: state.message,
      });
    } else if (state.message && !state.success) { // only show error toasts
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, open, onOpenChange, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent className="sm:max-w-[425px]">
        <form action={formAction}>
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
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
