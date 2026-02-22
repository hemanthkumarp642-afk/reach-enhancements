import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ExternalLink, Search, Pencil, Trash2, ArrowUpDown, Bell, Briefcase, Filter } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { AddJobDialog } from "@/components/jobs/AddJobDialog";
import { EditJobDialog } from "@/components/jobs/EditJobDialog";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, isToday } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  applied: { label: "Applied", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  interview_scheduled: { label: "Interview", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  interview_done: { label: "Interviewed", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  offer: { label: "Offer", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
};

const Jobs = () => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<"applied_date" | "company" | "status">("applied_date");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("job_applications").select("*").eq("user_id", user.id).order("applied_date", { ascending: false });
    setJobs(data || []);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedJob) return;
    const { error } = await supabase.from("job_applications").delete().eq("id", selectedJob.id);
    if (error) { toast.error("Failed to delete application."); }
    else { toast.success("Application deleted."); loadJobs(); }
    setDeleteDialogOpen(false);
    setSelectedJob(null);
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const filtered = useMemo(() => {
    let result = [...jobs];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j => j.company.toLowerCase().includes(q) || j.position.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") result = result.filter(j => j.status === statusFilter);
    result.sort((a, b) => {
      const valA = a[sortField] || "";
      const valB = b[sortField] || "";
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    return result;
  }, [jobs, searchQuery, statusFilter, sortField, sortAsc]);

  const hasReminder = (job: any) => {
    if (!job.deadline) return false;
    const d = new Date(job.deadline);
    return isToday(d) || (isPast(d) && !["rejected", "withdrawn", "offer"].includes(job.status));
  };

  const SortableHead = ({ field, children }: { field: typeof sortField; children: React.ReactNode }) => (
    <TableHead>
      <button
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
        aria-label={`Sort by ${children}`}
      >
        {children} <ArrowUpDown className="h-3 w-3 opacity-50" />
      </button>
    </TableHead>
  );

  return (
    <AuthGuard>
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Job Tracker</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">Track and manage all your job applications</p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} size="sm" className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Add Application
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search company or role..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" aria-label="Search job applications" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm" aria-label="Filter by status">
              <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-muted mb-4">
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            </div>
            {jobs.length === 0 ? (
              <>
                <p className="text-sm sm:text-base font-medium text-foreground mb-1">No applications yet</p>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mb-4">Start tracking your job search by adding your first application.</p>
                <Button onClick={() => setAddDialogOpen(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Application
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm sm:text-base font-medium text-foreground mb-1">No results found</p>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">Try adjusting your search or filter to find what you're looking for.</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Mobile/tablet card view */}
            <div className="space-y-2 sm:space-y-3 lg:hidden">
              {filtered.map((job) => {
                const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.applied;
                const reminder = hasReminder(job);
                return (
                  <div key={job.id} className={`rounded-lg border p-3 bg-card space-y-2 ${reminder ? "border-amber-300 dark:border-amber-700" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{job.position}</p>
                        <p className="text-xs text-muted-foreground truncate">{job.company}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{job.applied_date ? format(new Date(job.applied_date), "MMM d, yy") : "—"}</span>
                      {job.deadline && reminder && (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                          <Bell className="h-3 w-3" /> {format(new Date(job.deadline), "MMM d")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t">
                      <div className="flex items-center gap-2">
                        {job.job_url && (
                          <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs inline-flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> Link
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedJob(job); setEditDialogOpen(true); }} aria-label={`Edit ${job.position}`}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setSelectedJob(job); setDeleteDialogOpen(true); }} aria-label={`Delete ${job.position}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table view */}
            <div className="rounded-lg border hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead field="company">Company</SortableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Link</TableHead>
                    <SortableHead field="applied_date">Applied</SortableHead>
                    <TableHead>Reminder</TableHead>
                    <SortableHead field="status">Status</SortableHead>
                    <TableHead className="hidden xl:table-cell">Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((job) => {
                    const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.applied;
                    const reminder = hasReminder(job);
                    return (
                      <TableRow key={job.id} className={reminder ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}>
                        <TableCell className="font-medium">{job.company}</TableCell>
                        <TableCell>{job.position}</TableCell>
                        <TableCell>
                          {job.job_url ? (
                            <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-sm" aria-label={`Open job listing for ${job.position} at ${job.company}`}>
                              <ExternalLink className="h-3.5 w-3.5" /> View
                            </a>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">{job.applied_date ? format(new Date(job.applied_date), "MMM d, yy") : "—"}</TableCell>
                        <TableCell>
                          {job.deadline ? (
                            <span className={`inline-flex items-center gap-1 text-sm ${reminder ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}`}>
                              {reminder && <Bell className="h-3.5 w-3.5" />}
                              {format(new Date(job.deadline), "MMM d, yy")}
                            </span>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell max-w-[200px] truncate text-sm text-muted-foreground">{job.notes || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedJob(job); setEditDialogOpen(true); }} aria-label={`Edit ${job.position} at ${job.company}`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setSelectedJob(job); setDeleteDialogOpen(true); }} aria-label={`Delete ${job.position} at ${job.company}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* Result count */}
        {!loading && jobs.length > 0 && (
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Showing {filtered.length} of {jobs.length} application{jobs.length !== 1 ? "s" : ""}
          </p>
        )}

        <AddJobDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSuccess={loadJobs} />
        {selectedJob && <EditJobDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} onSuccess={loadJobs} job={selectedJob} />}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Application</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the application for <strong>{selectedJob?.position}</strong> at <strong>{selectedJob?.company}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthGuard>
  );
};

export default Jobs;
