import { NextFunction, Request, Response } from "express";
import { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";

type RequestWithUser = Request & { user?: User };

export const requireAuth = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			return res.status(401).json({ error: "Missing or invalid Authorization header" });
		}

		const accessToken = authHeader.slice("Bearer ".length).trim();
		if (!accessToken) {
			return res.status(401).json({ error: "Missing access token" });
		}

		const supabase = getSupabaseClient();
		const { data, error } = await supabase.auth.getUser(accessToken);

		if (error || !data.user) {
			return res.status(401).json({ error: "Invalid or expired access token" });
		}

		(req as RequestWithUser).user = data.user;
		return next();
	} catch (error) {
		return res.status(500).json({
			error: error instanceof Error ? error.message : "Unexpected error",
		});
	}
};

export const requireAdmin = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = (req as RequestWithUser).user?.id;
		if (!userId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const supabase = getSupabaseClient();
		const { data, error } = await supabase
			.from("users")
			.select("is_admin")
			.eq("id", userId)
			.maybeSingle();

		if (error) {
			return res.status(500).json({ error: error.message });
		}

		if (!data?.is_admin) {
			return res.status(403).json({ error: "Admin access required" });
		}

		return next();
	} catch (error) {
		return res.status(500).json({
			error: error instanceof Error ? error.message : "Unexpected error",
		});
	}
};