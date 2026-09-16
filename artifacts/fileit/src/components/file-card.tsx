import { File as FileIcon, MoreVertical, Copy, Trash2, Download, ExternalLink, Eye, FolderInput } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { getFileDownloadUrl } from "@/lib/storage";
import { formatDistanceToNow } from "date-fns";
import type { FileRecord } from "@workspace/api-client-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";

interface FileCardProps {
  file: FileRecord;
  onDelete?: (id: string) => void;
  onMove?: (id: string) => void;
  showActions?: boolean;
  index?: number;
}

export function FileCard({ file, onDelete, onMove, showActions = true }: FileCardProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const shareUrl = `${window.location.origin}/share/${file.shareToken}`;
  const [isDragging, setIsDragging] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied", description: "Share link copied to clipboard." });
    } catch {
      toast({ variant: "destructive", title: "Failed to copy" });
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = getFileDownloadUrl(file.storagePath);
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData("fileId", file.id);
    e.dataTransfer.setData("fileName", file.originalName);
    e.dataTransfer.effectAllowed = "move";
    const ghost = document.createElement("div");
    ghost.textContent = file.originalName;
    ghost.className =
      "bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold shadow-lg pointer-events-none";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 20);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragEnd = () => setIsDragging(false);

  return (
    <div
      draggable={!!onMove}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group flex items-center justify-between p-3 md:p-4 rounded-xl border bg-card hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-colors gap-3 ${
        onMove ? "cursor-move" : ""
      } ${isDragging ? "border-primary/60 shadow-md shadow-primary/10 opacity-40" : "border-border"}`}
    >
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        <motion.div
          whileHover={{ scale: 1.1, rotate: -4 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
        >
          <FileIcon className="w-4 h-4 md:w-5 md:h-5" />
        </motion.div>
        <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
          <p className="text-sm font-semibold truncate text-foreground" title={file.originalName}>
            {file.originalName}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
            <span className="shrink-0">{formatBytes(file.size)}</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline">
              {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
            </span>
            {file.downloadCount !== undefined && (
              <>
                <span className="hidden sm:inline">&bull;</span>
                <span className="hidden sm:inline">
                  {file.downloadCount} {file.downloadCount === 1 ? "download" : "downloads"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {showActions && (
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => setLocation(`/view/${file.id}`)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setLocation(`/view/${file.id}`)}
                className="sm:hidden"
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload} className="sm:hidden">
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyLink}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(shareUrl, "_blank")}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Share Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload} className="hidden sm:flex">
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              {onMove && (
                <DropdownMenuItem onClick={() => onMove(file.id)}>
                  <FolderInput className="w-4 h-4 mr-2" />
                  Move to folder
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(file.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete File
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

export function FileCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-4 w-full">
        <div className="w-10 h-10 shrink-0 rounded-lg bg-muted animate-pulse" />
        <div className="flex flex-col gap-2 w-full max-w-[200px]">
          <div className="h-4 bg-muted rounded animate-pulse w-full" />
          <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
        </div>
      </div>
    </div>
  );
}
