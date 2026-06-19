import express from "express";
import {
    TaskData, AddTask, DeleteTask, OneTaskData,
    RemoveMemeber, addmember, addmemberData,
    UpdateTask, StatsData
} from "../../controllers/TaskController.js";
import { ProjCheckRole } from "../../middlewares/RBACMiddleware.js";
import { readLimiter, writeLimiter } from "../../middlewares/rateLimiter.js";

const router = express.Router();

router.get("/:id",                  readLimiter, TaskData);
router.get("/:id/one",              readLimiter, OneTaskData);
router.get("/stats/:id",            readLimiter, StatsData);
router.post("/:id/addmemberdata",   readLimiter, addmemberData);

router.post("/add",                 ProjCheckRole, writeLimiter, AddTask);
router.post("/delete",              ProjCheckRole, writeLimiter, DeleteTask);
router.post("/update",              ProjCheckRole, writeLimiter, UpdateTask);
router.post("/:id/addmember",       ProjCheckRole, writeLimiter, addmember);
router.post("/:id/removemember",    ProjCheckRole, writeLimiter, RemoveMemeber);

export default router;