import { Router } from "express";
import * as adminController from "../controllers/admin.controller";

const router = Router();

router.get("/dashboard", adminController.getAdminDashboard);
router.get("/events/:eventId/review", adminController.getAdminEventReview);
router.patch("/events/:eventId/moderation", adminController.moderateEvent);
router.post("/events/moderation/bulk", adminController.bulkModerateEvents);

export default router;
