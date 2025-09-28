
"use server"

import 'dotenv/config';
import { revalidatePath } from "next/cache";
import { suggestSubtasks as suggestSubtasksFlow } from "@/ai/ai-suggest-subtasks";
import { Project, Task, TaskStatus, User, Role, Message, Collaborator, Notification } from "@/lib/data";
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

    const projects = await db.collection<Project>('projects').find({
        $or: [
            { ownerId: userObjectId },
            { 'collaborators.userId': userObjectId }
        ]
    }).toArray();

    return projects.map(p => ({
        id: p._id!.toString(),
        name: p.name,
        description: p.description,
        ownerId: p.ownerId.toString(),
        collaborators: p.collaborators.map((c: any) => ({
            userId: c.userId.toString(),
            role: c.role,
        })),
        joinRequests: p.joinRequests?.map((r: any) => r.toString()) || [],
        createdAt: p.createdAt,
        isArchived: p.isArchived,
    }));
}

export async function getProjectById(id: string): Promise<Project | null> {
    if (!ObjectId.isValid(id)) {
        return null;
    }
    const db = await getDb();
    const projectDoc = await db.collection<Project>('projects').findOne({ _id: new ObjectId(id) as any });
    if (!projectDoc) {
        return null;
    }
    
    const project: Project = {
        id: projectDoc._id!.toString(),
        name: projectDoc.name,
        description: projectDoc.description,
        ownerId: projectDoc.ownerId.toString(),
        collaborators: projectDoc.collaborators.map((c: any) => ({
            userId: c.userId.toString(),
            role: c.role,
        })),
        joinRequests: projectDoc.joinRequests?.map((r: any) => r.toString()) || [],
        createdAt: projectDoc.createdAt,
        isArchived: projectDoc.isArchived,
    };

    return project;
}

export async function getTasksByProjectId(projectId: string): Promise<Task[]> {
    if (!ObjectId.isValid(projectId)) {
        return [];
    }
    const db = await getDb();
    const tasks = await db.collection<Task>('tasks').find({ projectId: new ObjectId(projectId) as any }).toArray();
    return tasks.map(t => ({
        id: t._id!.toString(),
        projectId: t.projectId.toString(),
        title: t.title,
        status: t.status,
        assigneeId: t.assigneeId?.toString(),
        dueDate: t.dueDate,
        createdAt: t.createdAt,
    }));
}

export async function getUsers(): Promise<User[]> {
    const db = await getDb();
    // Exclude password field from being sent to client
    const users = await db.collection<User>('users').find({}, { projection: { password: 0 } }).toArray();
    return users.map(u => ({
        id: u._id!.toString(),
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
    }));
}

export async function createProject(prevState: any, formData: FormData) {
  try {
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
        throw new Error(`Authentication required: No or invalid owner ID provided. Received: ${ownerId}`);
    }

    const { db } = await connectToDatabase();
    const result = await db.collection<Omit<Project, 'id' | '_id'>>("projects").insertOne({
      name,
      description,
      ownerId: new ObjectId(ownerId),
      collaborators: [],
      joinRequests: [],
      createdAt: new Date(),
      isArchived: false,
    });

    const newProject = await db
      .collection<Project>("projects")
      .findOne({ _id: result.insertedId });
    
    revalidatePath("/dashboard");
    if (newProject) {
        revalidatePath(`/dashboard/projects/${newProject._id!.toString()}`);
    }
  } catch (error) {
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error('An unknown error occurred while creating the project.');
  }
}

