import { getProjectById, getTasksByProjectId, getUsers } from "@/app/actions";
import ProjectView from "@/components/project/project-view";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";

type ProjectPageProps = {
    params: {
        id: string;
    };
};

export default async function ProjectPage({ params }: ProjectPageProps) {
    const session = await getSession();
    if (!session) {
        notFound();
    }

    const projectData = await getProjectById(params.id);
    if (!projectData) {
        notFound();
    }
    const tasksData = await getTasksByProjectId(params.id);
    const usersData = await getUsers();

    // Convert ObjectIds to strings
    const project = {
        ...projectData,
        _id: projectData._id.toString(),
        ownerId: projectData.ownerId.toString(),
        collaborators: projectData.collaborators.map((c: any) => ({ ...c, userId: c.userId.toString() }))
    };

    const tasks = tasksData.map(t => ({
        ...t,
        _id: t._id.toString(),
        projectId: t.projectId.toString(),
        assigneeId: t.assigneeId?.toString()
    }));

    const users = usersData.map(u => ({
        ...u,
        _id: u._id.toString(),
    }));
    
    const currentUser = {
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
