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

export default function CreateProjectForm({ userId, children, open, onOpenChange }: { userId: string, children: React.ReactNode, open: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent className="sm:max-w-[425px]">
        <form action={createProject}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Give your project a name and description to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <input type="hidden" name="userId" value={userId} />
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
            <Button type="submit">Create Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