export async function createTask(formData: FormData): Promise<Task | null> {
    const projectId = formData.get('projectId') as string;
    const title = formData.get('title') as string;
    const assigneeId = formData.get('assigneeId') as string;
    const dueDate = formData.get('dueDate') as string;

    if (!ObjectId.isValid(projectId) || (assigneeId && !ObjectId.isValid(assigneeId))) {
        throw new Error("Invalid project or assignee ID");
    }

    const db = await getDb();
    const result = await db.collection<Omit<Task, 'id' | '_id'>>('tasks').insertOne({
        projectId: new ObjectId(projectId),
        title,
        status: 'To Do',
        assigneeId: assigneeId ? new ObjectId(assigneeId) : undefined,
        dueDate: new Date(dueDate),
        createdAt: new Date(),
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    const newTaskDoc = await db.collection<Task>('tasks').findOne({ _id: result.insertedId });

    if (!newTaskDoc) return null;
    
    const newTask: Task = {
        id: newTaskDoc._id.toString(),
        projectId: newTaskDoc.projectId.toString(),
        title: newTaskDoc.title,
        status: newTaskDoc.status,
        assigneeId: newTaskDoc.assigneeId?.toString(),
        dueDate: newTaskDoc.dueDate,
        createdAt: newTaskDoc.createdAt,
    };
    
    return newTask;
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus, projectId: string): Promise<Task | null> {
    if (!ObjectId.isValid(taskId) || !ObjectId.isValid(projectId)) {
        return null;
    }
    const db = await getDb();
    const result = await db.collection<Task>('tasks').updateOne(
        { _id: new ObjectId(taskId) as any },
        { $set: { status: newStatus } }
    );
    
    if (result.modifiedCount > 0) {
        revalidatePath(`/dashboard/projects/${projectId}`);
        const updatedTaskDoc = await db.collection('tasks').findOne({ _id: new ObjectId(taskId) as any });

        if (!updatedTaskDoc) return null;

        const updatedTask: Task = {
            id: updatedTaskDoc._id.toString(),
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
    const result = await db.collection<Task>('tasks').deleteOne({ _id: new ObjectId(taskId) as any });

    if (result.deletedCount > 0) {
        revalidatePath(`/dashboard/projects/${projectId}`);
        return { success: true };
    }
    return { success: false, message: "Failed to delete task." };
}

export async function deleteProject(projectId: string) {
    const session = await getSession();
    if (!session?.user) {
        return { success: false, message: 'Authentication required.' };
    }

    if (!ObjectId.isValid(projectId)) {
        return { success: false, message: "Invalid project ID." };
    }

    const db = await getDb();
    const projectObjectId = new ObjectId(projectId);

    const project = await db.collection<Project>('projects').findOne({ _id: projectObjectId as any });

    if (!project) {
        return { success: false, message: 'Project not found.' };
    }

    if (project.ownerId.toString() !== session.user.id) {
        return { success: false, message: 'Only the project owner can delete this project.' };
    }

    // Delete the project
    await db.collection<Project>('projects').deleteOne({ _id: projectObjectId as any });

    // Delete all tasks associated with the project
    await db.collection<Task>('tasks').deleteMany({ projectId: projectObjectId as any });

    revalidatePath('/dashboard');
    
    return { success: true };
}

export async function toggleProjectArchiveStatus(projectId: string, isArchived: boolean) {
    const session = await getSession();
    if (!session?.user) {
        return { success: false, message: 'Authentication required.' };
    }

    if (!ObjectId.isValid(projectId)) {
        return { success: false, message: "Invalid project ID." };
    }
    const db = await getDb();
    const projectObjectId = new ObjectId(projectId);

    const project = await db.collection<Project>('projects').findOne({ _id: projectObjectId as any });

    if (!project) {
        return { success: false, message: 'Project not found.' };
    }
    if (project.ownerId.toString() !== session.user.id) {
        return { success: false, message: 'Only the project owner can archive or unarchive this project.' };
    }

    const result = await db.collection<Project>('projects').updateOne(
        { _id: projectObjectId as any },
        { $set: { isArchived } }
    );

    if (result.modifiedCount > 0) {
        revalidatePath('/dashboard');
        return { success: true };
    }

    return { success: false, message: 'Failed to update project status.' };
}


export async function inviteCollaborator(projectId: string, userId: string, role: 'editor' | 'viewer') {
    if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userId)) {
        return { success: false, message: "Invalid project or user ID." };
    }
    const db = await getDb();
    const project = await db.collection<Project>('projects').findOne({ _id: new ObjectId(projectId) as any });

    if (project && !project.collaborators.some((c: any) => c.userId.toString() === userId)) {
        await db.collection<Project>('projects').updateOne(
            { _id: new ObjectId(projectId) as any },
            { $push: { collaborators: { userId: new ObjectId(userId), role } as any } }
        );
        revalidatePath(`/dashboard/projects/${projectId}`);
        const updatedProject = await getProjectById(projectId);
        return { success: true, project: updatedProject };
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
    const project = await db.collection<Project>('projects').findOne({ _id: new ObjectId(projectId) as any });
  
    if (!project) {
      return { success: false, message: 'Project not found.' };
    }
  
    if (project.ownerId.toString() === requestingUserId) {
        return { success: false, message: 'You are the owner of this project.' };
    }
    if (project.collaborators.some(c => c.userId.toString() === requestingUserId)) {
        return { success: false, message: 'You are already a collaborator on this project.' };
    }
    if (project.joinRequests?.some(id => id.toString() === requestingUserId)) {
        return { success: false, message: 'You have already requested to join this project.' };
    }
  
    const result = await db.collection<Project>('projects').updateOne(
      { _id: new ObjectId(projectId) as any },
      { $addToSet: { joinRequests: new ObjectId(requestingUserId) } as any }
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
    const project = await db.collection<Project>('projects').findOne({ _id: new ObjectId(projectId) as any });
    if (project?.ownerId.toString() !== session.user.id) {
        return { success: false, message: 'Only the project owner can approve requests.' };
    }
  
    // Move user from joinRequests to collaborators
    const result = await db.collection<Project>('projects').updateOne(
      { _id: new ObjectId(projectId) as any },
      {
        $pull: { joinRequests: new ObjectId(userId) } as any,
        $addToSet: { collaborators: { userId: new ObjectId(userId), role } } as any,
      }
    );
  
    if (result.modifiedCount > 0) {
      revalidatePath(`/dashboard/projects/${projectId}`);
      revalidatePath('/dashboard');
      const updatedProject = await getProjectById(projectId);
      return { success: true, project: updatedProject };
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
    const project = await db.collection<Project>('projects').findOne({ _id: new ObjectId(projectId) as any });
    if (project?.ownerId.toString() !== session.user.id) {
        return { success: false, message: 'Only the project owner can deny requests.' };
    }

    const result = await db.collection<Project>('projects').updateOne(
        { _id: new ObjectId(projectId) as any },
        { $pull: { joinRequests: new ObjectId(userId) } as any }
    );

    if (result.modifiedCount > 0) {
        revalidatePath(`/dashboard/projects/${projectId}`);
        revalidatePath('/dashboard');
        const updatedProject = await getProjectById(projectId);
        return { success: true, project: updatedProject };
    }

    return { success: false, message: 'Failed to deny join request.' };
}

export async function getMessages(projectId: string): Promise<Message[]> {
    if (!ObjectId.isValid(projectId)) {
        return [];
    }
    const db = await getDb();
    const messages = await db.collection<Message>('messages').find({ projectId: new ObjectId(projectId) as any }).sort({ createdAt: 1 }).toArray();

    return messages.map(m => ({
        id: m._id!.toString(),
        projectId: m.projectId.toString(),
        userId: m.userId.toString(),
        text: m.text,
        createdAt: m.createdAt,
    }));
}

export async function createMessage(projectId: string, text: string): Promise<Message | null> {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Authentication required.");
    }
    const userId = session.user.id;
    const userName = session.user.name;

    if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userId)) {
        throw new Error("Invalid project or user ID");
    }

    if (!text || text.trim() === '') {
        throw new Error("Message text cannot be empty.");
    }

    const db = await getDb();
    
    const project = await db.collection<Project>('projects').findOne({ _id: new ObjectId(projectId) as any });
    if (!project) {
        throw new Error("Project not found.");
    }

    const result = await db.collection<Omit<Message, 'id' | '_id'>>('messages').insertOne({
        projectId: new ObjectId(projectId),
        userId: new ObjectId(userId),
        text,
        createdAt: new Date(),
    });
    
    // Create notifications for all other project members
    const allMemberIds = [project.ownerId.toString(), ...project.collaborators.map(c => c.userId.toString())];
    const recipients = allMemberIds.filter(id => id !== userId);

    if (recipients.length > 0) {
        const notifications = recipients.map(recipientId => ({
            userId: new ObjectId(recipientId),
            projectId: new ObjectId(projectId),
            projectName: project.name,
            senderId: new ObjectId(userId),
            senderName: userName,
            message: text,
            isRead: false,
            createdAt: new Date(),
        }));
        await db.collection('notifications').insertMany(notifications);
    }
    
    revalidatePath(`/dashboard`); // For notifications popover in header

    const newMessageDoc = await db.collection<Message>('messages').findOne({ _id: result.insertedId });

    if (!newMessageDoc) return null;

    return {
        id: newMessageDoc._id!.toString(),
        projectId: newMessageDoc.projectId.toString(),
        userId: newMessageDoc.userId.toString(),
        text: newMessageDoc.text,
        createdAt: newMessageDoc.createdAt,
    };
}

export async function getNotifications(): Promise<Notification[]> {
    const session = await getSession();
    if (!session?.user) {
        return [];
    }

    const db = await getDb();
    const notifications = await db.collection('notifications')
        .find({ userId: new ObjectId(session.user.id), isRead: false })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

    return notifications.map((n: any) => ({
        id: n._id.toString(),
        userId: n.userId.toString(),
        projectId: n.projectId.toString(),
        projectName: n.projectName,
        senderId: n.senderId.toString(),
        senderName: n.senderName,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
    }));
}

export async function markNotificationsAsRead(notificationIds: string[]) {
    const session = await getSession();
    if (!session?.user) {
        return { success: false, message: 'Authentication required.' };
    }

    if (!notificationIds || notificationIds.length === 0) {
        return { success: true };
    }

    const validObjectIds = notificationIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
    
    if (validObjectIds.length === 0) {
        return { success: true };
    }
    
    const db = await getDb();
    await db.collection<Notification>('notifications').updateMany(
        { _id: { $in: validObjectIds } as any, userId: new ObjectId(session.user.id) },
        { $set: { isRead: true } }
    );
    
    revalidatePath('/dashboard');
    return { success: true };
}


export async function leaveProject(projectId: string) {
    const session = await getSession();
    if (!session?.user) {
        return { success: false, message: 'Authentication required.' };
    }

    if (!ObjectId.isValid(projectId)) {
        return { success: false, message: "Invalid project ID." };
    }

    const db = await getDb();
    const projectObjectId = new ObjectId(projectId);
    const userObjectId = new ObjectId(session.user.id);

    const project = await db.collection<Project>('projects').findOne({ _id: projectObjectId as any });
    if (!project) {
        return { success: false, message: 'Project not found.' };
    }

    if (project.ownerId.toString() === session.user.id) {
        return { success: false, message: 'Project owners cannot leave a project. You can delete it instead.' };
    }

    const result = await db.collection<Project>('projects').updateOne(
        { _id: projectObjectId as any },
        { $pull: { collaborators: { userId: userObjectId } } as any }
    );

    if (result.modifiedCount > 0) {
        revalidatePath('/dashboard');
        revalidatePath(`/dashboard/projects/${projectId}`);
        return { success: true };
    }

    return { success: false, message: 'Failed to leave the project.' };
}

export async function clearChat(projectId: string) {
    const session = await getSession();
    if (!session?.user) {
        return { success: false, message: 'Authentication required.' };
    }

    if (!ObjectId.isValid(projectId)) {
        return { success: false, message: "Invalid project ID." };
    }

    const db = await getDb();
    const projectObjectId = new ObjectId(projectId);

    const project = await db.collection<Project>('projects').findOne({ _id: projectObjectId as any });
    if (!project) {
        return { success: false, message: 'Project not found.' };
    }
    
    if (project.ownerId.toString() !== session.user.id) {
        return { success: false, message: 'Only the project owner can clear the chat.' };
    }

    const result = await db.collection('messages').deleteMany({ projectId: projectObjectId as any });

    if (result.acknowledged) {
        revalidatePath(`/dashboard/projects/${projectId}`);
        return { success: true };
    }

    return { success: false, message: 'Failed to clear chat.' };
}
