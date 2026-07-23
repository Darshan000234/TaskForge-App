import express from "express";
import { MessageData, sentMessage } from "../../controllers/ChatController.js";
import multer from "multer";
import { chatLimiter, readLimiter } from "../../middlewares/RateLimiter.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.get('/messageData/:id', readLimiter, MessageData);

router.post('/message/sent', chatLimiter, upload.single("file"), sentMessage);

export default router;
