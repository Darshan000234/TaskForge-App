import express from "express";
import authMiddleware from "../../middlewares/authMiddleWare.js";
import {
    inviteData,
    sendInvite,
    acceptInvite,
    rejectInvite,
    DeleteInvite
} from "../../controllers/InviteController.js";
import { checkRole } from "../../middlewares/RBACMiddleware.js";
const router = express.Router();

router.post("/", authMiddleware, checkRole("admin"), sendInvite);
router.get("/data", authMiddleware, inviteData);
router.post("/:id/accept", authMiddleware, acceptInvite);
router.post("/:id/reject", authMiddleware, rejectInvite);
router.delete("/delete/:id",authMiddleware, DeleteInvite)
export default router;
