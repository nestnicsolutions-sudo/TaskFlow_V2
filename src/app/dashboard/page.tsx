import { getProjects, getUsers, createProject } from "@/app/actions";
import ProjectList from "@/components/dashboard/project-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const projectsData = await getProjects();
  const usersData = await getUsers();

  // Convert ObjectId to string for client-side consumption
  const projects = projectsData.map((p) => ({
    ...p,
    _id: p._id.toString(),
    ownerId: p._id.toString(),
    collaborators: p.collaborators.map((c: any) => ({
      ...c,
      userId: c.userId.toString(),
    })),
  }));

  const users = usersData.map((u) => ({
    ...u,
    _id: u._id.toString(),
  }));

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight font-headline">
            Projects
          </h2>
          <p className="text-muted-foreground">
            Your central hub for all ongoing and completed projects.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="-ml-1 mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form action={createProject}>
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
                <Button type="submit">Create Project</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <ProjectList initialProjects={projects} users={users} />
    </div>
  );
}
