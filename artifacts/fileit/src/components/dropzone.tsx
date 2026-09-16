import { useState, useCallback } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  progress?: number;
}

export function Dropzone({ onFileSelect, isUploading, progress = 0 }: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFileSelect(e.dataTransfer.files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileSelect(e.target.files[0]);
      }
    },
    [onFileSelect]
  );

  return (
    <motion.div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      animate={
        isDragActive
          ? { scale: 1.03, boxShadow: "0 0 0 3px hsl(var(--primary)/0.4)" }
          : { scale: 1, boxShadow: "0 0 0 0px transparent" }
      }
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "relative group flex flex-col items-center justify-center w-full min-h-[300px] border-2 border-dashed rounded-2xl p-12 text-center transition-colors duration-300 bg-card overflow-hidden",
        isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/50",
        isUploading && "pointer-events-none"
      )}
    >
      <motion.div
        className="absolute inset-0 bg-primary/5 rounded-2xl pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isDragActive ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <input
        type="file"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={isUploading}
      />

      <AnimatePresence mode="wait">
        {isUploading ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                <motion.circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 34}
                  animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - progress / 100) }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  className="text-sm font-bold text-primary"
                  key={progress}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                >
                  {progress}%
                </motion.span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-lg">Uploading…</p>
              <p className="text-sm text-muted-foreground">Please keep this tab open</p>
            </div>
            <div className="w-48 h-1.5 bg-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              animate={isDragActive ? { scale: 1.15, rotate: -5 } : { scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className={cn(
                "p-4 rounded-full transition-colors duration-300",
                isDragActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}
            >
              <UploadCloud className="w-9 h-9" />
            </motion.div>
            <div className="space-y-1">
              <p className="font-semibold text-lg text-foreground">
                {isDragActive ? "Drop to upload" : "Click to upload or drag and drop"}
              </p>
              <p className="text-sm text-muted-foreground">
                Any file type, up to 500 MB. Stored securely on this server.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
