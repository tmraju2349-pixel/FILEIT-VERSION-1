import { objectStorageClient } from "./objectStorage";
import {
  createSupabaseUploadUrl,
  deleteFromSupabase,
  getSupabaseFileStream,
  isSupabaseStorageEnabled,
  serveFromSupabase,
  uploadToSupabase,
} from "./supabaseStorage";

function parsePrivateDir(): { bucketName: string; prefix: string } {
  let dir = process.env.PRIVATE_OBJECT_DIR || "";
  if (!dir) {
    throw new Error(
      "PRIVATE_OBJECT_DIR is not set. Set up Object Storage in the Replit workspace first."
    );
  }
  // Strip optional gs:// prefix
  if (dir.startsWith("gs://")) {
    dir = dir.slice("gs://".length);
  }
  // Ensure leading slash so the path parser can split it
  if (!dir.startsWith("/")) {
    dir = `/${dir}`;
  }
  const parts = dir.split("/").filter(Boolean);
  if (parts.length < 1) {
    throw new Error("Invalid PRIVATE_OBJECT_DIR: missing bucket name");
  }
  const bucketName = parts[0];
  const prefix = parts.slice(1).join("/");
  return { bucketName, prefix };
}

function getBucketAndObjectName(storagePath: string) {
  const { bucketName, prefix } = parsePrivateDir();
  // storagePath is what we store in the DB (e.g. "uploads/1784...-name.pdf")
  const cleanPath = storagePath.replace(/^\/+/, "");
  const objectName = prefix ? `${prefix}/${cleanPath}` : cleanPath;
  return { bucketName, objectName };
}

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
  if (isSupabaseStorageEnabled()) {
    await uploadToSupabase(buffer, storagePath, contentType);
    return;
  }
  const { bucketName, objectName } = getBucketAndObjectName(storagePath);
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  await file.save(buffer, {
    contentType: contentType || "application/octet-stream",
    resumable: false,
  });
}

export async function fileExists(storagePath: string): Promise<boolean> {
  if (isSupabaseStorageEnabled()) {
    try {
      await getSupabaseFileStream(storagePath);
      return true;
    } catch {
      return false;
    }
  }
  const { bucketName, objectName } = getBucketAndObjectName(storagePath);
  const [exists] = await objectStorageClient.bucket(bucketName).file(objectName).exists();
  return exists;
}

export async function serveFile(storagePath: string, res: import("express").Response): Promise<void> {
  if (isSupabaseStorageEnabled()) {
    await serveFromSupabase(storagePath, res);
    return;
  }
  const { bucketName, objectName } = getBucketAndObjectName(storagePath);
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  const [exists] = await file.exists();
  if (!exists) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  const [metadata] = await file.getMetadata();
  res.setHeader("Content-Type", (metadata.contentType as string) || "application/octet-stream");
  if (metadata.size) {
    res.setHeader("Content-Length", String(metadata.size));
  }
  res.setHeader("Cache-Control", "private, max-age=3600");
  file.createReadStream().pipe(res);
}

export async function getStoredFileStream(storagePath: string): Promise<{
  stream: NodeJS.ReadableStream;
  size: number;
  contentType: string;
}> {
  if (isSupabaseStorageEnabled()) {
    return getSupabaseFileStream(storagePath);
  }
  const { bucketName, objectName } = getBucketAndObjectName(storagePath);
  const file = objectStorageClient.bucket(bucketName).file(objectName);
  const [exists] = await file.exists();
  if (!exists) {
    throw new Error("File not found");
  }
  const [metadata] = await file.getMetadata();
  return {
    stream: file.createReadStream(),
    size: Number(metadata.size ?? 0),
    contentType: (metadata.contentType as string) || "application/octet-stream",
  };
}

export async function deleteFile(storagePath: string): Promise<void> {
  if (isSupabaseStorageEnabled()) {
    await deleteFromSupabase(storagePath);
    return;
  }
  const { bucketName, objectName } = getBucketAndObjectName(storagePath);
  try {
    await objectStorageClient.bucket(bucketName).file(objectName).delete();
  } catch (err) {
    // Ignore not-found errors during deletion
    if ((err as { code?: number }).code !== 404) {
      throw err;
    }
  }
}

export async function createUploadUrl(storagePath: string): Promise<{ token: string }> {
  if (!isSupabaseStorageEnabled()) {
    throw new Error("Signed uploads are only enabled for Supabase storage");
  }
  return createSupabaseUploadUrl(storagePath);
}
