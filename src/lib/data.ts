export type TaskStatus = 'To Do' | 'In Progress' | 'Pending' | 'Completed';
export type Role = 'admin' | 'editor' | 'viewer';

export type Task = {
    id: string;
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
    id: string;
    name: string;
    description: string;
    ownerId: string;
    collaborators: Collaborator[];
};

export type User = {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
};
