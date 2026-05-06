import express from "express";
import authMiddleware from "../../middlewares/authMiddleWare.js";
import { TeamData,DeleteMember } from "../../controllers/TeamController.js";

const router = express.Router();

router.post("/:id",authMiddleware,TeamData);
router.post("/:id/delete",authMiddleware,DeleteMember);
export default router;