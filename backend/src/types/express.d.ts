import type { User } from "@supabase/supabase-js";

declare global {
	namespace Express {
		interface Request {
			user?: User;
		}
	}
}

declare module "express-serve-static-core" {
	interface Request {
		user?: User;
	}
}

export {};