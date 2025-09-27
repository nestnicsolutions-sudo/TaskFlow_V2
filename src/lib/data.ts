import { ObjectId } from "mongodb";

export type TaskStatus = 'To Do' | 'In Progress' | 'Pending' | 'Completed';
export type Role = 'admin' | 'editor' | 'viewer';

export type Task = {
    id: string; // Used on client
    _id: ObjectId; // From DB
    projectId: ObjectId;
    title: string;
    status: TaskStatus;
    assigneeId?: string | ObjectId;
    dueDate: Date;
};

export type Collaborator = {
    userId: string | ObjectId;
    role: Role;
};

export type Project = {
    id: string; // Used on client
    _id: ObjectId; // From DB
    name: string;
    description: string;
    ownerId: string | ObjectId;
    collaborators: Collaborator[];
};

export type User = {
    id: string; // Used on client
    _id: ObjectId; // From DB
    name: string;
    email: string;
    password?: string;
    avatarUrl?: string;
};
