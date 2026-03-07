import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import { inviteData } from "../../controllers/InviteController.js";

const router = express.Router();

router.get("/",authMiddleware, inviteData);
// router.post("/:id/accept", authMiddleware, acceptInvite);

export default router;
