import express from "express";
import authMiddleware from "../../middlewares/authMiddleWare.js";
import { TeamData, DeleteMember, deleteTask, manyTeamData, OneTaskData} from "../../controllers/TeamController.js";

const router = express.Router();

router.post("/:id",authMiddleware,TeamData);
router.post("/:id/delete",authMiddleware,DeleteMember);
router.post("/delete/task",authMiddleware,deleteTask);
router.post("/:id/members", authMiddleware, manyTeamData);
router.get("/:id/onetaskdata", authMiddleware, OneTaskData);

export default router;