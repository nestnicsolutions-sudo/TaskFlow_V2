import type { Project, Task, User, Role } from "@/lib/data";
import type { Dispatch } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus } from "lucide-react";
import InviteCollaboratorDialog from "./invite-collaborator-dialog";
import AddTaskDialog from "./kanban/add-task-dialog";

type ProjectHeaderProps = {
    project: Project;
    users: User[];
    currentUser: User;
    tasks: Task[];
    dispatch: Dispatch<any>;
    userRole: Role;
};

export default function ProjectHeader({ project, users, currentUser, tasks, dispatch, userRole }: ProjectHeaderProps) {
    const collaborators = [project.ownerId, ...project.collaborators.map(c => c.userId)];
    const canManage = userRole === 'admin' || userRole === 'editor';

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">{project.name}</h1>
                    <p className="mt-2 text-muted-foreground">{project.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {canManage && (
                        <AddTaskDialog project={project} users={users} dispatch={dispatch}><Button><Plus className="mr-2 h-4 w-4" />Add Task</Button></AddTaskDialog>
                    )}
                    <InviteCollaboratorDialog project={project} users={users} disabled={userRole !== 'admin'}><Button variant="outline"><UserPlus className="mr-2 h-4 w-4"/>Invite</Button></InviteCollaboratorDialog>
                </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
                <div className="flex -space-x-2 overflow-hidden">
                    {collaborators.map(userId => {
                        const user = users.find(u => u.id === userId);
                        return user ? (
                            <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        ) : null;
                    })}
                </div>
                <span className="text-sm text-muted-foreground">{collaborators.length} members</span>
            </div>
        </div>
    );
}