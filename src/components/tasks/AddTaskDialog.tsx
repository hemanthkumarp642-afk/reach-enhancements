import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  onSuccess: () => void;
}

const isValidUrl = (str: string): boolean => {
  try {
    const url = new URL(str);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

export function AddTaskDialog({ open, onOpenChange, category, onSuccess }: AddTaskDialogProps) {
  const [taskName, setTaskName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [priority, setPriority] = useState("medium");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (link && !isValidUrl(link)) {
      setLinkError("Please enter a valid URL (https://...)");
      return;
    }
    setLinkError("");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const insertData: any = {
      user_id: user.id,
      category,
      task_name: taskName,
      priority,
      start_date: startDate || null,
      due_date: dueDate || null,
      company: company || null,
      role: role || null,
      completed: false,
    };

    if (link) {
      insertData.link = link;
    }

    const { error } = await supabase.from("tasks").insert(insertData);

    setLoading(false);

    if (error) {
      toast.error("Failed to create task");
    } else {
      toast.success("Task created successfully");
      setTaskName("");
      setCompany("");
      setRole("");
      setPriority("medium");
      setStartDate("");
      setDueDate("");
      setLink("");
      setLinkError("");
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="taskName">Task Name</Label>
            <Input
              id="taskName"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="company">Company (Optional)</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google"
              />
            </div>
            <div>
              <Label htmlFor="role">Role/Title (Optional)</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Frontend Dev"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startDate">Start Date (Optional)</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dueDate">End Date (Optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="taskLink">External Link (Optional)</Label>
            <Input
              id="taskLink"
              type="url"
              value={link}
              onChange={(e) => { setLink(e.target.value); setLinkError(""); }}
              placeholder="https://example.com"
            />
            {linkError && <p className="text-xs text-destructive mt-1">{linkError}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            Create Task
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
