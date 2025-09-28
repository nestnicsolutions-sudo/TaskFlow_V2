import { getProjectById, getTasksByProjectId, getUsers, getMessages } from "@/app/actions";
import ProjectView from "@/components/project/project-view";
import { notFound, redirect } from "next/navigation";
import type { Project, Task, User, Message } from "@/lib/data";
import { getSession } from "@/lib/auth";

type ProjectPageProps = {
    params: {
        id: string;
    };
};

export default async function ProjectPage({ params: { id } }: ProjectPageProps) {
    const session = await getSession();
    if (!session?.user) {
        redirect('/login');
    }
    const currentUser = session.user as User;

    const projectData = await getProjectById(id);
    
    if (!projectData) {
        notFound();
    }

    const isParticipant = projectData.ownerId === currentUser.id || projectData.collaborators.some(c => c.userId === currentUser.id);
    if (!isParticipant) {
         return <p className="p-8 text-center text-muted-foreground">You do not have access to this project.</p>;
    }
    
    const tasksData = await getTasksByProjectId(id);
    const usersData = await getUsers();
    const messagesData = await getMessages(id);

    const project: Project = {
        id: projectData.id.toString(),
        name: projectData.name,
        description: projectData.description,
        ownerId: projectData.ownerId.toString(),
        collaborators: projectData.collaborators.map(c => ({
            userId: c.userId.toString(),
            role: c.role,
        })),
        joinRequests: projectData.joinRequests?.map(r => r.toString()) || [],
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

    const messages: Message[] = messagesData.map(m => ({
        id: m.id.toString(),
        projectId: m.projectId.toString(),
        userId: m.userId.toString(),
        text: m.text,
        createdAt: m.createdAt,
    }));

    return (
        <ProjectView 
            initialProject={project}
            initialTasks={tasks}
            initialMessages={messages}
            users={users}
            currentUser={currentUser}
        />
    );
}
