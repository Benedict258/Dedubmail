import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { dedupeFiles, type DedupResult } from "@/lib/email-dedup";
import { Download, FileText, Loader2, Trash2, Upload, Sparkles, FileSpreadsheet, FileType2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED = ".txt,.csv,.xlsx,.xls";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(name: string) {
  const n = name.toLowerCase();
  if (n.endsWith(".xlsx") || n.endsWith(".xls")) return FileSpreadsheet;
  if (n.endsWith(".csv")) return FileType2;
  return FileText;
}

const Index = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DedupResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const allowed = [".txt", ".csv", ".xlsx", ".xls"];
    const filtered = Array.from(incoming).filter((f) =>
      allowed.some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    if (filtered.length === 0) {
      toast({ title: "Unsupported file type", description: "Please upload .txt, .csv, or .xlsx files." });
      return;
    }
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...filtered.filter((f) => !seen.has(f.name + f.size))];
    });
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const clearAll = () => {
    setFiles([]);
    setResult(null);
    setProgress(0);
  };

  const process = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setResult(null);
    setProgress(0);
    try {
      // Process file-by-file so we can show progress without loading everything at once.
      const merged: DedupResult = { unique: [], total: 0, duplicates: 0, perFile: [] };
      const seen = new Set<string>();
      for (let i = 0; i < files.length; i++) {
        const single = await dedupeFiles([files[i]]);
        merged.perFile.push(...single.perFile);
        merged.total += single.total;
        for (const e of single.unique) {
          if (!seen.has(e)) {
            seen.add(e);
            merged.unique.push(e);
          }
        }
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      merged.duplicates = merged.total - merged.unique.length;
      setResult(merged);
      toast({ title: "Done!", description: `${merged.unique.length.toLocaleString()} unique emails extracted.` });
    } catch (err) {
      console.error(err);
      toast({ title: "Processing failed", description: String(err) });
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.unique.join("\n") + "\n"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unique-emails-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewText = useMemo(() => {
    if (!result) return "";
    const head = result.unique.slice(0, 200).join("\n");
    return result.unique.length > 200 ? `${head}\n… (${(result.unique.length - 200).toLocaleString()} more)` : head;
  }, [result]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-12">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            Fast • Private • Runs in your browser
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Email List Deduplicator
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Upload multiple .txt, .csv, or .xlsx files and get a single clean list of unique emails.
            Duplicates are removed using exact case-sensitive matching, and original order is preserved.
          </p>
        </header>

        {/* Upload zone */}
        <Card
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "group relative cursor-pointer overflow-hidden border-2 border-dashed p-10 text-center transition-all",
            "hover:border-brand hover:shadow-[var(--shadow-elegant)]",
            dragOver ? "border-brand bg-brand/5 scale-[1.01]" : "border-border bg-card"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-[var(--shadow-elegant)]">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            Drop files here or click to browse
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Supports .txt, .csv, .xlsx — one email per line
          </p>
        </Card>

        {/* File list */}
        {files.length > 0 && (
          <Card className="mt-6 p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {files.length} file{files.length > 1 ? "s" : ""} ready
              </h2>
              <Button variant="ghost" size="sm" onClick={clearAll} disabled={processing}>
                <Trash2 className="mr-1 h-4 w-4" /> Clear all
              </Button>
            </div>
            <ul className="divide-y divide-border">
              {files.map((f, i) => {
                const Icon = fileIcon(f.name);
                const stat = result?.perFile[i];
                return (
                  <li key={f.name + i} className="flex items-center justify-between py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-brand">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{f.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(f.size)}
                          {stat && ` • ${stat.count.toLocaleString()} entries`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(i)}
                      disabled={processing}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Order policy: <span className="font-medium text-foreground">first occurrence preserved</span> • Match: <span className="font-medium text-foreground">exact, case-sensitive</span>
              </p>
              <Button onClick={process} disabled={processing} size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
                {processing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
                ) : (
                  <>Process Files</>
                )}
              </Button>
            </div>

            {processing && <Progress value={progress} className="mt-4" />}
          </Card>
        )}

        {/* Results */}
        {result && (
          <Card className="mt-6 overflow-hidden shadow-[var(--shadow-card)]">
            <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-3">
              <Stat label="Total processed" value={result.total} tone="default" />
              <Stat label="Duplicates removed" value={result.duplicates} tone="warning" />
              <Stat label="Unique emails" value={result.unique.length} tone="success" />
            </div>

            <div className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Preview</h3>
                <Button onClick={download} className="bg-brand text-brand-foreground hover:bg-brand/90">
                  <Download className="mr-2 h-4 w-4" />
                  Download .txt
                </Button>
              </div>
              <ScrollArea className="h-72 rounded-lg border border-border bg-secondary/40 p-4">
                <pre className="font-mono text-xs leading-relaxed text-foreground">{previewText || "No emails found."}</pre>
              </ScrollArea>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

function Stat({ label, value, tone }: { label: string; value: number; tone: "default" | "success" | "warning" }) {
  const color =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="bg-card p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold tabular-nums", color)}>{value.toLocaleString()}</p>
    </div>
  );
}

export default Index;
