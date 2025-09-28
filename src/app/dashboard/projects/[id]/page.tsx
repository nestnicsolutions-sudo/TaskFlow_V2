import { getProjectById, getTasksByProjectId, getUsers } from "@/app/actions";
import ProjectView from "@/components/project/project-view";
import { notFound, redirect } from "next/navigation";
import type { Project, Task, User } from "@/lib/data";
import { getSession } from "@/lib/auth";

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
    const currentUser = session.user as User;

    const projectData = await getProjectById(params.id);
    
    if (!projectData) {
        notFound();
    }

    const isParticipant = projectData.ownerId === currentUser.id || projectData.collaborators.some(c => c.userId === currentUser.id);
    if (!isParticipant) {
         return <p className="p-8 text-center text-muted-foreground">You do not have access to this project.</p>;
    }
    
    const tasksData = await getTasksByProjectId(params.id);
    const usersData = await getUsers();

    // Serialize data before passing to client component
    const project: Project = {
        ...projectData,
        id: projectData.id.toString(),
        ownerId: projectData.ownerId.toString(),
        collaborators: projectData.collaborators.map(c => ({
            userId: c.userId.toString(),
            role: c.role,
        })),
        joinRequests: projectData.joinRequests || [],
    };

    const tasks: Task[] = tasksData.map(t => ({
        ...t,
        id: t.id.toString(),
        projectId: t.projectId.toString(),
        assigneeId: t.assigneeId?.toString(),
    }));

    const users: User[] = usersData.map(u => ({
        ...u,
        id: u.id.toString(),
    }));

    return (
        <ProjectView 
            initialProject={project}
            initialTasks={tasks}
            users={users}
            currentUser={currentUser}
        />
    );
}
