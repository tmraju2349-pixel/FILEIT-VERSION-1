import { Layout } from "@/components/layout";
import {
  useListFiles,
  useDeleteFile,
  useMoveFile,
  useListFolders,
  useCreateFolder,
  useDeleteFolder,
  useListTextMessages,
  useCreateTextMessage,
  useDeleteTextMessage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { FileCard, FileCardSkeleton } from "@/components/file-card";
import { FolderCard } from "@/components/folder-card";
import { FolderShareDialog } from "@/components/folder-share-dialog";
import { TextMessageCard } from "@/components/text-message-card";
import { Dropzone } from "@/components/dropzone";
import { useUpload } from "@/hooks/use-upload";
import { motion, AnimatePresence } from "framer-motion";
import { Files, Folder, ArrowLeft, Plus, Trash2, FileCode2, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function FilesPage() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [fileToMove, setFileToMove] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [textMessageOpen, setTextMessageOpen] = useState(false);
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [textLanguage, setTextLanguage] = useState("plaintext");
  const [textFolderId, setTextFolderId] = useState("");
  const [linkedFileId, setLinkedFileId] = useState("");
  const [folderToShare, setFolderToShare] = useState<string | null>(null);

  const { data: files, isLoading } = useListFiles(
    currentFolderId ? { folderId: currentFolderId } : undefined
  );
  const { data: allFiles } = useListFiles();
  const { data: folders } = useListFolders();
  const { data: textMessages } = useListTextMessages(
    currentFolderId ? { folderId: currentFolderId } : undefined,
  );
  const { uploadFile, isUploading, progress } = useUpload();
  const moveFile = useMoveFile();
  const deleteFile = useDeleteFile();
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const createTextMessage = useCreateTextMessage();
  const deleteTextMessage = useDeleteTextMessage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentFolder = folders?.find((f) => f.id === currentFolderId);

  // Listen for drag-and-drop moves from FileCard onto FolderCard
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { fileId: string; folderId: string };
      if (detail?.fileId && detail?.folderId) {
        handleMoveToFolder(detail.fileId, detail.folderId);
      }
    };
    window.addEventListener("file-drop-to-folder", handler);
    return () => window.removeEventListener("file-drop-to-folder", handler);
  }, []);

  const handleMoveToFolder = async (fileId: string, targetFolderId: string) => {
    try {
      await moveFile.mutateAsync({
        id: fileId,
        data: { folderId: targetFolderId === "root" ? null : targetFolderId },
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({ title: "File moved to folder" });
    } catch {
      toast({ variant: "destructive", title: "Failed to move file" });
    }
  };

  const handleFileSelect = async (file: File) => {
    await uploadFile(file, currentFolderId || undefined);
    queryClient.invalidateQueries({ queryKey: ["/api/files"] });
  };

  const handleMove = async (targetFolderId: string) => {
    if (!fileToMove) return;
    await handleMoveToFolder(fileToMove, targetFolderId);
    setFileToMove(null);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    try {
      await deleteFile.mutateAsync({ id: fileToDelete });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files/stats"] });
      toast({ title: "File deleted" });
    } catch {
      toast({ variant: "destructive", title: "Failed to delete" });
    } finally {
      setFileToDelete(null);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder.mutateAsync({ data: { name: newFolderName.trim() } });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({ title: "Folder created" });
      setNewFolderName("");
      setCreateFolderOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Failed to create folder" });
    }
  };

  const resetTextMessageForm = () => {
    setTextTitle("");
    setTextContent("");
    setTextLanguage("plaintext");
    setTextFolderId(currentFolderId || "");
    setLinkedFileId("");
  };

  const openTextMessageDialog = () => {
    resetTextMessageForm();
    setTextMessageOpen(true);
  };

  const handleCreateTextMessage = async () => {
    if (!textContent) return;
    try {
      await createTextMessage.mutateAsync({
        data: {
          content: textContent,
          title: textTitle.trim() || undefined,
          language: textLanguage,
          fileId: linkedFileId || null,
          folderId: textFolderId || null,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["/api/text-messages"] });
      toast({ title: "Text message saved" });
      setTextMessageOpen(false);
      resetTextMessageForm();
    } catch {
      toast({ variant: "destructive", title: "Failed to save text message" });
    }
  };

  const handleDeleteTextMessage = async (id: string) => {
    try {
      await deleteTextMessage.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["/api/text-messages"] });
      toast({ title: "Text message deleted" });
    } catch {
      toast({ variant: "destructive", title: "Failed to delete text message" });
    }
  };

  const handleDeleteFolderConfirm = async () => {
    if (!folderToDelete) return;
    try {
      await deleteFolder.mutateAsync({ id: folderToDelete });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "Folder deleted" });
      if (folderToDelete === currentFolderId) setCurrentFolderId(null);
    } catch {
      toast({ variant: "destructive", title: "Failed to delete folder" });
    } finally {
      setFolderToDelete(null);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentFolderId ? (
              <button
                onClick={() => setCurrentFolderId(null)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : null}
            <div className="flex items-center gap-2">
              {currentFolderId ? (
                <Folder className="w-5 h-5 text-amber-500" />
              ) : (
                <Files className="w-5 h-5 text-primary" />
              )}
              <h1 className="text-2xl font-bold">
                {currentFolder ? currentFolder.name : "My Files"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentFolder && (
              <Button variant="outline" size="sm" onClick={() => setFolderToShare(currentFolder.id)} className="gap-2">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={openTextMessageDialog} className="gap-2">
              <FileCode2 className="w-4 h-4" />
              <span className="hidden sm:inline">New text</span>
            </Button>
            {!currentFolderId && (
              <Button variant="outline" size="sm" onClick={() => setCreateFolderOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New folder</span>
              </Button>
            )}
          </div>
        </div>

        {/* Dropzone */}
        <Dropzone onFileSelect={handleFileSelect} isUploading={isUploading} progress={progress} />

        {/* Folders (only at root) */}
        {!currentFolderId && folders && folders.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Folders
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {folders.map((folder, i) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onClick={() => setCurrentFolderId(folder.id)}
                  onDelete={() => setFolderToDelete(folder.id)}
                  onShare={() => setFolderToShare(folder.id)}
                  fileCount={folder.fileCount}
                  index={i}
                />
              ))}
            </div>
          </section>
        )}

        {/* Files */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {currentFolderId ? "Files in folder" : "All files"}
          </h2>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <FileCardSkeleton key={i} />
              ))}
            </div>
          ) : !files || files.length === 0 ? (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center gap-3"
              >
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                  <Files className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No files here yet</p>
                <p className="text-sm text-muted-foreground">
                  {currentFolderId
                    ? "Drop a file above to add it to this folder."
                    : "Upload a file above to get started."}
                </p>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onDelete={setFileToDelete}
                  onMove={setFileToMove}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <FileCode2 className="w-4 h-4" />
            {currentFolderId ? "Text & code in folder" : "Text & code"}
          </h2>
          {textMessages && textMessages.length > 0 ? (
            <div className="space-y-3">
              {textMessages.map((message) => (
                <TextMessageCard key={message.id} message={message} onDelete={handleDeleteTextMessage} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">No text messages here yet.</p>
              <Button variant="link" size="sm" onClick={openTextMessageDialog}>Create one</Button>
            </div>
          )}
        </section>
      </div>

      <FolderShareDialog
        folder={folders?.find((folder) => folder.id === folderToShare) || null}
        open={!!folderToShare}
        onOpenChange={(open) => !open && setFolderToShare(null)}
      />

      {/* Move file dialog */}
      <Dialog open={!!fileToMove} onOpenChange={(open) => !open && setFileToMove(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Move file</DialogTitle>
            <DialogDescription>Select a destination folder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1 max-h-60 overflow-y-auto py-1">
            <button
              onClick={() => handleMove("root")}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-secondary"
            >
              My Files (no folder)
            </button>
            {folders?.map((f) => (
              <button
                key={f.id}
                onClick={() => handleMove(f.id)}
                disabled={f.id === currentFolderId}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  f.id === currentFolderId
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-secondary"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFileToMove(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete file dialog */}
      <Dialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete file?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete the file.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFileToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete folder dialog */}
      <Dialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete folder?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The folder will be deleted. Files inside will be moved back to My Files.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFolderToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFolderConfirm}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create folder dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={textMessageOpen} onOpenChange={setTextMessageOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New text or code</DialogTitle>
            <DialogDescription>
              Whitespace, indentation, symbols, and line breaks are preserved exactly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                placeholder="Title (optional)"
                value={textTitle}
                onChange={(event) => setTextTitle(event.target.value)}
              />
              <select
                value={textLanguage}
                onChange={(event) => setTextLanguage(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Language"
              >
                <option value="plaintext">Plain text</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="json">JSON</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="sql">SQL</option>
                <option value="markdown">Markdown</option>
                <option value="bash">Bash</option>
              </select>
            </div>
            <Textarea
              value={textContent}
              onChange={(event) => setTextContent(event.target.value)}
              placeholder="Paste or type your text here..."
              className="min-h-[260px] resize-y font-mono text-sm leading-6"
              spellCheck={false}
              autoFocus
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span className="font-medium">Folder</span>
                <select
                  value={textFolderId}
                  onChange={(event) => setTextFolderId(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">My Files (no folder)</option>
                  {folders?.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium">Link to a file <span className="font-normal text-muted-foreground">(optional)</span></span>
                <select
                  value={linkedFileId}
                  onChange={(event) => setLinkedFileId(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">No linked file</option>
                  {allFiles?.map((file) => <option key={file.id} value={file.id}>{file.originalName}</option>)}
                </select>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTextMessageOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTextMessage} disabled={!textContent || createTextMessage.isPending}>
              {createTextMessage.isPending ? "Saving..." : "Save text"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
