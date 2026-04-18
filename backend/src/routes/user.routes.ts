import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as userSavedEventController from "../controllers/userSavedEvent.controller";
import * as userTicketController from "../controllers/userTicket.controller";

const router = Router();

router.get("/me/tickets", requireAuth, userTicketController.getMyTickets);
router.get("/me/saved-events", requireAuth, userSavedEventController.getMySavedEvents);
router.post("/me/saved-events/:eventId", requireAuth, userSavedEventController.postMySavedEvent);
router.delete("/me/saved-events/:eventId", requireAuth, userSavedEventController.deleteMySavedEvent);

export default router;
