import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import { projData,addProject } from "../../controllers/ProjController.js";

const router = express.Router();

 
router.post("/",authMiddleware,addProject);
router.post("/:id",authMiddleware,projData);
// router.delete("/:id",authMiddleware,projectDelete);

export default router;