import { useRoute, useLocation } from "wouter";
import {
  useGetFile,
  getGetFileQueryKey,
  useListTextMessages,
  getListTextMessagesQueryKey,
} from "@workspace/api-client-react";
import { getFileDownloadUrl, getFileUrl } from "@/lib/storage";
import { formatBytes } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Download,
  ExternalLink,
  Copy,
  AlertCircle,
  Loader2,
  File as FileIcon,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TextMessageCard } from "@/components/text-message-card";
import { useState, useEffect } from "react";

function getViewerType(
  mimeType: string
): "image" | "pdf" | "video" | "audio" | "text" | "docx" | "xlsx" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  )
    return "docx";
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  )
    return "xlsx";
  if (
    mimeType.startsWith("text/") ||
    mimeType.includes("javascript") ||
    mimeType.includes("json") ||
    mimeType.includes("xml") ||
    mimeType.includes("css") ||
    mimeType.includes("html") ||
    mimeType === "application/x-sh"
  )
    return "text";
  return "other";
}

function FilePreview({ publicUrl, mimeType }: { publicUrl: string; mimeType: string }) {
  const type = getViewerType(mimeType);
  switch (type) {
    case "image":
      return (
        <div className="flex items-center justify-center bg-black rounded-2xl overflow-hidden">
          <img src={publicUrl} alt="Preview" className="max-w-full max-h-[70vh] object-contain" />
        </div>
      );
    case "pdf":
      return (
        <iframe
          src={publicUrl}
          className="w-full h-[70vh] rounded-2xl border border-border"
          title="PDF preview"
        />
      );
    case "video":
      return (
        <div className="flex items-center justify-center bg-black rounded-2xl overflow-hidden">
          <video src={publicUrl} controls className="max-w-full max-h-[70vh]" />
        </div>
      );
    case "audio":
      return (
        <div className="flex items-center justify-center p-12 bg-card rounded-2xl border border-border">
          <audio src={publicUrl} controls className="w-full" />
        </div>
      );
    case "text":
      return <TextPreview url={publicUrl} />;
    case "docx":
      return <DocxPreview url={publicUrl} />;
    case "xlsx":
      return <XlsxPreview url={publicUrl} />;
    default:
      return (
        <div className="flex flex-col items-center justify-center p-16 bg-card rounded-2xl border border-border text-center gap-4">
          <FileIcon className="w-16 h-16 text-muted-foreground" />
          <p className="text-muted-foreground">This file type cannot be previewed in the browser.</p>
          <p className="text-sm text-muted-foreground">Use the download button to open it.</p>
        </div>
      );
  }
}

function TextPreview({ url }: { url: string }) {
  const [content, setContent] = useState<string>("Loading…");
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch(url)
      .then((r) => r.text())
      .then((t) => setContent(t))
      .catch(() => setError(true));
  }, [url]);
  if (error) {
    return (
      <div className="p-12 bg-card rounded-2xl border border-border text-center text-muted-foreground">
        Could not load text preview.
      </div>
    );
  }
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
        <span className="text-xs font-mono text-muted-foreground">Text preview</span>
      </div>
      <pre className="p-4 overflow-auto max-h-[70vh] text-sm font-mono text-foreground whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
}

function DocxPreview({ url }: { url: string }) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(url).then((r) => r.arrayBuffer()),
      import("mammoth"),
    ])
      .then(([buffer, mammoth]) => mammoth.convertToHtml({ arrayBuffer: buffer }))
      .then((result) => {
        if (!cancelled) {
          setHtml(result.value);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="p-12 bg-card rounded-2xl border border-border text-center text-muted-foreground">
        Loading Word preview…
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-12 bg-card rounded-2xl border border-border text-center text-muted-foreground">
        Could not load Word preview.
      </div>
    );
  }
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
        <span className="text-xs font-mono text-muted-foreground">Word preview</span>
      </div>
      <div
        className="p-6 overflow-auto max-h-[70vh] prose dark:prose-invert prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function XlsxPreview({ url }: { url: string }) {
  const [rows, setRows] = useState<unknown[][]>([]);
  const [sheetName, setSheetName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(url).then((r) => r.arrayBuffer()),
      import("xlsx"),
    ])
      .then(([buffer, XLSX]) => {
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        if (!cancelled) {
          setSheetName(firstSheet);
          setRows(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="p-12 bg-card rounded-2xl border border-border text-center text-muted-foreground">
        Loading Excel preview…
      </div>
    );
  }
  if (error || rows.length === 0) {
    return (
      <div className="p-12 bg-card rounded-2xl border border-border text-center text-muted-foreground">
        Could not load Excel preview.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
        <span className="text-xs font-mono text-muted-foreground">
          Excel preview: {sheetName}
        </span>
      </div>
      <div className="overflow-auto max-h-[70vh]">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-muted-foreground font-semibold sticky top-0">
            <tr>
              {rows[0]?.map((cell, i) => (
                <th key={i} className="px-3 py-2 border-b border-border whitespace-nowrap">
                  {String(cell ?? "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border last:border-0">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2 whitespace-nowrap">
                    {String(cell ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ViewPage() {
  const [, params] = useRoute("/view/:id");
  const fileId = params?.id;
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: file, isLoading, isError } = useGetFile(fileId || "", {
    query: {
      enabled: !!fileId,
      queryKey: getGetFileQueryKey(fileId || ""),
      retry: false,
    },
  });

  const publicUrl = file ? getFileUrl(file.storagePath) : "";
  const shareUrl = file ? `${window.location.origin}/share/${file.shareToken}` : "";
  const { data: linkedMessages } = useListTextMessages(file ? { fileId: file.id } : undefined, {
    query: {
      enabled: !!file,
      queryKey: getListTextMessagesQueryKey(file ? { fileId: file.id } : undefined),
    },
  });

  const handleDownload = () => {
    if (!file) return;
    const link = document.createElement("a");
    link.href = getFileDownloadUrl(file.storagePath);
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Share link copied!" });
    } catch {
      toast({ variant: "destructive", title: "Failed to copy" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isError || !file) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-card p-8 rounded-2xl border border-border">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">File not found</h1>
          <Button variant="outline" onClick={() => navigate("/files")}>
            Back to My Files
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3 max-w-5xl">
          <button
            onClick={() => navigate("/files")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate text-sm">{file.originalName}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)} &bull;{" "}
              {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="hidden sm:inline-flex">
              <Copy className="w-4 h-4 mr-2" />
              Copy link
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(shareUrl, "_blank")} className="hidden sm:inline-flex">
              <ExternalLink className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <FilePreview publicUrl={publicUrl} mimeType={file.mimeType} />
        {linkedMessages && linkedMessages.length > 0 && (
          <section className="mt-8 space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Text & code messages
            </h2>
            <div className="space-y-3">
              {linkedMessages.map((message) => (
                <TextMessageCard key={message.id} message={message} showDelete={false} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
