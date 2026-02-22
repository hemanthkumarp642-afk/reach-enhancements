import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isPast, isToday, addDays } from "date-fns";
import { toast } from "sonner";

export interface Reminder {
  id: string;
  company: string;
  position: string;
  deadline: string;
  status: string;
  reminder_active: boolean;
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const notifiedRef = useRef<Set<string>>(new Set());

  const loadReminders = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("job_applications")
      .select("id, company, position, deadline, status, reminder_active")
      .eq("user_id", user.id)
      .not("deadline", "is", null)
      .eq("reminder_active", true)
      .not("status", "in", '("rejected","withdrawn","offer")')
      .order("deadline", { ascending: true });

    const items = (data || []).filter(j => {
      if (!j.deadline) return false;
      const d = new Date(j.deadline);
      return isPast(d) || isToday(d) || d.getTime() - Date.now() < 7 * 86400000;
    }) as Reminder[];

    setReminders(items);
    setLoading(false);

    // Browser notifications for today's reminders
    if ("Notification" in window && Notification.permission === "granted") {
      items.filter(j => isToday(new Date(j.deadline))).forEach(j => {
        if (!notifiedRef.current.has(j.id)) {
          notifiedRef.current.add(j.id);
          new Notification("JobTrackr Reminder", {
            body: `Follow up with ${j.company} for ${j.position}`,
            icon: "/favicon.ico",
          });
        }
      });
    }
  }, []);

  useEffect(() => { loadReminders(); }, [loadReminders]);

  const markComplete = async (jobId: string) => {
    const { error } = await supabase
      .from("job_applications")
      .update({ reminder_active: false })
      .eq("id", jobId);
    if (error) toast.error("Failed to complete reminder");
    else {
      toast.success("Reminder completed");
      setReminders(prev => prev.filter(r => r.id !== jobId));
    }
  };

  const snooze = async (jobId: string, days: number = 2) => {
    const newDate = addDays(new Date(), days).toISOString().split("T")[0];
    const { error } = await supabase
      .from("job_applications")
      .update({ deadline: newDate })
      .eq("id", jobId);
    if (error) toast.error("Failed to snooze reminder");
    else {
      toast.success(`Reminder snoozed for ${days} days`);
      await loadReminders();
    }
  };

  const dueCount = reminders.filter(r => {
    const d = new Date(r.deadline);
    return isToday(d) || isPast(d);
  }).length;

  return { reminders, loading, dueCount, markComplete, snooze, reload: loadReminders };
}
