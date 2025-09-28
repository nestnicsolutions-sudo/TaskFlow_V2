import type { Task, User, Role, TaskStatus } from "@/lib/data";
import type { Dispatch } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isPast } from 'date-fns';
import { format, toZonedTime } from 'date-fns-tz';
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateTaskStatus, deleteTask } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

const statusOrder: TaskStatus[] = ['To Do', 'In Progress', 'Pending', 'Completed'];

type TaskCardProps = {
    task: Task;
    dispatch: Dispatch<any>;
    users: User[];
    userRole: Role;
    projectId: string;
};

export default function TaskCard({ task, dispatch, users, userRole, projectId }: TaskCardProps) {
    const assignee = users.find(u => u.id === task.assigneeId);
    const dueDate = new Date(task.dueDate);
    const isOverdue = isPast(dueDate) && task.status !== 'Completed';
    const canManage = userRole === 'admin' || userRole === 'editor';
    const { toast } = useToast();

    const currentStatusIndex = statusOrder.indexOf(task.status);
    
    const handleStatusChange = async (direction: 'next' | 'prev') => {
        const newIndex = direction === 'next' ? currentStatusIndex + 1 : currentStatusIndex - 1;
        if (newIndex >= 0 && newIndex < statusOrder.length) {
            const newStatus = statusOrder[newIndex];
            // Optimistic UI update
            dispatch({ type: 'UPDATE_TASK_STATUS', payload: { taskId: task.id, newStatus } });
            
            const result = await updateTaskStatus(task.id, newStatus, projectId);
            if (!result) {
                // Revert on failure
                dispatch({ type: 'UPDATE_TASK_STATUS', payload: { taskId: task.id, newStatus: task.status } });
                toast({ title: 'Error', description: 'Failed to update task status.', variant: 'destructive' });
            }
        }
    };
    
    const handleDelete = async () => {
        // Optimistic UI update
        dispatch({ type: 'DELETE_TASK', payload: { taskId: task.id } });
        const result = await deleteTask(task.id, projectId);
        if (!result.success) {
            // Revert on failure (though it's tricky, maybe just show an error)
             toast({ title: 'Error', description: result.message || 'Failed to delete task.', variant: 'destructive' });
             // A more robust solution might re-add the task to the state
        } else {
             toast({ title: 'Success', description: 'Task deleted.' });
        }
    }

    const formattedDate = format(toZonedTime(dueDate, 'UTC'), 'MMM d', { timeZone: 'UTC' });

    return (
        <Card className="bg-background shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="p-4">
                <CardTitle className="text-base font-semibold">{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className={cn("flex items-center gap-2", isOverdue && "text-destructive font-medium")}>
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formattedDate}</span>
                    </div>
                    {assignee && (
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                            <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    )}
                </div>
            </CardContent>
            {canManage && (
                <CardFooter className="p-2 bg-secondary/30 flex justify-between">
                    {task.status === 'Completed' ? (
                         <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    ) : (
                        <>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                disabled={currentStatusIndex === 0}
                                onClick={() => handleStatusChange('prev')}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                disabled={currentStatusIndex === statusOrder.length - 1}
                                onClick={() => handleStatusChange('next')}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
