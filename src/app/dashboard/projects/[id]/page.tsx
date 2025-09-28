import { getProjectById, getTasksByProjectId, getUsers } from "@/app/actions";
import ProjectView from "@/components/project/project-view";
import { notFound, redirect } from "next/navigation";
import type { Project, Task, User } from "@/lib/data";

type ProjectPageProps = {
    params: {
        id: string;
    };
};

export default async function ProjectPage({ params }: ProjectPageProps) {
    const projectData = await getProjectById(params.id);
    
    if (!projectData) {
        notFound();
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
    
    // Since session is removed, we'll default to the project owner as the current user.
    const currentUser = users.find(u => u.id === project.ownerId);

    if (!currentUser) {
        // This might happen if the owner isn't in the users list for some reason.
        // As a fallback, we can take the first user or handle it gracefully.
        if (users.length > 0) {
            const fallbackUser = users[0];
             return (
                <ProjectView 
                    initialProject={project}
                    initialTasks={tasks}
                    users={users}
                    currentUser={fallbackUser}
                />
            );
        }
        // If no users exist at all, we can't render the view properly.
        return <p className="p-8 text-center text-muted-foreground">Error: No users found in the system.</p>;
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
