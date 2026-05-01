import { Router } from "express";
import * as organizerController from "../controllers/organizer.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/dashboard", requireAuth, organizerController.getOrganizerDashboard);
router.get("/events/:eventId", requireAuth, organizerController.getOrganizerEventById);
router.get("/events/:eventId/attendees", requireAuth, organizerController.getOrganizerEventAttendees);
router.delete("/events/:eventId/attendees/:ticketId", requireAuth, organizerController.removeOrganizerEventAttendee);
router.patch("/events/:eventId", requireAuth, organizerController.updateOrganizerEvent);

export default router;
