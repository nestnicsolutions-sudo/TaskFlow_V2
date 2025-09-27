"use server"

import { revalidatePath } from "next/cache";
import { suggestTasks as suggestTasksFlow } from "@/ai/flows/suggest-tasks";
import { Project, Task, TaskStatus, User } from "@/lib/data";

// This is a mock database. In a real app, you would use a proper database.
let projects: Project[] = [
    { id: 'prj-001', name: 'Website Redesign', description: 'Complete overhaul of the company website.', ownerId: 'user-1', collaborators: [{ userId: 'user-2', role: 'editor' }] },
    { id: 'prj-002', name: 'Q3 Marketing Campaign', description: 'Launch the new marketing campaign for the third quarter.', ownerId: 'user-1', collaborators: [] },
    { id: 'prj-003', name: 'Mobile App Development', description: 'Develop a new mobile app for iOS and Android.', ownerId: 'user-2', collaborators: [{ userId: 'user-1', role: 'viewer' }] },
];

let tasks: Task[] = [
    { id: 'task-001', projectId: 'prj-001', title: 'Design new homepage mockups', status: 'In Progress', assigneeId: 'user-2', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    { id: 'task-002', projectId: 'prj-001', title: 'Develop front-end components', status: 'To Do', assigneeId: 'user-2', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { id: 'task-003', projectId: 'prj-001', title: 'Setup staging server', status: 'Pending', assigneeId: 'user-1', dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
    { id: 'task-004', projectId: 'prj-001', title: 'Review and approve designs', status: 'Completed', assigneeId: 'user-1', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { id: 'task-005', projectId: 'prj-002', title: 'Finalize campaign budget', status: 'Completed', assigneeId: 'user-1', dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { id: 'task-006', projectId: 'prj-002', title: 'Create social media assets', status: 'In Progress', assigneeId: 'user-1', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
];

let users: User[] = [
    { id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com', avatarUrl: 'https://picsum.photos/seed/101/100/100' },
    { id: 'user-2', name: 'Maria Garcia', email: 'maria@example.com', avatarUrl: 'https://picsum.photos/seed/102/100/100' },
    { id: 'user-3', name: 'David Smith', email: 'david@example.com', avatarUrl: 'https://picsum.photos/seed/103/100/100' },
];

export async function getProjects() {
    return projects;
}

export async function getProjectById(id: string) {
    return projects.find(p => p.id === id) || null;
}

export async function getTasksByProjectId(projectId: string) {
    return tasks.filter(t => t.projectId === projectId);
}

export async function getUsers() {
    return users;
}

export async function createProject(formData: FormData) {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const newProject: Project = {
        id: `prj-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        ownerId: 'user-1', // Mock current user
        collaborators: [],
    };
    projects.push(newProject);
    revalidatePath('/dashboard');
    return newProject;
}

export async function createTask(formData: FormData) {
    const projectId = formData.get('projectId') as string;
    const title = formData.get('title') as string;
    const assigneeId = formData.get('assigneeId') as string;
    const dueDate = formData.get('dueDate') as string;

    const newTask: Task = {
        id: `task-${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        title,
        status: 'To Do',
        assigneeId,
        dueDate: new Date(dueDate),
    };
    tasks.push(newTask);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return newTask;
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus, projectId: string) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].status = newStatus;
        revalidatePath(`/dashboard/projects/${projectId}`);
        return tasks[taskIndex];
    }
    return null;
}

export async function inviteCollaborator(projectId: string, userId: string, role: 'editor' | 'viewer') {
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
        const project = projects[projectIndex];
        if (!project.collaborators.some(c => c.userId === userId)) {
            project.collaborators.push({ userId, role });
            revalidatePath(`/dashboard/projects/${projectId}`);
            return { success: true };
        }
    }
    return { success: false, message: "User is already a collaborator." };
}

export async function suggestTasks(projectDescription: string, existingTasks: Task[]) {
    try {
        const taskTitles = existingTasks.map(t => t.title);
        const suggestions = await suggestTasksFlow({ projectDescription, existingTasks: taskTitles });
        return { success: true, suggestions };
    } catch (error) {
        console.error("Error calling AI flow:", error);
        return { success: false, message: "Failed to get AI suggestions." };
    }
}
