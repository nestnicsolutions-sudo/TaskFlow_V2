import { ObjectId } from "mongodb";

export type TaskStatus = 'To Do' | 'In Progress' | 'Pending' | 'Completed';
export type Role = 'admin' | 'editor' | 'viewer';

export type Task = {
    id: string; // Used on client
    _id: string; // From DB
    projectId: string;
    title: string;
    status: TaskStatus;
    assigneeId?: string;
    dueDate: Date;
};

export type Collaborator = {
    userId: string;
    role: Role;
};

export type Project = {
    id: string; // Used on client
    _id: string; // From DB
    name: string;
    description: string;
    ownerId: string;
    collaborators: Collaborator[];
};

export type User = {
    id: string; // Used on client
    _id: string; // From DB
    name: string;
    email: string;
    password?: string;
    avatarUrl?: string;
};
