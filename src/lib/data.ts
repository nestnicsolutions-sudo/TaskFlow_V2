import { ObjectId } from "mongodb";

export type TaskStatus = 'To Do' | 'In Progress' | 'Pending' | 'Completed';
export type Role = 'admin' | 'editor' | 'viewer';

export type Task = {
    id: string;
    projectId: string | ObjectId;
    title: string;
    status: TaskStatus;
    assigneeId?: string | ObjectId;
    dueDate: Date;
    createdAt: Date;
};

export type Collaborator = {
    userId: string | ObjectId;
    role: Role;
};

export type Project = {
    id: string;
    name: string;
    description: string;
    ownerId: string | ObjectId;
    collaborators: Collaborator[];
    joinRequests: (string | ObjectId)[];
    createdAt: Date;
    isArchived?: boolean;
};

export type User = {
    id: string;
    name: string;
    email: string;
    password?: string;
    avatarUrl?: string;
    createdAt: Date;
};

export type Message = {
    id: string;
    projectId: string | ObjectId;
    userId: string | ObjectId;
    text: string;
    createdAt: Date;
};
