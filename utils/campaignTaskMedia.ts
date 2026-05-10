/** Detect hosted video URLs (e.g. Cloudinary video delivery). */
export function isVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const u = url.toLowerCase();
  return (
    u.includes('/video/upload/') ||
    /\.(mp4|webm|mov|m4v|mkv|ogv)(\?|#|$)/i.test(u)
  );
}

export function isVideoFileLike(file: File | Blob): boolean {
  return Boolean(file.type && file.type.startsWith('video/'));
}
