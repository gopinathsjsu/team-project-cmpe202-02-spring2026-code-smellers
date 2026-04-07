/** Join API path to a backend origin (trailing slash on base is stripped). */
export function buildApiUrl(base: string | undefined, path: string): string {
  const normalized = (base?.trim() || "http://localhost:3000").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${normalized}${p}`;
}
