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

    const projectData = await getProjectById(params.id);
    if (!projectData) {
        notFound();
    }
    const tasksData = await getTasksByProjectId(params.id);
    const usersData = await getUsers();

    // Ensure the current user is part of the project, otherwise deny access
    const isCollaborator = projectData.collaborators.some(c => c.userId.toString() === session.user.id);
    const isOwner = projectData.ownerId.toString() === session.user.id;
    if (!isOwner && !isCollaborator) {
        notFound();
    }

    // Convert all data to plain objects for client components
    const project: Project = {
        id: projectData.id.toString(),
        _id: projectData._id.toString(),
        name: projectData.name,
        description: projectData.description,
        ownerId: projectData.ownerId.toString(),
        collaborators: projectData.collaborators.map((c: any) => ({
            userId: c.userId.toString(),
            role: c.role,
        })),
    };

    const tasks: Task[] = tasksData.map(t => ({
        ...t,
        id: t.id.toString(),
        _id: t._id.toString(),
        projectId: t.projectId.toString(),
        assigneeId: t.assigneeId?.toString(),
        dueDate: t.dueDate,
    }));

    const users: User[] = usersData.map(u => ({
        id: u.id.toString(),
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl
    }));
    
    const currentUser: User = {
        ...session.user,
        id: session.user.id.toString(),
        _id: session.user.id.toString(),
    };

    return (
        <ProjectView 
            initialProject={project}
            initialTasks={tasks}
            users={users}
            currentUser={currentUser}
        />
    );
}
