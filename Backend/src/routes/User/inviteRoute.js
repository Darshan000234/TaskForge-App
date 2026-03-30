import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import { 
    inviteData,
    sendInvite,
    acceptInvite,
    rejectInvite } from "../../controllers/InviteController.js";

const router = express.Router();

router.post("/",authMiddleware,sendInvite);
router.get("/data",authMiddleware, inviteData);
router.post("/:id/accept", authMiddleware, acceptInvite);
router.post("/:id/reject",authMiddleware,rejectInvite);

export default router;
