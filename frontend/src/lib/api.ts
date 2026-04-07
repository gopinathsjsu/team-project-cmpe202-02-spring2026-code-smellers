import { buildApiUrl } from "./buildApiUrl";

export { buildApiUrl } from "./buildApiUrl";

/** Backend origin; override with `VITE_API_URL` in `.env` when not using the default dev server. */
export function apiUrl(path: string): string {
  return buildApiUrl(import.meta.env.VITE_API_URL as string | undefined, path);
}
