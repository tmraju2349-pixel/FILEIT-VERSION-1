import { Folder, Share2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { FolderRecord } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface FolderCardProps {
  folder: FolderRecord;
  onClick: () => void;
  onDelete: () => void;
  onShare: () => void;
  fileCount?: number;
  index?: number;
}

export function FolderCard({ folder, onClick, onDelete, onShare, fileCount, index = 0 }: FolderCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const fileId = e.dataTransfer.getData("fileId");
    if (fileId) {
      // dispatch a custom event so the parent can handle the move
      const event = new CustomEvent("file-drop-to-folder", {
        detail: { fileId, folderId: folder.id },
        bubbles: true,
      });
      e.currentTarget.dispatchEvent(event);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative flex items-center gap-3 p-4 rounded-xl border bg-card cursor-pointer transition-colors ${
        isDragOver
          ? "border-primary border-dashed ring-2 ring-primary/20 bg-primary/5"
          : "border-border hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
      }`}
    >
      <div className="w-10 h-10 shrink-0 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
        <Folder className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate text-foreground" title={folder.name}>
          {folder.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {fileCount !== undefined ? (
            <>
              {fileCount} {fileCount === 1 ? "file" : "files"}
            </>
          ) : (
            <span>Folder</span>
          )}
          <span className="mx-1.5">&bull;</span>
          {formatDistanceToNow(new Date(folder.createdAt), { addSuffix: true })}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShare();
        }}
        className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
        aria-label="Share folder"
      >
        <Share2 className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        aria-label="Delete folder"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
