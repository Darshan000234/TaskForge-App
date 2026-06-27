import express from "express";
import {
    TaskData, AddTask, DeleteTask, OneTaskData,
    RemoveMemeber, addmember, addmemberData,
    UpdateTask, StatsData, getTaskAssignees
} from "../../controllers/TaskController.js";
import { ProjCheckRole } from "../../middlewares/RBACMiddleware.js";
import { readLimiter, writeLimiter } from "../../middlewares/rateLimiter.js";

const router = express.Router();

// router.get("/:id",                  readLimiter, TaskData);
// router.get("/:id/one",              readLimiter, OneTaskData);
// router.get("/stats/:id",            readLimiter, StatsData);
// router.post("/:id/addmemberdata",   readLimiter, addmemberData);

// router.post("/add",                 ProjCheckRole, writeLimiter, AddTask);
// router.post("/delete",              ProjCheckRole, writeLimiter, DeleteTask);
// router.post("/update",              ProjCheckRole, writeLimiter, UpdateTask);
// router.post("/:id/addmember",       ProjCheckRole, writeLimiter, addmember);
// router.post("/:id/removemember",    ProjCheckRole, writeLimiter, RemoveMemeber);

router.get("/:proj_id", TaskData);
router.get("/:id/one", OneTaskData);
router.get("/stats/:id", StatsData);
router.post("/:id/addmemberdata", addmemberData);

router.post("/add", ProjCheckRole(), AddTask);
router.post("/delete", ProjCheckRole(), DeleteTask);
router.post("/update", ProjCheckRole(), UpdateTask);
router.post("/:id/addmember", ProjCheckRole(), addmember);
router.post("/:id/removemember", ProjCheckRole(), RemoveMemeber);
router.get("/:id/assignees", getTaskAssignees);
export default router;