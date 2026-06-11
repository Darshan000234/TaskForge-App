import express from "express";
import authMiddleware from "../../middlewares/authMiddleWare.js";
import { TaskData, AddTask, DeleteTask, OneTaskData, RemoveMemeber, addmember, addmemberData, UpdateTask, StatsData } from "../../controllers/TaskController.js";
import { ProjCheckRole } from "../../middlewares/RBACMiddleware.js";
const router = express.Router();
router.get("/:id", authMiddleware,TaskData);
router.get("/:id/one", authMiddleware, OneTaskData);
router.post("/add", authMiddleware,ProjCheckRole ,AddTask);
router.post("/delete", authMiddleware, ProjCheckRole,DeleteTask);
router.post("/:id/addmember", authMiddleware, ProjCheckRole,addmember);
router.post("/:id/addmemberdata", authMiddleware, addmemberData);
router.post("/:id/removemember", authMiddleware, ProjCheckRole,RemoveMemeber);
router.post("/update",authMiddleware,ProjCheckRole,UpdateTask);
router.get("/stats/:id",authMiddleware,StatsData);

export default router;