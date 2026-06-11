import express from "express";
import authMiddleware from "../../middlewares/authMiddleWare.js";
import {
        projData,
        addProject,
        projectDelete,
        reassignProject,
        OneProjData,
        getMember,
        UpdateProject,
        userData
} from "../../controllers/ProjController.js";
import { OrgcheckRole } from "../../middlewares/RBACMiddleware.js";
const router = express.Router();


router.post("/", authMiddleware, OrgcheckRole,addProject);
router.get("/one/:id", authMiddleware, OneProjData);
router.delete("/:id", authMiddleware,OrgcheckRole ,projectDelete);
router.patch("/:id/reassign", authMiddleware,OrgcheckRole,reassignProject);
router.post("/members/:id", authMiddleware, getMember);
router.post("/update", authMiddleware, OrgcheckRole,UpdateProject);
router.post("/:id", authMiddleware, projData);
router.get("/user/:id", authMiddleware, userData);

export default router;