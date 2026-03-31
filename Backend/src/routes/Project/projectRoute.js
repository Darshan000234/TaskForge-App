import express from "express";
import authMiddleware from "../../middlewares/authMiddleWare.js";
import { projData,addProject,projectDelete,reassignProject } from "../../controllers/ProjController.js";

const router = express.Router();

 
router.post("/",authMiddleware,addProject);
router.post("/:id",authMiddleware,projData);
router.delete("/:id",authMiddleware,projectDelete);
router.patch("/:id/reassign",authMiddleware,reassignProject);

export default router;