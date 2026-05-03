import { apiUrl } from "./api";
import { getAuthToken } from "./auth";

export type PatchProfileUser = {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
};

export async function patchMyDisplayName(
  displayName: string,
): Promise<{ user: PatchProfileUser }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not signed in");
  }

  const response = await fetch(apiUrl("/api/users/me/profile"), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ display_name: displayName }),
  });

  const data = (await response.json()) as { user?: PatchProfileUser; error?: string };

  if (!response.ok || !data.user) {
    throw new Error(data.error || `Could not save display name (${response.status})`);
  }

  return { user: data.user };
}
