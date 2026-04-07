import { Router } from "express";
import * as eventController from "../controllers/event.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

//These routes will use "/events___" as prefix -> see routes/index.ts
router.get("/categories", eventController.getEventCategories);
router.get("/", eventController.getEvents);
router.get("/:eventId", eventController.getEventById);
router.post("/", requireAuth, eventController.createEvent);

export default router;