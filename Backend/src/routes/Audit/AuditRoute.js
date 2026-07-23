import express from "express";
import { AuditData } from "../../controllers/AuditController.js";
import { readLimiter } from "../../middlewares/RateLimiter.js";

const router = express.Router();

router.get('/', readLimiter, AuditData);

export default router;
