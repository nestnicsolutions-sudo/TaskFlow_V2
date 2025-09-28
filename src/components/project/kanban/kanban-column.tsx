import type { Task, TaskStatus, User, Role } from "@/lib/data";
import type { Dispatch } from "react";
import { CheckCircle, Circle, Loader, PauseCircle } from "lucide-react";
import TaskCard from "./task-card";

const statusConfig = {
    'To Do': { icon: <Circle className="h-4 w-4" />, color: 'bg-muted-foreground' },
    'In Progress': { icon: <Loader className="h-4 w-4" />, color: 'bg-blue-500' },
    'Pending': { icon: <PauseCircle className="h-4 w-4" />, color: 'bg-yellow-500' },
    'Completed': { icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-500' },
};

type KanbanColumnProps = {
    status: TaskStatus;
    tasks: Task[];
    dispatch: Dispatch<any>;
    users: User[];
    userRole: Role;
    projectId: string;
};

export default function KanbanColumn({ status, tasks, dispatch, users, userRole, projectId }: KanbanColumnProps) {
    const config = statusConfig[status];

    return (
        <div className="flex flex-col gap-4 w-72 md:w-auto h-full">
            <div className="flex items-center gap-2 p-2 rounded-t-lg bg-secondary">
                <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
                <h3 className="font-semibold text-sm">{status}</h3>
                <span className="ml-auto text-xs font-mono bg-muted text-muted-foreground rounded-full px-2 py-0.5">{tasks.length}</span>
            </div>
            <div className="flex flex-col gap-4 p-2 rounded-b-lg bg-secondary/50 flex-1 overflow-y-auto">
                {tasks.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        dispatch={dispatch}
                        users={users}
                        userRole={userRole}
                        projectId={projectId}
                    />
                ))}
                {tasks.length === 0 && (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        No tasks here.
                    </div>
                )}
            </div>
        </div>
    );
}
