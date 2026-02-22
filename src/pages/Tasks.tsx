import { AuthGuard } from "@/components/AuthGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, CheckSquare, ExternalLink, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isPast, isToday, addDays } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [highPriorityCount, setHighPriorityCount] = useState(0);
  const [showHighPriorityAlert, setShowHighPriorityAlert] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; taskId: string; taskName: string }>({ open: false, taskId: "", taskName: "" });

  useEffect(() => { loadTasks(); }, [currentCategory]);

  // On mount, check for auto-escalation and high priority notifications
  useEffect(() => {
    escalatePriorities();
  }, []);

  const escalatePriorities = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: allTasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false);

    if (!allTasks) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let escalatedToHigh = 0;

    for (const task of allTasks) {
      if (!task.due_date) continue;

      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);

      if (task.priority === "low" && isPast(dueDate) && !isToday(dueDate)) {
        // Low priority + past end date → escalate to medium
        await supabase.from("tasks").update({ priority: "medium" }).eq("id", task.id);
      } else if (task.priority === "medium") {
        // Medium priority + 1 day past end date → escalate to high
        const oneDayAfterDue = addDays(dueDate, 1);
        if (today >= oneDayAfterDue) {
          await supabase.from("tasks").update({ priority: "high" }).eq("id", task.id);
          escalatedToHigh++;
        }
      } else if (task.priority === "high" && isPast(dueDate) && !isToday(dueDate)) {
        // High priority + past end date → count for notification
        escalatedToHigh++;
      }
    }

    // Count all high-priority overdue tasks for notification
    const { data: highTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("completed", false)
      .eq("priority", "high");

    const overduHighCount = highTasks?.filter(t => {
      const task = allTasks.find(at => at.id === t.id);
      return task?.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
    }).length || 0;

    // Re-fetch to get accurate count after escalation
    const { data: updatedHighTasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false)
      .eq("priority", "high");

    const overdueHighFinal = updatedHighTasks?.filter(t => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      d.setHours(0, 0, 0, 0);
      return isPast(d) && !isToday(d);
    }).length || 0;

    if (overdueHighFinal > 0) {
      setHighPriorityCount(overdueHighFinal);
      setShowHighPriorityAlert(true);
    }

    // Reload current category after escalation
    loadTasks();
  };

  const loadTasks = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("tasks").select("*").eq("user_id", user.id).eq("category", currentCategory).order("created_at", { ascending: false });
    setTasks(data || []);
    setLoading(false);
  };

  const handleCheckboxClick = (taskId: string, taskName: string, completed: boolean) => {
    if (!completed) {
      // Mark complete with strikethrough, then ask to delete
      setDeleteConfirm({ open: true, taskId, taskName });
    }
  };

  const confirmDelete = async () => {
    // Mark complete first (shows strikethrough briefly), then delete
    await supabase.from("tasks").update({ completed: true }).eq("id", deleteConfirm.taskId);
    await supabase.from("tasks").delete().eq("id", deleteConfirm.taskId);
    setDeleteConfirm({ open: false, taskId: "", taskName: "" });
    toast.success("Task completed and removed");
    loadTasks();
  };

  const cancelDelete = async () => {
    // Just mark as complete without deleting
    await supabase.from("tasks").update({ completed: true }).eq("id", deleteConfirm.taskId);
    setDeleteConfirm({ open: false, taskId: "", taskName: "" });
    loadTasks();
  };

  const toggleTaskComplete = async (taskId: string, completed: boolean) => {
    if (completed) {
      // Uncheck - just toggle back
      await supabase.from("tasks").update({ completed: false }).eq("id", taskId);
      loadTasks();
    } else {
      // Check - show delete confirmation
      const task = tasks.find(t => t.id === taskId);
      handleCheckboxClick(taskId, task?.task_name || "", completed);
    }
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
                          {(task.start_date || task.due_date) && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                              {task.start_date && `Start: ${format(new Date(task.start_date), "MMM d, yyyy")}`}
                              {task.start_date && task.due_date && " — "}
                              {task.due_date && `End: ${format(new Date(task.due_date), "MMM d, yyyy")}`}
                            </p>
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

        {/* Delete confirmation dialog when checking a task */}
        <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => { if (!open) setDeleteConfirm({ open: false, taskId: "", taskName: "" }); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Task Completed</AlertDialogTitle>
              <AlertDialogDescription>
                "{deleteConfirm.taskName}" is marked as complete. Do you want to delete it from the list?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDelete}>Keep It</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* High priority notification popup */}
        <AlertDialog open={showHighPriorityAlert} onOpenChange={setShowHighPriorityAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                High Priority Tasks Alert
              </AlertDialogTitle>
              <AlertDialogDescription>
                You have {highPriorityCount} high-priority task{highPriorityCount > 1 ? "s" : ""} that {highPriorityCount > 1 ? "are" : "is"} overdue. Please review and complete them as soon as possible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowHighPriorityAlert(false)}>Got it</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthGuard>
  );
};

export default Tasks;
