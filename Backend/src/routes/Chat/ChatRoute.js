import express from "express";
import { MessageData, sentMessage } from "../../controllers/ChatController.js";
import multer from "multer";
import { readLimiter, writeLimiter } from "../../middlewares/rateLimiter.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.get('/messageData/:id',          readLimiter, MessageData);
router.post('/message/sent', writeLimiter, upload.single("file"), sentMessage);

export default router;