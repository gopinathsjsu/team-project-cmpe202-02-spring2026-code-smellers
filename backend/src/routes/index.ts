import { Router } from "express";
import eventRoutes from "./event.routes";
import authRoutes from "./auth.routes";
// import ticketRoutes from "./ticket.routes"; //NOT IMPLEMENTED YET

const router = Router();

//These represent each prefix for the HTTP methods for the endpoints
//Don't mind the "router.use"; each HTTP method is designated in the sub-route (e.g. event.routes.ts)
router.use("/events", eventRoutes);
router.use("/auth", authRoutes);
// router.use("/tickets", ticketRoutes); //NOT IMPLEMENTED YET

export default router;