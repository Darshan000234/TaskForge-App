import express from "express";
import {
    TaskData, AddTask, DeleteTask, OneTaskData,
    RemoveMemeber, addmember, addmemberData,
    UpdateTask, StatsData, getTaskAssignees
} from "../../controllers/TaskController.js";
import { ProjCheckRole, TaskCheckRole } from "../../middlewares/RBACMiddleware.js";
import { methodLimiter } from "../../middlewares/RateLimiter.js";

const router = express.Router();
router.use(methodLimiter);

router.get("/:proj_id", TaskData);
router.get("/:id/one", TaskCheckRole(),OneTaskData);
router.get("/stats/:id", StatsData);
router.get("/:id/addmemberdata/:proj_id/:org_id", addmemberData);

router.post("/add", ProjCheckRole(), AddTask);
router.post("/delete", ProjCheckRole(), DeleteTask);
router.post("/update", ProjCheckRole(), UpdateTask);
router.post("/:id/addmember", ProjCheckRole(), addmember);
router.post("/:id/removemember", ProjCheckRole(), RemoveMemeber);
router.get("/:id/assignees", getTaskAssignees);

export default router;
