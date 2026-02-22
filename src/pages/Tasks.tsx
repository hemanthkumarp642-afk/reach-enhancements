import { AuthGuard } from "@/components/AuthGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, CheckSquare, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const CATEGORIES = [
  { value: "daily", label: "Daily" },
  { value: "job_search", label: "Job Search" },
  { value: "learning", label: "Learning" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" },
];

const Tasks = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("daily");
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTasks(); }, [currentCategory]);

  const loadTasks = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("tasks").select("*").eq("user_id", user.id).eq("category", currentCategory).order("created_at", { ascending: false });
    setTasks(data || []);
    setLoading(false);
  };

  const toggleTaskComplete = async (taskId: string, completed: boolean) => {
    await supabase.from("tasks").update({ completed: !completed }).eq("id", taskId);
    loadTasks();
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from("tasks").delete().eq("id", taskId);
    loadTasks();
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <AuthGuard>
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">To-Do Lists</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">Manage your tasks across different categories</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="sm" className="shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>

        <Tabs value={currentCategory} onValueChange={setCurrentCategory}>
          <TabsList className="w-full overflow-x-auto flex justify-start sm:justify-center no-scrollbar">
            {CATEGORIES.map(c => <TabsTrigger key={c.value} value={c.value} className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3">{c.label}</TabsTrigger>)}
          </TabsList>

          {CATEGORIES.map(c => (
            <TabsContent key={c.value} value={c.value} className="mt-4 sm:mt-6">
              {loading ? (
                <div className="space-y-2 sm:space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border">
                      <Skeleton className="h-4 w-4 rounded" />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-muted mb-4">
                    <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm sm:text-base font-medium text-foreground mb-1">No {c.label.toLowerCase()} tasks</p>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mb-4">Add a task to keep track of what you need to do.</p>
                  <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-1 h-3 w-3" /> Add Task
                  </Button>
                </div>
              ) : (
                <>
                  {tasks.length > 0 && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-3">{completedCount} of {tasks.length} completed</p>
                  )}
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTaskComplete(task.id, task.completed)}
                          aria-label={`Mark "${task.task_name}" as ${task.completed ? "incomplete" : "complete"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs sm:text-sm font-medium truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                            {task.task_name}
                          </p>
                          {task.due_date && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Due: {format(new Date(task.due_date), "MMM d, yyyy")}</p>
                          )}
                          {/* Mobile: show link below title */}
                          {task.link && (
                            <a
                              href={task.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary text-[10px] sm:text-xs inline-flex items-center gap-1 mt-0.5 sm:hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" /> View
                            </a>
                          )}
                        </div>
                        {/* Desktop: show link as separate element */}
                        <div className="hidden sm:flex items-center">
                          {task.link ? (
                            <a
                              href={task.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary text-xs inline-flex items-center gap-1 mr-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" /> View
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-xs mr-2">—</span>
                          )}
                        </div>
                        <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"} className="text-[10px] sm:text-xs shrink-0">
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <AddTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} category={currentCategory} onSuccess={loadTasks} />
      </div>
    </AuthGuard>
  );
};

export default Tasks;
