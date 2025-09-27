"use server"

import { revalidatePath } from "next/cache";
import { suggestTasks as suggestTasksFlow } from "@/ai/flows/suggest-tasks";
import { Project, Task, TaskStatus, User } from "@/lib/data";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth";

async function getDb() {
    const { db } = await connectToDatabase();
    return db;
}

export async function getProjects() {
    const session = await getSession();
    if (!session) {
        return [];
    }
    const db = await getDb();
    return db.collection('projects').find({
        $or: [
            { ownerId: new ObjectId(session.user.id) },
            { 'collaborators.userId': new ObjectId(session.user.id) }
        ]
    }).toArray();
}

export async function getProjectById(id: string) {
    const db = await getDb();
    return db.collection('projects').findOne({ _id: new ObjectId(id) });
}

export async function getTasksByProjectId(projectId: string) {
    const db = await getDb();
    return db.collection('tasks').find({ projectId: new ObjectId(projectId) }).toArray();
}

export async function getUsers() {
    const db = await getDb();
    // Exclude password field from being sent to client
    return db.collection('users').find({}, { projection: { password: 0 } }).toArray();
}

export async function createProject(formData: FormData) {
    const session = await getSession();
    if (!session) {
        throw new Error("Authentication required");
    }
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    
    const db = await getDb();
    const result = await db.collection('projects').insertOne({
        name,
        description,
        ownerId: new ObjectId(session.user.id),
        collaborators: [],
        createdAt: new Date(),
    });
    
    const newProject = await db.collection('projects').findOne({ _id: result.insertedId });
    return JSON.parse(JSON.stringify(newProject));
}

export async function createTask(formData: FormData) {
    const projectId = formData.get('projectId') as string;
    const title = formData.get('title') as string;
    const assigneeId = formData.get('assigneeId') as string;
    const dueDate = formData.get('dueDate') as string;

    const db = await getDb();
    const result = await db.collection('tasks').insertOne({
        projectId: new ObjectId(projectId),
        title,
        status: 'To Do',
        assigneeId: new ObjectId(assigneeId),
        dueDate: new Date(dueDate),
        createdAt: new Date(),
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    const newTask = await db.collection('tasks').findOne({ _id: result.insertedId });
    return JSON.parse(JSON.stringify(newTask));
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus, projectId: string) {
    const db = await getDb();
    const result = await db.collection('tasks').updateOne(
        { _id: new ObjectId(taskId) },
        { $set: { status: newStatus } }
    );
    
    if (result.modifiedCount > 0) {
        revalidatePath(`/dashboard/projects/${projectId}`);
        const updatedTask = await db.collection('tasks').findOne({ _id: new ObjectId(taskId) });
        return JSON.parse(JSON.stringify(updatedTask));
    }
    return null;
}

export async function inviteCollaborator(projectId: string, userId: string, role: 'editor' | 'viewer') {
    const db = await getDb();
    const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });

    if (project && !project.collaborators.some((c: any) => c.userId.toString() === userId)) {
        await db.collection('projects').updateOne(
            { _id: new ObjectId(projectId) },
            { $push: { collaborators: { userId: new ObjectId(userId), role } } }
        );
        revalidatePath(`/dashboard/projects/${projectId}`);
        return { success: true };
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
