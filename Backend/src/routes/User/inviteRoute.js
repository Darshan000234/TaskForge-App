import express from "express";
import {
    inviteData, sendInvite, acceptInvite,
    rejectInvite, DeleteInvite
} from "../../controllers/InviteController.js";
import { OrgcheckRole } from "../../middlewares/RBACMiddleware.js";
import { methodLimiter, sensitiveLimiter } from "../../middlewares/RateLimiter.js";

const router = express.Router();

router.post("/", methodLimiter, OrgcheckRole(), sendInvite);
router.get("/data", methodLimiter, inviteData);

// accept/reject -> sensitiveLimiter
router.post("/:id/accept", sensitiveLimiter, acceptInvite);
router.post("/:id/reject", sensitiveLimiter, rejectInvite);

router.delete("/delete/:id", methodLimiter, OrgcheckRole(), DeleteInvite);

export default router;
