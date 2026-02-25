import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Clock, CalendarCheck, XCircle, Plus, Bell, ArrowRight, Rocket, Check, AlarmClock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useReminders } from "@/hooks/useReminders";

interface DashboardStats {
  totalApplied: number;
  pending: number;
  interviews: number;
  rejected: number;
}

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  interview_scheduled: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  interview_done: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  offer: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  withdrawn: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ totalApplied: 0, pending: 0, interviews: 0, rejected: 0 });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const { reminders: upcomingReminders, markComplete, snooze, reload: reloadReminders } = useReminders();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const loadDashboard = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    requestNotificationPermission();

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    setUserName(profile?.full_name || "there");

    const { data: allJobs } = await supabase
      .from("job_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("applied_date", { ascending: false });

    const jobs = allJobs || [];

    setStats({
      totalApplied: jobs.length,
      pending: jobs.filter(j => j.status === "applied").length,
      interviews: jobs.filter(j => ["interview_scheduled", "interview_done"].includes(j.status)).length,
      rejected: jobs.filter(j => j.status === "rejected").length,
    });

    const sorted = [...jobs].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setRecentJobs(sorted.slice(0, 5));
    setLoading(false);
  };

  const renderStatCard = (title: string, value: number, Icon: any, color: string) => (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-ring"
      tabIndex={0}
      role="button"
      aria-label={`${title}: ${value}. Click to view job tracker.`}
      onClick={() => navigate("/jobs")}
      onKeyDown={(e) => e.key === "Enter" && navigate("/jobs")}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1 truncate">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold tabular-nums">{value}</p>
          </div>
          <div className={`flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105 shrink-0 ${color}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const StatSkeleton = () => (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 sm:w-20" />
            <Skeleton className="h-7 sm:h-8 w-10 sm:w-12" />
          </div>
          <Skeleton className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );

  const ListSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <AuthGuard>
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-5 sm:space-y-6">
        {/* Hero section */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">
              Welcome back, {loading ? "..." : userName}!
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              {format(new Date(), "EEEE, MMMM d, yyyy")} — Here's your job search overview.
            </p>
          </div>
          <Button onClick={() => navigate("/jobs")} className="shrink-0 self-start sm:self-auto" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Application
          </Button>
        </section>

        {/* Stats - 2 cols on mobile, 4 on lg */}
        <section aria-label="Application statistics" className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>{[1,2,3,4].map(i => <StatSkeleton key={i} />)}</>
          ) : (
            <>
              {renderStatCard("Total Applied", stats.totalApplied, Briefcase, "bg-primary/10 text-primary")}
              {renderStatCard("Pending", stats.pending, Clock, "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400")}
              {renderStatCard("Interviews", stats.interviews, CalendarCheck, "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400")}
              {renderStatCard("Rejected", stats.rejected, XCircle, "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}
            </>
          )}
        </section>

        {/* Two-column on desktop, stacked on mobile/tablet */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Upcoming Reminders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-semibold">
                <Bell className="h-4 w-4 text-amber-500" />
                Upcoming Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <ListSkeleton /> : upcomingReminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-muted mb-3">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No upcoming follow-ups</p>
                  <p className="text-xs text-muted-foreground max-w-[220px]">Set reminder dates on your job applications to get notified here.</p>
                </div>
              ) : (
                <ul className="space-y-2" role="list">
                  {upcomingReminders.slice(0, 5).map((job) => {
                    const d = new Date(job.deadline);
                    const overdue = isPast(d) && !isToday(d);
                    return (
                      <li
                        key={job.id}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-ring"
                        onClick={() => navigate("/jobs")}
                        tabIndex={0}
                        role="button"
                        aria-label={`${overdue ? "Overdue" : "Upcoming"} reminder for ${job.company}`}
                        onKeyDown={(e) => e.key === "Enter" && navigate("/jobs")}
                       >
                        <div className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg ${overdue ? "bg-destructive/10" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                          <Bell className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${overdue ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{job.company} — {job.position}</p>
                          <p className={`text-[10px] sm:text-xs ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                            {overdue ? "Overdue" : isToday(d) ? "Due today" : isTomorrow(d) ? "Due tomorrow" : format(d, "MMM d")}
                          </p>
                        </div>
                       <div className="flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-7 sm:w-7"
                            onClick={(e) => { e.stopPropagation(); snooze(job.id, 2); }}
                            aria-label={`Snooze reminder for ${job.company} by 2 days`}
                            title="Snooze 2 days"
                          >
                            <AlarmClock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600 hover:text-emerald-700"
                            onClick={(e) => { e.stopPropagation(); markComplete(job.id); }}
                            aria-label={`Mark reminder for ${job.company} as complete`}
                            title="Mark complete"
                          >
                            <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm sm:text-base font-semibold">Recent Applications</CardTitle>
              {recentJobs.length > 0 && (
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/jobs")}>
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loading ? <ListSkeleton /> : recentJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-muted mb-3">
                    <Rocket className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No applications yet</p>
                  <p className="text-xs text-muted-foreground max-w-[220px] mb-3">Start tracking your job search to see your progress here.</p>
                  <Button variant="outline" size="sm" onClick={() => navigate("/jobs")}>
                    <Plus className="mr-1 h-3 w-3" /> Add your first application
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2" role="list">
                  {recentJobs.map((job) => (
                    <li
                      key={job.id}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-ring"
                      onClick={() => navigate("/jobs")}
                      tabIndex={0}
                      role="button"
                      aria-label={`${job.position} at ${job.company}`}
                      onKeyDown={(e) => e.key === "Enter" && navigate("/jobs")}
                    >
                      <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{job.position}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{job.company} · {job.applied_date ? format(new Date(job.applied_date), "MMM d") : "—"}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium whitespace-nowrap shrink-0 ${STATUS_COLORS[job.status] || ""}`}>
                        {job.status.replace(/_/g, " ")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Dashboard;
