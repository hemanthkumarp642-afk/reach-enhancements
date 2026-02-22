import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function AddRevisionDialog({ open, onOpenChange, onSuccess }: AddRevisionDialogProps) {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("medium");
  const [nextRevision, setNextRevision] = useState("");
  const [notes, setNotes] = useState("");
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

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const defaultNextRevision = sevenDaysFromNow.toISOString().split('T')[0];

    const insertData: any = {
      user_id: user.id,
      topic,
      subject,
      priority,
      next_revision: nextRevision || defaultNextRevision,
      notes: notes || null,
      last_revised: null,
      times_revised: 0,
    };

    if (link) {
      insertData.link = link;
    }

    const { error } = await supabase.from("revisions").insert(insertData);

    setLoading(false);

    if (error) {
      toast.error("Failed to create revision topic");
    } else {
      toast.success("Revision topic added successfully");
      setTopic("");
      setSubject("");
      setPriority("medium");
      setNextRevision("");
      setNotes("");
      setLink("");
      setLinkError("");
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Revision Topic</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="topic">Topic Name</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Calculus Chapter 5"
              required
            />
          </div>
          <div>
            <Label htmlFor="subject">Subject/Category</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Mathematics"
              required
            />
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
          <div>
            <Label htmlFor="nextRevision">Next Revision Date (Optional)</Label>
            <Input
              id="nextRevision"
              type="date"
              value={nextRevision}
              onChange={(e) => setNextRevision(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Defaults to 7 days from now</p>
          </div>
          <div>
            <Label htmlFor="revisionLink">Resource Link (Optional)</Label>
            <Input
              id="revisionLink"
              type="url"
              value={link}
              onChange={(e) => { setLink(e.target.value); setLinkError(""); }}
              placeholder="https://example.com"
            />
            {linkError && <p className="text-xs text-destructive mt-1">{linkError}</p>}
          </div>
          <div>
            <Label htmlFor="notes">Study Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            Add Topic
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
