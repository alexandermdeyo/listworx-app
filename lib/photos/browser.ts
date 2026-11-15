/**
 * Browser-side helpers for the photo library uploader (Stage 2).
 * The file goes straight from the admin's browser to Supabase storage (no size limit
 * from the website's server functions), using the admin's own sign-in, into
 * site-media/library/… with overwriting disabled. The server then verifies it.
 */
import { dhashFromGrid, libraryPath } from '@/lib/photos/library';

export async function sha256OfFile(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 64-bit difference hash (similarity fingerprint) from a 9×8 grey thumbnail. */
export async function dhashOfFile(file: Blob): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = 9;
    canvas.height = 8;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, 9, 8);
    bitmap.close?.();
    const px = ctx.getImageData(0, 0, 9, 8).data;
    const grey: number[] = [];
    for (let i = 0; i < px.length; i += 4) grey.push(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
    return dhashFromGrid(grey);
  } catch {
    return null;
  }
}

export function newLibraryPath(fileName: string) {
  return libraryPath(fileName, crypto.randomUUID());
}
