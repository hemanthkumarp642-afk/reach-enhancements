import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Download, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { AddResumeDialog } from "@/components/resumes/AddResumeDialog";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";

const Resumes = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadResumes(); }, []);

  const loadResumes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("resumes").select("*").eq("user_id", user.id).order("last_updated", { ascending: false });
    setResumes(data || []);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { draft: "secondary", active: "default", archived: "outline" };
    return colors[status] || "default";
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from("resumes").download(filePath);
    if (error || !data) { toast.error("Failed to download file"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleView = async (filePath: string) => {
    const { data, error } = await supabase.storage.from("resumes").createSignedUrl(filePath, 300);
    if (error || !data?.signedUrl) { toast.error("Failed to open file"); return; }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <AuthGuard>
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Resume Manager</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">Track and manage your resume versions</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="sm" className="shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Add Resume
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => (
              <Card key={i}>
                <CardHeader className="pb-3"><Skeleton className="h-5 w-32 mb-1" /><Skeleton className="h-3 w-20" /></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-3 w-20" /></div>
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-muted mb-4">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            </div>
            <p className="text-sm sm:text-base font-medium text-foreground mb-1">No resumes yet</p>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mb-4">Keep track of different resume versions tailored for specific roles.</p>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1 h-3 w-3" /> Add Resume
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume) => (
              <Card key={resume.id} className="hover:shadow-md transition-shadow flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm sm:text-base truncate">{resume.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">Version {resume.version}</p>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <Badge variant={getStatusColor(resume.status) as any} className="text-xs">{resume.status}</Badge>
                    <span className="text-xs text-muted-foreground tabular-nums">Used {resume.usage_count} times</span>
                  </div>
                  {resume.tailored_for && (
                    <p className="text-xs sm:text-sm"><span className="text-muted-foreground">Tailored for: </span>{resume.tailored_for}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Updated: {format(new Date(resume.last_updated), "MMM d, yyyy")}</p>
                  {resume.notes && <p className="text-xs text-muted-foreground line-clamp-2">{resume.notes}</p>}

                  {/* File actions */}
                  {resume.file_path && (
                    <div className="flex items-center gap-2 pt-2 mt-auto border-t">
                      <p className="text-xs text-muted-foreground truncate flex-1 flex items-center gap-1">
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="truncate">{resume.file_name || "Resume.pdf"}</span>
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => handleView(resume.file_path)}
                        aria-label="View PDF"
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => handleDownload(resume.file_path, resume.file_name || "resume.pdf")}
                        aria-label="Download PDF"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddResumeDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={loadResumes} />
      </div>
    </AuthGuard>
  );
};

export default Resumes;
