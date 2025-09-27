"use server"

import { revalidatePath } from "next/cache";
import { suggestSubtasks as suggestSubtasksFlow } from "@/ai/ai-suggest-subtasks";
import { Project, Task, TaskStatus, User } from "@/lib/data";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getDb() {
    const { db } = await connectToDatabase();
    return db;
}

export async function getProjects(): Promise<Project[]> {
    const session = await getSession();
    if (!session) {
        return [];
    }
    const db = await getDb();
    const projects = await db.collection('projects').find({
        $or: [
            { ownerId: new ObjectId(session.user.id) },
            { 'collaborators.userId': new ObjectId(session.user.id) }
        ]
    }).toArray();

    return projects.map(p => ({
        ...p,
        id: p._id.toString(),
        ownerId: p.ownerId.toString(),
        collaborators: p.collaborators.map((c: any) => ({
            ...c,
            userId: c.userId.toString(),
        })),
    })) as Project[];
}

export async function getProjectById(id: string): Promise<Project | null> {
    if (!ObjectId.isValid(id)) {
        return null;
    }
    const db = await getDb();
    const projectDoc = await db.collection('projects').findOne({ _id: new ObjectId(id) });
    if (!projectDoc) {
        return null;
    }
    
    const project: Project = {
        id: projectDoc._id.toString(),
        name: projectDoc.name,
        description: projectDoc.description,
        ownerId: projectDoc.ownerId.toString(),
        collaborators: projectDoc.collaborators.map((c: any) => ({
            userId: c.userId.toString(),
            role: c.role,
        })),
        createdAt: projectDoc.createdAt,
    };

    return project;
}

export async function getTasksByProjectId(projectId: string): Promise<Task[]> {
    if (!ObjectId.isValid(projectId)) {
        return [];
    }
    const db = await getDb();
    const tasks = await db.collection('tasks').find({ projectId: new ObjectId(projectId) }).toArray();
    return tasks.map(t => ({
        ...t,
        id: t._id.toString(),
        _id: t._id,
        projectId: t.projectId.toString(),
        assigneeId: t.assigneeId?.toString(),
    })) as Task[];
}

export async function getUsers(): Promise<User[]> {
    const db = await getDb();
    // Exclude password field from being sent to client
    const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
    return users.map(u => ({
        ...u,
        id: u._id.toString(),
        _id: u._id,
    })) as User[];
}

export async function createProject(formData: FormData) {
    const ownerId = formData.get("userId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    
    if (!name || !description) {
        throw new Error("Project name and description are required.");
    }
    
    if (!ownerId || !ObjectId.isValid(ownerId)) {
        throw new Error("Authentication required: No or invalid owner ID provided.");
    }

    const { db } = await connectToDatabase();
    const result = await db.collection("projects").insertOne({
      name,
      description,
      ownerId: new ObjectId(ownerId),
      collaborators: [],
      createdAt: new Date(),
    });

    const newProject = await db
      .collection("projects")
      .findOne({ _id: result.insertedId });
    
    revalidatePath("/dashboard");
    if (newProject) {
        redirect(`/dashboard/projects/${newProject._id.toString()}`);
    }
}

export async function createTask(formData: FormData) {
    const projectId = formData.get('projectId') as string;
    const title = formData.get('title') as string;
    const assigneeId = formData.get('assigneeId') as string;
    const dueDate = formData.get('dueDate') as string;

    if (!ObjectId.isValid(projectId) || (assigneeId && !ObjectId.isValid(assigneeId))) {
        throw new Error("Invalid project or assignee ID");
    }

    const db = await getDb();
    const result = await db.collection('tasks').insertOne({
        projectId: new ObjectId(projectId),
        title,
        status: 'To Do',
        assigneeId: assigneeId ? new ObjectId(assigneeId) : undefined,
        dueDate: new Date(dueDate),
        createdAt: new Date(),
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    const newTaskDoc = await db.collection('tasks').findOne({ _id: result.insertedId });

    if (!newTaskDoc) return null;
    
    // Return a plain object, converting ObjectIds to strings
    const newTask = {
        ...newTaskDoc,
        id: newTaskDoc._id.toString(),
        projectId: newTaskDoc.projectId.toString(),
        assigneeId: newTaskDoc.assigneeId?.toString()
    };
    
    return newTask;
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus, projectId: string) {
    if (!ObjectId.isValid(taskId) || !ObjectId.isValid(projectId)) {
        return null;
    }
    const db = await getDb();
    const result = await db.collection('tasks').updateOne(
        { _id: new ObjectId(taskId) },
        { $set: { status: newStatus } }
    );
    
    if (result.modifiedCount > 0) {
        revalidatePath(`/dashboard/projects/${projectId}`);
        const updatedTaskDoc = await db.collection('tasks').findOne({ _id: new ObjectId(taskId) });

        if (!updatedTaskDoc) return null;

        const updatedTask = {
            ...updatedTaskDoc,
            id: updatedTaskDoc._id.toString(),
            projectId: updatedTaskDoc.projectId.toString(),
            assigneeId: updatedTaskDoc.assigneeId?.toString(),
        };
        return updatedTask;
    }
    return null;
}

export async function inviteCollaborator(projectId: string, userId: string, role: 'editor' | 'viewer') {
    if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userId)) {
        return { success: false, message: "Invalid project or user ID." };
    }
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
        const result = await suggestSubtasksFlow({ projectDescription, existingTasks: taskTitles });
        return { success: true, suggestions: result.subtasks };
    } catch (error) {
        console.error("Error calling AI flow:", error);
        return { success: false, message: "Failed to get AI suggestions." };
    }
}
