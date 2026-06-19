import express from "express";
import {
    inviteData, sendInvite, acceptInvite,
    rejectInvite, DeleteInvite
} from "../../controllers/InviteController.js";
import { OrgcheckRole } from "../../middlewares/RBACMiddleware.js";
import { readLimiter, writeLimiter, sensitiveLimiter } from "../../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/",            OrgcheckRole, writeLimiter, sendInvite);
router.get("/data",         readLimiter, inviteData);
router.post("/:id/accept",  sensitiveLimiter, acceptInvite);
router.post("/:id/reject",  sensitiveLimiter, rejectInvite);
router.delete("/delete/:id",OrgcheckRole, writeLimiter, DeleteInvite);

export default router;