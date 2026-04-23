import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/dashboard", adminController.getAdminDashboard);
router.post("/users/admins", adminController.createAdminUser);
router.get("/events/:eventId/review", adminController.getAdminEventReview);
router.patch("/events/:eventId/moderation", adminController.moderateEvent);
router.post("/events/moderation/bulk", adminController.bulkModerateEvents);

export default router;
