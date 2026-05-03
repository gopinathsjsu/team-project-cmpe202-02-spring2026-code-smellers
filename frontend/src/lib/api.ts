import { buildApiUrl } from "./buildApiUrl";

export { buildApiUrl } from "./buildApiUrl";

/** Backend origin; override with `VITE_API_URL` in `.env` when not using the default dev server. */
export function apiUrl(path: string): string {
  const base = process.env.VITE_API_URL;
  return buildApiUrl(base && base.length > 0 ? base : undefined, path);
}
