import express from "express";
import authMiddleware from "../../middlewares/authMiddleWare.js";
import { TaskData, AddTask, DeleteTask, OneTaskData, RemoveMemeber, addmember, addmemberData } from "../../controllers/TaskController.js";

const router = express.Router();
router.get("/:id", authMiddleware, TaskData);
router.get("/:id/one", authMiddleware, OneTaskData);
router.post("/add", authMiddleware, AddTask);
router.post("/delete", authMiddleware, DeleteTask);
router.post("/:id/addmember", authMiddleware, addmember);
router.post("/:id/addmemberdata", authMiddleware, addmemberData);
router.post("/:id/removemember", authMiddleware, RemoveMemeber);

export default router;