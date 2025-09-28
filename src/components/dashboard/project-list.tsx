"use client";

import type { User } from "@/lib/data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, FolderKanban } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProjectList({ initialProjects, users }: { initialProjects: any[], users: User[] }) {
    const getUserById = (id: string) => users.find(u => u.id === id);

    return (
        <div className="space-y-8 mt-8">
            {initialProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {initialProjects.map((project) => (
                        <Card key={project.id} className="flex flex-col">
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
                                            <Avatar key={user.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                                                <AvatarImage src={user.avatarUrl} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        ) : null;
                                    })}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full" variant="outline">
                                    <Link href={`/dashboard/projects/${project.id}`}>View Project</Link>
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
