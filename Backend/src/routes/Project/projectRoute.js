import express from "express";
import {
    projData, addProject, projectDelete, reassignProject,
    OneProjData, getMember, UpdateProject, userData,
    ManagerData
} from "../../controllers/ProjController.js";
import { OrgcheckRole } from "../../middlewares/RBACMiddleware.js";
import { methodLimiter } from "../../middlewares/RateLimiter.js";

const router = express.Router();

router.use(methodLimiter);
router.post("/", OrgcheckRole(), addProject);
router.put("/update", OrgcheckRole(), UpdateProject);

router.patch("/:id/reassign", OrgcheckRole(), reassignProject);
router.delete("/:id", OrgcheckRole(), projectDelete);

router.get("/one/:id", OneProjData);
router.get("/user/:id", userData);
router.get("/data/:orgId", projData);

router.get("/members/:id/:org_id", getMember);
router.get("/ManagerData/:proj_id/:org_id",ManagerData);

export default router;
