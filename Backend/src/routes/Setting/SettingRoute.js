import express from "express";
import {
    EditUsername
} from "../../controllers/SettingController.js";
import { methodLimiter } from "../../middlewares/RateLimiter.js";

const router = express.Router();

router.patch("/edit-username",methodLimiter,EditUsername);

export default router; 