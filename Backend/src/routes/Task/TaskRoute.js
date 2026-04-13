import express from "express";
import authMiddleware from "../../middlewares/authMiddleWare.js";
import { TaskData } from "../../controllers/TaskController.js";

const router = express.Router();
router.post("/:id",authMiddleware,TaskData);

export default router;