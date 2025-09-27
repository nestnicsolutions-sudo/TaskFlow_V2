"use client";

import type { Project, Task, TaskStatus, User } from "@/lib/data";
import { useReducer, useMemo } from "react";
import ProjectHeader from "./project-header";
import KanbanBoard from "./kanban";

type Action =
    | { type: 'UPDATE_TASK_STATUS'; payload: { taskId: string; newStatus: TaskStatus } }
    | { type: 'ADD_TASK'; payload: Task };

const tasksReducer = (state: Task[], action: Action): Task[] => {
    switch (action.type) {
        case 'UPDATE_TASK_STATUS':
            return state.map(task =>
                task.id === action.payload.taskId
                    ? { ...task, status: action.payload.newStatus }
                    : task
            );
        case 'ADD_TASK':
             if (state.find(t => t.id === action.payload.id)) return state;
            return [...state, action.payload];
        default:
            return state;
    }
};

type ProjectViewProps = {
    initialProject: any;
    initialTasks: any[];
    users: any[];
    currentUser: any;
};

export default function ProjectView({ initialProject, initialTasks, users, currentUser }: ProjectViewProps) {
    
    const transformedTasks = initialTasks.map(t => ({...t, id: t._id}));
    const [tasks, dispatch] = useReducer(tasksReducer, transformedTasks);
    
    const userRole = useMemo(() => {
        if (initialProject.ownerId === currentUser.id) return 'admin';
        return initialProject.collaborators.find((c:any) => c.userId === currentUser.id)?.role || 'viewer';
    }, [initialProject, currentUser]);

    const projectWithId = {...initialProject, id: initialProject._id};
    const usersWithId = users.map(u => ({...u, id: u._id}));
    
    return (
        <div className="flex flex-col h-full">
            <ProjectHeader project={projectWithId} users={usersWithId} currentUser={currentUser} tasks={tasks} dispatch={dispatch} userRole={userRole} />
            <KanbanBoard tasks={tasks} dispatch={dispatch} users={usersWithId} userRole={userRole} project={projectWithId} />
        </div>
    );
}