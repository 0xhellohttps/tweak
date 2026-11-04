// Base path for static-demo builds (GitHub Pages serves under /tweak/demo).
// Empty in normal dev/prod. NEXT_PUBLIC_ so it inlines into client bundles.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix an absolute app path (/uploads/…, /brand/…, /api/…) with the base path. */
export function asset(url: string): string {
  return url.startsWith("/") ? `${BASE_PATH}${url}` : url;
}
