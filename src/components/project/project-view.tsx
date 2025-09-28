"use client";

import type { Project, Task, TaskStatus, User } from "@/lib/data";
import { useReducer, useMemo, useState } from "react";
import ProjectHeader from "./project-header";
import KanbanBoard from "./kanban";
import ProgressOverview from "./progress-overview";
import DeadlineNotifications from "./deadline-notifications";
import AITaskSuggester from "./ai-task-suggester";
import JoinRequests from "./join-requests";

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
    
    const [project, setProject] = useState(initialProject);
    const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);
    
    const userRole = useMemo(() => {
        if (project.ownerId === currentUser.id) return 'admin';
        const collaborator = project.collaborators.find((c:any) => c.userId === currentUser.id);
        return collaborator ? collaborator.role : 'viewer';
    }, [project, currentUser]);

    return (
        <div className="flex flex-col h-full gap-4">
             <ProjectHeader 
                project={project} 
                users={users} 
                currentUser={currentUser} 
                tasks={tasks} 
                dispatch={dispatch} 
                userRole={userRole} 
            />
            <div className="flex items-center gap-2">
                <AITaskSuggester project={project} tasks={tasks} dispatch={dispatch}/>
            </div>
            
            {userRole === 'admin' && project.joinRequests && project.joinRequests.length > 0 && (
                <JoinRequests project={project} users={users} />
            )}

            <div className="flex flex-col gap-4 min-h-0 flex-1">
                <ProgressOverview tasks={tasks} />
                <div className="flex-1 min-h-0">
                    <KanbanBoard tasks={tasks} dispatch={dispatch} users={users} userRole={userRole} project={project} />
                </div>
            </div>


            <DeadlineNotifications tasks={tasks} />
        </div>
    );
}
