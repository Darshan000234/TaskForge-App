import express from "express";
import authMiddleware from "../../middlewares/authMiddleWare.js";
import { TaskData,AddTask,DeleteTask } from "../../controllers/TaskController.js";

const router = express.Router();
router.get("/:id",authMiddleware,TaskData);
router.post("/add",authMiddleware,AddTask);
router.post("/delete",authMiddleware,DeleteTask);

export default router;