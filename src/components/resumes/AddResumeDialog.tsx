import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, X } from "lucide-react";

interface AddResumeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function AddResumeDialog({ open, onOpenChange, onSuccess }: AddResumeDialogProps) {
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [status, setStatus] = useState("draft");
  const [tailoredFor, setTailoredFor] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File): boolean => {
    setFileError("");
    if (f.type !== "application/pdf") {
      setFileError("Only PDF files are allowed.");
      return false;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError("File size must be under 5MB.");
      return false;
    }
    return true;
  };

  const handleFileSelect = (f: File) => {
    if (validateFile(f)) {
      setFile(f);
    } else {
      setFile(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let filePath: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;

    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file);
      if (uploadError) {
        toast.error("Failed to upload file");
        setLoading(false);
        return;
      }
      filePath = path;
      fileName = file.name;
      fileSize = file.size;
    }

    const { error } = await supabase.from("resumes").insert({
      user_id: user.id,
      name,
      version,
      status,
      tailored_for: tailoredFor || null,
      notes: notes || null,
      usage_count: 0,
      file_path: filePath,
      file_name: fileName,
      file_size: fileSize,
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to create resume");
    } else {
      toast.success("Resume added successfully");
      setName("");
      setVersion("");
      setStatus("draft");
      setTailoredFor("");
      setNotes("");
      setFile(null);
      setFileError("");
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg">Add Resume Version</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Resume Name/Title</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Software Engineer Resume"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g., 1.0"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tailoredFor">Tailored For (Optional)</Label>
            <Input
              id="tailoredFor"
              value={tailoredFor}
              onChange={(e) => setTailoredFor(e.target.value)}
              placeholder="e.g., Tech Companies, Startups"
            />
          </div>

          {/* PDF Upload */}
          <div className="space-y-1.5">
            <Label>Upload PDF (Optional)</Label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : file
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                  e.target.value = "";
                }}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); setFileError(""); }}
                    className="ml-1 p-0.5 rounded hover:bg-muted"
                    aria-label="Remove file"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-1">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop or <span className="text-primary font-medium">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground">PDF only, max 5MB</p>
                </div>
              )}
            </div>
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes/Key Changes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Uploading..." : "Add Resume"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
