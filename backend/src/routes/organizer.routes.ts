import { Router } from "express";
import * as organizerController from "../controllers/organizer.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/:organizerId/dashboard", requireAuth, organizerController.getOrganizerDashboard);

export default router;
