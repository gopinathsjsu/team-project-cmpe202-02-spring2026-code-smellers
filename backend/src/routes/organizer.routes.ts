import { Router } from "express";
import * as organizerController from "../controllers/organizer.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/dashboard", requireAuth, organizerController.getOrganizerDashboard);
router.get("/events/:eventId", requireAuth, organizerController.getOrganizerEventById);
router.patch("/events/:eventId", requireAuth, organizerController.updateOrganizerEvent);

export default router;
