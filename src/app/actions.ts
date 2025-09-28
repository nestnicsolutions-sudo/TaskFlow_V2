
"use server"

import 'dotenv/config';
import { revalidatePath } from "next/cache";
import { suggestSubtasks as suggestSubtasksFlow } from "@/ai/ai-suggest-subtasks";
import { Project, Task, TaskStatus, User, Role } from "@/lib/data";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getSession } from '@/lib/auth';

async function getDb() {
    const { db } = await connectToDatabase();
    return db;
}

export async function getProjects(userId: string): Promise<Project[]> {
    if (!ObjectId.isValid(userId)) return [];

    const db = await getDb();
    const userObjectId = new ObjectId(userId);

    const projects = await db.collection('projects').find({
        $or: [
            { ownerId: userObjectId },
            { 'collaborators.userId': userObjectId }
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
        joinRequests: p.joinRequests?.map((r: any) => r.toString()) || [],
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
        _id: projectDoc._id,
        name: projectDoc.name,
        description: projectDoc.description,
        ownerId: projectDoc.ownerId.toString(),
        collaborators: projectDoc.collaborators.map((c: any) => ({
            userId: c.userId.toString(),
            role: c.role,
        })),
        joinRequests: projectDoc.joinRequests?.map((r: any) => r.toString()) || [],
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
        id: t._id.toString(),
        _id: t._id,
        projectId: t.projectId.toString(),
        assigneeId: t.assigneeId?.toString(),
        dueDate: t.dueDate,
        createdAt: t.createdAt,
        title: t.title,
        status: t.status,
    })) as Task[];
}

export async function getUsers(): Promise<User[]> {
    const db = await getDb();
    // Exclude password field from being sent to client
    const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
    return users.map(u => ({
        id: u._id.toString(),
        _id: u._id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
    })) as User[];
}

export async function createProject(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session?.user) {
      throw new Error("Authentication required.");
    }
    
    const ownerId = session.user.id;
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
      joinRequests: [],
      createdAt: new Date(),
    });

    const newProject = await db
      .collection("projects")
      .findOne({ _id: result.insertedId });
    
    revalidatePath("/dashboard");
    if (newProject) {
        revalidatePath(`/dashboard/projects/${newProject._id.toString()}`);
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
    const newTask: Task = {
        id: newTaskDoc._id.toString(),
        _id: newTaskDoc._id,
        projectId: newTaskDoc.projectId.toString(),
        title: newTaskDoc.title,
        status: newTaskDoc.status,
        assigneeId: newTaskDoc.assigneeId?.toString(),
        dueDate: newTaskDoc.dueDate,
        createdAt: newTaskDoc.createdAt,
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

        const updatedTask: Task = {
            id: updatedTaskDoc._id.toString(),
            _id: updatedTaskDoc._id,
            projectId: updatedTaskDoc.projectId.toString(),
            title: updatedTaskDoc.title,
            status: updatedTaskDoc.status,
            assigneeId: updatedTaskDoc.assigneeId?.toString(),
            dueDate: updatedTaskDoc.dueDate,
            createdAt: updatedTaskDoc.createdAt,
        };
        return updatedTask;
    }
    return null;
}

export async function deleteTask(taskId: string, projectId: string) {
    if (!ObjectId.isValid(taskId) || !ObjectId.isValid(projectId)) {
        return { success: false, message: "Invalid ID" };
    }
    const db = await getDb();
    const result = await db.collection('tasks').deleteOne({ _id: new ObjectId(taskId) });

    if (result.deletedCount > 0) {
        revalidatePath(`/dashboard/projects/${projectId}`);
        return { success: true };
    }
    return { success: false, message: "Failed to delete task." };
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

export async function requestToJoinProject(projectId: string) {
    const session = await getSession();
    if (!session?.user?.id || !ObjectId.isValid(session.user.id)) {
      return { success: false, message: 'Authentication required.' };
    }
    const requestingUserId = session.user.id;

    if (!projectId || !ObjectId.isValid(projectId)) {
      return { success: false, message: 'Invalid Project ID format.' };
    }
  
    const db = await getDb();
    const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
  
    if (!project) {
      return { success: false, message: 'Project not found.' };
    }
  
    const userId = new ObjectId(requestingUserId);
  
    if (project.ownerId.equals(userId)) {
        return { success: false, message: 'You are the owner of this project.' };
    }
    if (project.collaborators.some((c: any) => c.userId.equals(userId))) {
        return { success: false, message: 'You are already a collaborator on this project.' };
    }
    if (project.joinRequests?.some((id: ObjectId) => id.equals(userId))) {
        return { success: false, message: 'You have already requested to join this project.' };
    }
  
    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { $addToSet: { joinRequests: userId } }
    );
  
    if (result.modifiedCount > 0) {
      revalidatePath('/dashboard');
      revalidatePath(`/dashboard/projects/${projectId}`);
      return { success: true };
    }
  
    return { success: false, message: 'Failed to send join request.' };
}

export async function approveJoinRequest(projectId: string, userId: string, role: Role) {
    const session = await getSession();
    if (!session?.user) {
        return { success: false, message: 'Authentication required.' };
    }

    if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userId)) {
      return { success: false, message: 'Invalid ID.' };
    }
  
    const db = await getDb();
    const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
    if (project?.ownerId.toString() !== session.user.id) {
        return { success: false, message: 'Only the project owner can approve requests.' };
    }
  
    // Move user from joinRequests to collaborators
    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      {
        $pull: { joinRequests: new ObjectId(userId) },
        $addToSet: { collaborators: { userId: new ObjectId(userId), role } },
      }
    );
  
    if (result.modifiedCount > 0) {
      revalidatePath(`/dashboard/projects/${projectId}`);
      revalidatePath('/dashboard');
      return { success: true };
    }
  
    return { success: false, message: 'Failed to approve join request.' };
}
  
export async function denyJoinRequest(projectId: string, userId: string) {
    const session = await getSession();
    if (!session?.user) {
        return { success: false, message: 'Authentication required.' };
    }

    if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userId)) {
        return { success: false, message: 'Invalid ID.' };
    }

    const db = await getDb();
    const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
    if (project?.ownerId.toString() !== session.user.id) {
        return { success: false, message: 'Only the project owner can deny requests.' };
    }

    const result = await db.collection('projects').updateOne(
        { _id: new ObjectId(projectId) },
        { $pull: { joinRequests: new ObjectId(userId) } }
    );

    if (result.modifiedCount > 0) {
        revalidatePath(`/dashboard/projects/${projectId}`);
        revalidatePath('/dashboard');
        return { success: true };
    }

    return { success: false, message: 'Failed to deny join request.' };
}

  
