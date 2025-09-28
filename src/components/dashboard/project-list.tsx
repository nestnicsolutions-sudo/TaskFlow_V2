"use client";

import { useReducer } from "react";
import type { User, Project } from "@/lib/data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, FolderKanban, Trash2, Archive, ArchiveRestore, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "../ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteProject, toggleProjectArchiveStatus, leaveProject } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

type Action =
    | { type: 'DELETE_PROJECT'; payload: { projectId: string } }
    | { type: 'TOGGLE_ARCHIVE'; payload: { projectId: string } }
    | { type: 'LEAVE_PROJECT'; payload: { projectId: string } };


function projectsReducer(state: Project[], action: Action): Project[] {
    switch (action.type) {
        case 'DELETE_PROJECT':
        case 'TOGGLE_ARCHIVE':
        case 'LEAVE_PROJECT':
             return state.filter(p => p.id !== action.payload.projectId);
        default:
            return state;
    }
}


export default function ProjectList({ initialProjects, users, currentUserId }: { initialProjects: Project[], users: User[], currentUserId: string }) {
    const [projects, dispatch] = useReducer(projectsReducer, initialProjects);
    const getUserById = (id: string) => users.find(u => u.id === id);
    const { toast } = useToast();

    const handleDelete = async (projectId: string) => {
        dispatch({ type: 'DELETE_PROJECT', payload: { projectId } });
        const result = await deleteProject(projectId);
        if (result.success) {
            toast({ title: "Project Deleted", description: "The project and all its tasks have been permanently deleted." });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
            // Re-fetch or revert state would be needed in a real-world complex app
        }
    };
    
    const handleArchiveToggle = async (project: Project) => {
        dispatch({ type: 'TOGGLE_ARCHIVE', payload: { projectId: project.id } });
        const result = await toggleProjectArchiveStatus(project.id, !project.isArchived);
        if (result.success) {
            toast({ title: `Project ${!project.isArchived ? 'Archived' : 'Unarchived'}` });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
             // Re-fetch or revert state would be needed in a real-world complex app
        }
    };

    const handleLeave = async (projectId: string) => {
        dispatch({ type: 'LEAVE_PROJECT', payload: { projectId } });
        const result = await leaveProject(projectId);
        if (result.success) {
            toast({ title: "You Left the Project", description: "You have been removed as a collaborator." });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    };

    return (
        <div className="space-y-8 mt-8">
            {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Card key={project.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="font-headline flex items-center gap-2">
                                    <FolderKanban className="h-5 w-5 text-primary"/> 
                                    {project.name}
                                    </CardTitle>
                                    {project.ownerId === currentUserId ? <Badge>Owner</Badge> : <Badge variant="secondary">Member</Badge>}
                                </div>
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
                            <CardFooter className="flex items-center gap-2">
                                <Button asChild className="w-full">
                                    <Link href={`/dashboard/projects/${project.id}`}>View Project</Link>
                                </Button>
                                {project.ownerId === currentUserId ? (
                                     <>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="icon" title={project.isArchived ? 'Unarchive' : 'Archive'}>
                                                    {project.isArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {project.isArchived ? 'This will make the project active again.' : 'Archiving a project will hide it from the main list. You can find it in the archived tab.'}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleArchiveToggle(project)}>
                                                        Continue
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="icon" title="Delete">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete this project and all its data.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(project.id)}>
                                                        Delete Permanently
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </>
                                ) : (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="destructive" size="icon" title="Leave Project">
                                                <LogOut className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure you want to leave this project?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    You will lose access to this project and its tasks unless you are invited back.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleLeave(project.id)}>
                                                    Leave Project
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-medium text-muted-foreground">No projects here</h3>
                    <p className="text-sm text-muted-foreground mt-1">Get started by creating a new project or join one.</p>
                </div>
            )}
        </div>
    );
}
