import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { AddRevisionDialog } from "@/components/revisions/AddRevisionDialog";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const Revisions = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRevisions(); }, []);

  const loadRevisions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("revisions").select("*").eq("user_id", user.id).order("next_revision", { ascending: true });
    setRevisions(data || []);
    setLoading(false);
  };

  return (
    <AuthGuard>
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Study & Revision Tracker</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">Master your subjects with spaced repetition</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="sm" className="shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Add Topic
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => (
              <Card key={i}>
                <CardHeader><Skeleton className="h-5 w-32 mb-1" /><Skeleton className="h-3 w-20" /></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-3 w-24" /></div>
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : revisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">No revision topics yet</p>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">Track what you're studying and schedule spaced repetition reviews.</p>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1 h-3 w-3" /> Add Topic
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {revisions.map((revision) => (
              <Card key={revision.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{revision.topic}</CardTitle>
                  <p className="text-xs text-muted-foreground">{revision.subject}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={revision.priority === "high" ? "destructive" : revision.priority === "medium" ? "default" : "secondary"} className="text-xs">
                      {revision.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground tabular-nums">Revised {revision.times_revised} times</span>
                  </div>
                  <p className="text-sm"><span className="text-muted-foreground">Next: </span>{format(new Date(revision.next_revision), "MMM d, yyyy")}</p>
                  {revision.last_revised && <p className="text-xs text-muted-foreground">Last: {format(new Date(revision.last_revised), "MMM d, yyyy")}</p>}
                  {revision.notes && <p className="text-xs text-muted-foreground line-clamp-2">{revision.notes}</p>}
                  {/* Resource Link */}
                  <div className="pt-1">
                    {revision.link ? (
                      <a
                        href={revision.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-xs inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> View
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddRevisionDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={loadRevisions} />
      </div>
    </AuthGuard>
  );
};

export default Revisions;
