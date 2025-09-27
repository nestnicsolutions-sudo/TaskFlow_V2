import { getProjectById, getTasksByProjectId, getUsers } from "@/app/actions";
import ProjectView from "@/components/project/project-view";
import { notFound } from "next/navigation";

type ProjectPageProps = {
    params: {
        id: string;
    };
};

export default async function ProjectPage({ params }: ProjectPageProps) {
    const project = await getProjectById(params.id);
    if (!project) {
        notFound();
    }
    const tasks = await getTasksByProjectId(params.id);
    const users = await getUsers();

    // In a real app, you would get the current logged-in user
    const currentUser = users[0]; 

    return (
        <ProjectView 
            initialProject={project}
            initialTasks={tasks}
            users={users}
            currentUser={currentUser}
        />
    );
}
