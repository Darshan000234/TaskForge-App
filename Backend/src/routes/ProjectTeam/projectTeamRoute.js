import express from "express";
import { TeamData, DeleteMember, deleteTask, manyTeamData, teamTaskData } from "../../controllers/TeamController.js";
import { ProjCheckRole } from "../../middlewares/RBACMiddleware.js";
import { methodLimiter } from "../../middlewares/RateLimiter.js";

const router = express.Router();

router.use(methodLimiter);

router.get("/:id", TeamData);

router.get("/:id/members", manyTeamData);

router.post("/:id/delete", ProjCheckRole(), DeleteMember);
router.post("/delete/task", ProjCheckRole(), deleteTask);
router.get("/member/:proj_id/:member_id", teamTaskData);

export default router;
