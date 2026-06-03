import express from "express";
import authMiddleware from "../../middlewares/authMiddleWare.js";
import {
        projData,
        addProject,
        projectDelete,
        reassignProject,
        OneProjData,
        getMember,
        UpdateProject
} from "../../controllers/ProjController.js";

const router = express.Router();


router.post("/", authMiddleware, addProject);
router.get("/one/:id", authMiddleware, OneProjData);
router.delete("/:id", authMiddleware, projectDelete);
router.patch("/:id/reassign", authMiddleware, reassignProject);
router.post("/members/:id", authMiddleware, getMember);
router.post("/update", authMiddleware, UpdateProject);
router.post("/:id", authMiddleware, projData);

export default router;