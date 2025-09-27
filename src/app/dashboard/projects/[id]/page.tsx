import { getProjectById, getTasksByProjectId, getUsers } from "@/app/actions";
import ProjectView from "@/components/project/project-view";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Project, Task, User } from "@/lib/data";

type ProjectPageProps = {
    params: {
        id: string;
    };
};

export default async function ProjectPage({ params }: ProjectPageProps) {
    const session = await getSession();
    // The session check is crucial for security.
    if (!session?.user) {
        notFound();
    }

    const projectData = await getProjectById(params.id);
    if (!projectData) {
        notFound();
    }
    const tasksData = await getTasksByProjectId(params.id);
    const usersData = await getUsers();

    // Convert ObjectIds to strings for client-side consumption
    const project: Project = {
        ...projectData,
        id: projectData._id.toString(),
        ownerId: projectData.ownerId.toString(),
        collaborators: projectData.collaborators.map((c: any) => ({ ...c, userId: c.userId.toString() }))
    };

    const tasks: Task[] = tasksData.map(t => ({
        ...t,
        id: t._id.toString(),
        _id: t._id,
        projectId: t.projectId,
        assigneeId: t.assigneeId
    }));
    
    const users: User[] = usersData.map(u => ({
        ...u,
        id: u._id.toString(),
        _id: u._id
    }));
    
    // Ensure currentUser object has a string `id` for client-side checks
    const currentUser: User = {
        ...session.user,
        id: session.user.id.toString(),
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
