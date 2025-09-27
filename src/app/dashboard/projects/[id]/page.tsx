import { getProjectById, getTasksByProjectId, getUsers } from "@/app/actions";
import ProjectView from "@/components/project/project-view";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Project, Task, User } from "@/lib/data";

type ProjectPageProps = {
    params: {
        id: string;
    };
};

export default async function ProjectPage({ params }: ProjectPageProps) {
    const session = await getSession();
    if (!session?.user) {
        redirect('/login');
    }

    const project = await getProjectById(params.id);
    
    if (!project) {
        notFound();
    }
    
    // Authorization check
    const isOwner = project.ownerId === session.user.id;
    const isCollaborator = project.collaborators.some(c => c.userId === session.user.id);
    if (!isOwner && !isCollaborator) {
        // Instead of notFound, redirect or show an unauthorized message
        // For simplicity, we'll redirect to dashboard, but an "access denied" page would be better.
        redirect('/dashboard');
    }

    const tasks = await getTasksByProjectId(params.id);
    const users = await getUsers();
    
    const currentUser = users.find(u => u.id === session.user.id);

    if (!currentUser) {
        // This should not happen if the user has a session
        redirect('/login');
    }

    return (
        <ProjectView 
            initialProject={project}
            initialTasks={tasks}
            users={users}
            currentUser={currentUser}
        />
    );
}
