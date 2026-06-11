import express from "express";
import authMiddleware from "../../middlewares/authMiddleWare.js"; 
import { AuditData } from "../../controllers/AuditController.js";

const router = express.Router();
 
router.get('/',authMiddleware,AuditData);

export default router;