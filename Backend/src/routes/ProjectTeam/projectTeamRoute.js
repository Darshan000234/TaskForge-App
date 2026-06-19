import express from "express";
import { TeamData, DeleteMember, deleteTask, manyTeamData } from "../../controllers/TeamController.js";
import { ProjCheckRole } from "../../middlewares/RBACMiddleware.js";
import { readLimiter, writeLimiter } from "../../middlewares/rateLimiter.js";

const router = express.Router();

router.get("/:id",          readLimiter, TeamData);
router.post("/:id/members", readLimiter, manyTeamData);

router.post("/:id/delete",  ProjCheckRole, writeLimiter, DeleteMember);
router.post("/delete/task", ProjCheckRole, writeLimiter, deleteTask);

export default router;