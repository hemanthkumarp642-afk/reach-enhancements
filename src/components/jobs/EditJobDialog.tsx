import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  job: any;
}

export function EditJobDialog({ open, onOpenChange, onSuccess, job }: EditJobDialogProps) {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [hrEmail, setHrEmail] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("applied");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [reminderActive, setReminderActive] = useState(true);

  useEffect(() => {
    if (job) {
      setCompany(job.company || "");
      setPosition(job.position || "");
      setJobUrl(job.job_url || "");
      setHrEmail(job.hr_email || "");
      setAppliedDate(job.applied_date || "");
      setDeadline(job.deadline || "");
      setStatus(job.status || "applied");
      setNotes(job.notes || "");
      setReminderActive(job.reminder_active !== false);
    }
  }, [job]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("job_applications")
      .update({
        company,
        position,
        job_url: jobUrl || null,
        hr_email: hrEmail || null,
        applied_date: appliedDate,
        deadline: deadline || null,
        status,
        notes: notes || null,
        reminder_active: reminderActive,
      })
      .eq("id", job.id);

    setLoading(false);

    if (error) {
      toast.error("Failed to update application");
    } else {
      toast.success("Application updated");
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Job Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-company">Company</Label>
              <Input id="edit-company" value={company} onChange={(e) => setCompany(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="edit-position">Position</Label>
              <Input id="edit-position" value={position} onChange={(e) => setPosition(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-jobUrl">Job URL</Label>
              <Input id="edit-jobUrl" type="url" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-hrEmail">HR Email</Label>
              <Input id="edit-hrEmail" type="email" value={hrEmail} onChange={(e) => setHrEmail(e.target.value)} placeholder="recruiter@company.com" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-appliedDate">Applied Date</Label>
              <Input id="edit-appliedDate" type="date" value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="edit-deadline">Follow-up Reminder Date</Label>
              <Input id="edit-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          {deadline && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="edit-reminderActive" className="text-sm font-medium">Reminder Active</Label>
                <p className="text-xs text-muted-foreground">Get notified on the follow-up date</p>
              </div>
              <Switch id="edit-reminderActive" checked={reminderActive} onCheckedChange={setReminderActive} />
            </div>
          )}
          <div>
            <Label htmlFor="edit-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                <SelectItem value="interview_done">Interview Done</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
