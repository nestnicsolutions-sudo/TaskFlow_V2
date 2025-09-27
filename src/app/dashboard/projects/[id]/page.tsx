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
    
    // Authorization check
    const isOwner = projectData.ownerId.toString() === session.user.id;
    const isCollaborator = projectData.collaborators.some(c => c.userId.toString() === session.user.id);
    if (!isOwner && !isCollaborator) {
        redirect('/dashboard');
        return; // This is the critical fix
    }

    const tasksData = await getTasksByProjectId(params.id);
    const usersData = await getUsers();

    // Serialize data before passing to client component
    const project: Project = {
        id: projectData.id.toString(),
        name: projectData.name,
        description: projectData.description,
        ownerId: projectData.ownerId.toString(),
        collaborators: projectData.collaborators.map(c => ({
            userId: c.userId.toString(),
            role: c.role,
        })),
        createdAt: projectData.createdAt,
    };

    const tasks: Task[] = tasksData.map(t => ({
        id: t.id.toString(),
        projectId: t.projectId.toString(),
        title: t.title,
        status: t.status,
        assigneeId: t.assigneeId?.toString(),
        dueDate: t.dueDate,
        createdAt: t.createdAt,
    }));

    const users: User[] = usersData.map(u => ({
        id: u.id.toString(),
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
    }));
    
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
