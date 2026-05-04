import type { Request, Response } from "express";
import type { User } from "@supabase/supabase-js";
import * as userProfileService from "../services/userProfile.service";

type RequestWithUser = Request & { user?: User };

function bearerToken(req: Request): string {
  return (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
}

export const patchMyProfile = async (req: Request, res: Response) => {
  const authUser = (req as RequestWithUser).user;
  if (!authUser?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Missing access token" });
  }

  const display_name = req.body?.display_name;
  if (typeof display_name !== "string") {
    return res.status(400).json({ error: "display_name must be a string" });
  }

  const result = await userProfileService.updateMyDisplayName(
    token,
    authUser.id,
    display_name,
  );

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json({ user: result.user });
};
