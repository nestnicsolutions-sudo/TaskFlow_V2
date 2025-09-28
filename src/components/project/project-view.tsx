"use client";

import type { Project, Task, TaskStatus, User, Message } from "@/lib/data";
import { useReducer, useMemo, useState, Dispatch } from "react";
import ProjectHeader from "./project-header";
import KanbanBoard from "./kanban";
import ProgressOverview from "./progress-overview";
import DeadlineNotifications from "./deadline-notifications";
import AITaskSuggester from "./ai-task-suggester";
import JoinRequests from "./join-requests";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kanban, MessageSquare, PieChart } from "lucide-react";
import ProjectChat from "./project-chat";

type Action =
    | { type: 'UPDATE_TASK_STATUS'; payload: { taskId: string; newStatus: TaskStatus } }
    | { type: 'ADD_TASK'; payload: Task }
    | { type: 'DELETE_TASK'; payload: { taskId: string } }
    | { type: 'SET_PROJECT'; payload: Project };


const tasksReducer = (state: Task[], action: Extract<Action, {type: 'UPDATE_TASK_STATUS' | 'ADD_TASK' | 'DELETE_TASK'}>): Task[] => {
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

const projectReducer = (state: Project, action: Extract<Action, {type: 'SET_PROJECT'}>): Project => {
    switch (action.type) {
        case 'SET_PROJECT':
            return action.payload;
        default:
            return state;
    }
};

const mainReducer = (
    state: { project: Project; tasks: Task[] },
    action: Action
): { project: Project; tasks: Task[] } => {
    return {
        project: projectReducer(state.project, action as any),
        tasks: tasksReducer(state.tasks, action as any),
    };
};

type ProjectViewProps = {
    initialProject: Project;
    initialTasks: Task[];
    initialMessages: Message[];
    users: User[];
    currentUser: User;
};

export default function ProjectView({ initialProject, initialTasks, initialMessages, users, currentUser }: ProjectViewProps) {
    
    const [state, dispatch] = useReducer(mainReducer, { project: initialProject, tasks: initialTasks });
    const { project, tasks } = state;
    
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
                dispatch={dispatch as Dispatch<any>} 
                userRole={userRole} 
            />
            <div className="flex items-center gap-2">
                <AITaskSuggester project={project} tasks={tasks} dispatch={dispatch as Dispatch<any>}/>
            </div>
            
            {userRole === 'admin' && project.joinRequests && project.joinRequests.length > 0 && (
                <JoinRequests project={project} users={users} dispatch={dispatch as Dispatch<any>} />
            )}

            <Tabs defaultValue="board" className="flex flex-col gap-4 min-h-0 flex-1">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="board">
                            <Kanban className="mr-2 h-4 w-4" /> Board
                        </TabsTrigger>
                         <TabsTrigger value="overview">
                            <PieChart className="mr-2 h-4 w-4" /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="chat">
                             <MessageSquare className="mr-2 h-4 w-4" /> Chat
                        </TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="board" className="flex-1 min-h-0">
                    <KanbanBoard tasks={tasks} dispatch={dispatch as Dispatch<any>} users={users} userRole={userRole} project={project} />
                </TabsContent>
                 <TabsContent value="overview" className="flex-1 min-h-0">
                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
                         <ProgressOverview tasks={tasks} />
                    </div>
                </TabsContent>
                <TabsContent value="chat" className="flex-1 min-h-0">
                    <ProjectChat 
                        project={project}
                        users={users}
                        currentUser={currentUser}
                        initialMessages={initialMessages}
                    />
                </TabsContent>
            </Tabs>


            <DeadlineNotifications tasks={tasks} />
        </div>
    );
}
