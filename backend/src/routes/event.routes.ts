import { Router } from "express";
import * as eventController from "../controllers/event.controller";
import * as eventTicketsController from "../controllers/eventTickets.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

//These routes will use "/events___" as prefix -> see routes/index.ts
router.get("/categories", eventController.getEventCategories);
router.get("/", eventController.getEvents);
router.get("/search", eventController.searchApprovedEvents);
router.get("/:eventId/related", eventController.getRelatedEvents);
router.get("/:eventId", eventController.getEventById);
router.post("/", requireAuth, eventController.createEvent);
router.post("/:eventId/tickets", requireAuth, eventTicketsController.rsvpForEvent);

export default router;