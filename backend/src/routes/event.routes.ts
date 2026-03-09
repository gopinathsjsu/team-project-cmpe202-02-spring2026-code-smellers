import { Router } from "express";
import * as eventController from "../controllers/event.controller";

const router = Router();

//These routes will use "/events___" as prefix -> see routes/index.ts
router.get("/", eventController.getEvents);
router.get("/:eventId", eventController.getEventById);
router.post("/", eventController.createEvent);

export default router;