import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import { projData } from "../../controllers/ProjController.js";

const router = express.Router();

 
router.post("/:id",authMiddleware,projData);

export default router;