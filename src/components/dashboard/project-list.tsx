"use client";

import type { User } from "@/lib/data";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Users, FolderKanban } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createProject } from "@/app/actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

export default function ProjectList({ initialProjects, users }: { initialProjects: any[], users: User[] }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const getUserById = (id: string) => users.find(u => u._id === id);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight font-headline">Projects</h2>
                    <p className="text-muted-foreground">
                        Your central hub for all ongoing and completed projects.
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="-ml-1 mr-2 h-4 w-4" />
                            New Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <form action={async (formData) => {
                            const newProject = await createProject(formData);
                            setOpen(false);
                            router.push(`/dashboard/projects/${newProject._id}`);
                        }}>
                            <DialogHeader>
                                <DialogTitle>Create New Project</DialogTitle>
                                <DialogDescription>
                                    Give your project a name and description to get started.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Name</Label>
                                    <Input id="name" name="name" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="description" className="text-right">Description</Label>
                                    <Textarea id="description" name="description" className="col-span-3" required />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create Project</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            
            {initialProjects.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {initialProjects.map((project) => (
                        <Card key={project._id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-headline flex items-center gap-2">
                                  <FolderKanban className="h-5 w-5 text-primary"/> 
                                  {project.name}
                                </CardTitle>
                                <CardDescription>{project.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>{project.collaborators.length + 1} Members</span>
                                </div>
                                <div className="flex -space-x-2 overflow-hidden mt-4">
                                    { [project.ownerId, ...project.collaborators.map((c: any) => c.userId)].slice(0, 5).map((userId: string) => {
                                        const user = getUserById(userId);
                                        return user ? (
                                            <Avatar key={user._id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                                                <AvatarImage src={user.avatarUrl} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        ) : null;
                                    })}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full" variant="outline">
                                    <Link href={`/dashboard/projects/${project._id}`}>View Project</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-medium text-muted-foreground">No projects yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">Get started by creating a new project.</p>
                </div>
            )}
        </div>
    );
}
