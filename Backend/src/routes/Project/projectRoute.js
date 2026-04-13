import express from "express";
import authMiddleware from "../../middlewares/authMiddleWare.js";
import {projData, 
        addProject, 
        projectDelete, 
        reassignProject,
        OneProjData } from "../../controllers/ProjController.js";

const router = express.Router();


router.post("/", authMiddleware, addProject);
router.post("/:id", authMiddleware, projData);
router.post("/one/:id", authMiddleware, OneProjData);
router.delete("/:id", authMiddleware, projectDelete);
router.patch("/:id/reassign", authMiddleware, reassignProject);

export default router;