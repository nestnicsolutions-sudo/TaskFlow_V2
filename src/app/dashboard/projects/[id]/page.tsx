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
    const tasks = await getTasksByProjectId(params.id);
    const users = await getUsers();

    // Ensure the current user is part of the project, otherwise deny access
    const isCollaborator = project.collaborators.some(c => c.userId === session.user.id);
    const isOwner = project.ownerId === session.user.id;
    if (!isOwner && !isCollaborator) {
        // Or redirect to a generic "access denied" page
        notFound();
    }
    
    const currentUser: User = {
        ...session.user,
        id: session.user.id.toString(),
        _id: session.user.id, // Keep original ObjectId if needed, though 'id' is primary now
    };

    return (
        <ProjectView 
            initialProject={project as Project}
            initialTasks={tasks as Task[]}
            users={users}
            currentUser={currentUser}
        />
    );
}
