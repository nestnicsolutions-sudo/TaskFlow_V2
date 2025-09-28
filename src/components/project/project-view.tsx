"use client";

import type { Project, Task, TaskStatus, User } from "@/lib/data";
import { useReducer, useMemo } from "react";
import ProjectHeader from "./project-header";
import KanbanBoard from "./kanban";
import ProgressOverview from "./progress-overview";
import DeadlineNotifications from "./deadline-notifications";
import AITaskSuggester from "./ai-task-suggester";

type Action =
    | { type: 'UPDATE_TASK_STATUS'; payload: { taskId: string; newStatus: TaskStatus } }
    | { type: 'ADD_TASK'; payload: Task }
    | { type: 'DELETE_TASK'; payload: { taskId: string } };

const tasksReducer = (state: Task[], action: Action): Task[] => {
    switch (action.type) {
        case 'UPDATE_TASK_STATUS':
            return state.map(task =>
                task.id === action.payload.taskId
                    ? { ...task, status: action.payload.newStatus }
                    : task
            );
        case 'ADD_TASK':
            // Prevent adding duplicate tasks
            if (state.some(t => t.id === action.payload.id)) {
                return state;
            }
            return [...state, action.payload];
        case 'DELETE_TASK':
            return state.filter(task => task.id !== action.payload.taskId);
        default:
            return state;
    }
};

type ProjectViewProps = {
    initialProject: Project;
    initialTasks: Task[];
    users: User[];
    currentUser: User;
};

export default function ProjectView({ initialProject, initialTasks, users, currentUser }: ProjectViewProps) {
    
    const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);
    
    const userRole = useMemo(() => {
        if (initialProject.ownerId === currentUser.id) return 'admin';
        return initialProject.collaborators.find((c:any) => c.userId === currentUser.id)?.role || 'viewer';
    }, [initialProject, currentUser]);

    return (
        <div className="flex flex-col h-full gap-4">
            <ProjectHeader 
                project={initialProject} 
                users={users} 
                currentUser={currentUser} 
                tasks={tasks} 
                dispatch={dispatch} 
                userRole={userRole} 
            />
            <div className="flex items-center gap-2">
                <AITaskSuggester project={initialProject} tasks={tasks} dispatch={dispatch}/>
            </div>
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                <ProgressOverview tasks={tasks} />
                <KanbanBoard tasks={tasks} dispatch={dispatch} users={users} userRole={userRole} project={initialProject} />
            </div>
            <DeadlineNotifications tasks={tasks} />
        </div>
    );
}
