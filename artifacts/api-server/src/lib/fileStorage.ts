import {
  createSupabaseUploadUrl,
  deleteFromSupabase,
  getSupabaseFileStream,
  serveFromSupabase,
  uploadToSupabase,
} from "./supabaseStorage";

export function generateStoragePath(originalName: string): string {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  const ext = originalName.lastIndexOf(".") > 0
    ? originalName.slice(originalName.lastIndexOf("."))
    : "";
  const base = originalName
    .slice(0, originalName.lastIndexOf(".") > 0 ? originalName.lastIndexOf(".") : originalName.length)
    .replace(/[^a-zA-Z0-9_.-]/g, "_")
    .slice(0, 60);
  return `uploads/${timestamp}-${rand}-${base}${ext}`;
}

export async function uploadFile(buffer: Buffer, storagePath: string, contentType: string): Promise<void> {
  await uploadToSupabase(buffer, storagePath, contentType);
}

export async function fileExists(storagePath: string): Promise<boolean> {
  try {
    await getSupabaseFileStream(storagePath);
    return true;
  } catch {
    return false;
  }
}

export async function serveFile(storagePath: string, res: import("express").Response): Promise<void> {
  await serveFromSupabase(storagePath, res);
}

export async function getStoredFileStream(storagePath: string): Promise<{
  stream: NodeJS.ReadableStream;
  size: number;
  contentType: string;
}> {
  return getSupabaseFileStream(storagePath);
}

export async function deleteFile(storagePath: string): Promise<void> {
  await deleteFromSupabase(storagePath);
}

export async function createUploadUrl(storagePath: string): Promise<{ token: string }> {
  return createSupabaseUploadUrl(storagePath);
}
