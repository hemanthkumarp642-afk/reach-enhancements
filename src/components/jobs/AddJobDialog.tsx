import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddJobDialog({ open, onOpenChange, onSuccess }: AddJobDialogProps) {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [hrEmail, setHrEmail] = useState("");
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("applied");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("job_applications").insert({
      user_id: user.id,
      company,
      position,
      job_url: jobUrl || null,
      hr_email: hrEmail || null,
      applied_date: appliedDate,
      deadline: deadline || null,
      status,
      notes: notes || null,
      reminder_active: !!deadline,
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to create application");
    } else {
      toast.success("Application added successfully");
      setCompany("");
      setPosition("");
      setJobUrl("");
      setHrEmail("");
      setDeadline("");
      setNotes("");
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Job Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="position">Position</Label>
              <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jobUrl">Job URL (Optional)</Label>
              <Input id="jobUrl" type="url" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="hrEmail">HR Email (Optional)</Label>
              <Input id="hrEmail" type="email" value={hrEmail} onChange={(e) => setHrEmail(e.target.value)} placeholder="recruiter@company.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appliedDate">Applied Date</Label>
              <Input id="appliedDate" type="date" value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
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
              <Label htmlFor="resume">Resume Used (Optional)</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select resume" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            Add Application
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
