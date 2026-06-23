import express from "express";
import {
    projData, addProject, projectDelete, reassignProject,
    OneProjData, getMember, UpdateProject, userData
} from "../../controllers/ProjController.js";
import { OrgcheckRole } from "../../middlewares/RBACMiddleware.js";
import { readLimiter, writeLimiter } from "../../middlewares/rateLimiter.js";

const router = express.Router();

// router.get("/one/:id",          readLimiter, OneProjData);
// router.get("/user/:id",         readLimiter, userData);
// router.post("/:id",             readLimiter, projData);
// router.post("/members/:id",     readLimiter, getMember);

// router.post("/",                OrgcheckRole(), writeLimiter, addProject);
// router.delete("/:id",           OrgcheckRole(), writeLimiter, projectDelete);
// router.patch("/:id/reassign",   OrgcheckRole(), writeLimiter, reassignProject);
// router.post("/update",          OrgcheckRole(), writeLimiter, UpdateProject);


router.post("/", OrgcheckRole(), addProject);
router.post("/update", OrgcheckRole(), UpdateProject);

router.patch("/:id/reassign", OrgcheckRole(), reassignProject);
router.delete("/:id", OrgcheckRole(), projectDelete);

router.get("/one/:id", OneProjData);
router.get("/user/:id", userData);
router.get("/data/:orgId", projData);

router.post("/members/:id", getMember);

export default router;