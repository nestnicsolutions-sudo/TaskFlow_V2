import { ObjectId } from "mongodb";

export type TaskStatus = 'To Do' | 'In Progress' | 'Pending' | 'Completed';
export type Role = 'admin' | 'editor' | 'viewer';

export type Task = {
    id: string;
    _id: ObjectId;
    projectId: ObjectId;
    title: string;
    status: TaskStatus;
    assigneeId?: ObjectId;
    dueDate: Date;
};

export type Collaborator = {
    userId: ObjectId;
    role: Role;
};

export type Project = {
    id: string;
    _id: ObjectId;
    name: string;
    description: string;
    ownerId: ObjectId;
    collaborators: Collaborator[];
};

export type User = {
    id: string;
    _id: ObjectId;
    name: string;
    email: string;
    password?: string;
    avatarUrl?: string;
};