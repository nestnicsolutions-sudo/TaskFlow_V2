import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Project, User } from "@/lib/data";
import { createTask } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

type AddTaskDialogProps = {
    children: ReactNode;
    project: Project;
    users: User[];
    dispatch: React.Dispatch<any>;
}

export default function AddTaskDialog({ children, project, users, dispatch }: AddTaskDialogProps) {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date>();
    const { toast } = useToast();

    const handleSubmit = async (formData: FormData) => {
        formData.append('projectId', project.id);
        if (date) {
            formData.append('dueDate', date.toISOString());
        } else {
            toast({ title: "Error", description: "Please select a due date.", variant: "destructive" });
            return;
        }

        try {
            const newTask = await createTask(formData);
            if (newTask) {
                dispatch({ type: 'ADD_TASK', payload: newTask });
                toast({ title: 'Success', description: `Task "${newTask.title}" has been created.` });
                setOpen(false);
                setDate(undefined);
            } else {
                throw new Error("Failed to create task.");
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ title: 'Error', description: errorMessage, variant: "destructive" });
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form action={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add a new task</DialogTitle>
                        <DialogDescription>
                            Fill in the details for your new task for project "{project.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Task Title</Label>
                            <Input id="title" name="title" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="assigneeId">Assign To</Label>
                            <Select name="assigneeId">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map(user => (
                                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Add Task</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
