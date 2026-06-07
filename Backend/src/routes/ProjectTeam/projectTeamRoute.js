import express from "express";
import authMiddleware from "../../middlewares/authMiddleWare.js";
import { TeamData, DeleteMember, deleteTask, manyTeamData} from "../../controllers/TeamController.js";

const router = express.Router();

router.get("/:id",authMiddleware,TeamData);
router.post("/:id/delete",authMiddleware,DeleteMember);
router.post("/delete/task",authMiddleware,deleteTask);
router.post("/:id/members", authMiddleware, manyTeamData);

export default router;