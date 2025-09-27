import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sparkles, Plus } from 'lucide-react';
import { suggestSubtasks } from '@/ai/ai-suggest-subtasks';
import { createTask } from '@/app/actions';
import type { Project, Task } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type AITaskSuggesterProps = {
  project: Project;
  tasks: Task[];
  dispatch: React.Dispatch<any>;
};

export default function AITaskSuggester({ project, tasks, dispatch }: AITaskSuggesterProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFetchSuggestions = async () => {
    setLoading(true);
    setSuggestions([]);
    try {
        const existingTasks = tasks.map(t => t.title);
        const result = await suggestSubtasks({ projectDescription: project.description, existingTasks });
        if (result.subtasks) {
          setSuggestions(result.subtasks);
        }
    } catch (error) {
        console.error(error);
        toast({ title: 'Error', description: 'Could not fetch suggestions.', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleAddTask = async (title: string) => {
    const formData = new FormData();
    formData.append('projectId', project.id);
    formData.append('title', title);
    formData.append('assigneeId', project.ownerId as string); 
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    formData.append('dueDate', tomorrow.toISOString());

    const newTask = await createTask(formData);
    if (newTask) {
      dispatch({ type: 'ADD_TASK', payload: newTask });
      toast({ title: 'Success', description: `Task "${title}" added.` });
      // Remove suggestion from list
      setSuggestions(suggestions.filter(s => s !== title));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => { setOpen(true); handleFetchSuggestions(); }}>
          <Sparkles className="mr-2 h-4 w-4" />
          Suggest Tasks
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Task Suggestions</DialogTitle>
          <DialogDescription>
            Here are some tasks suggested by AI based on your project description.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {!loading && suggestions.length > 0 && (
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-center justify-between gap-2 p-2 rounded-md border bg-secondary/50">
                  <span className="text-sm">{suggestion}</span>
                  <Button size="sm" variant="ghost" onClick={() => handleAddTask(suggestion)}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {!loading && suggestions.length === 0 && (
            <p className="text-sm text-center text-muted-foreground">No new suggestions at the moment.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
