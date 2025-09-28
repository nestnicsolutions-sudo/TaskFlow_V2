import type { Project, Task, TaskStatus, User, Role } from "@/lib/data";
import type { Dispatch } from "react";
import KanbanColumn from "./kanban-column";

const statuses: TaskStatus[] = ['To Do', 'In Progress', 'Pending', 'Completed'];

type KanbanBoardProps = {
    tasks: Task[];
    dispatch: Dispatch<any>;
    users: User[];
    userRole: Role;
    project: Project;
};

export default function KanbanBoard({ tasks, dispatch, users, userRole, project }: KanbanBoardProps) {
    return (
        <div className="flex-1 overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-w-max pb-4">
                {statuses.map(status => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        tasks={tasks.filter(t => t.status === status)}
                        dispatch={dispatch}
                        users={users}
                        userRole={userRole}
                        projectId={project.id}
                    />
                ))}
            </div>
        </div>
    );
}
