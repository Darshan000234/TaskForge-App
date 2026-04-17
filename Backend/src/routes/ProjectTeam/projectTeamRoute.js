import express from "express";
import authMiddleware from "../../middlewares/authMiddleWare.js";
import { TeamData } from "../../controllers/TeamController.js";

const router = express.Router();

router.post("/:id",authMiddleware,TeamData);

export default router;