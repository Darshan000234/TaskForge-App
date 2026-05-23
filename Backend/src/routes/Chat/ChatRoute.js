import express from "express"
import authMiddleware from '../../middlewares/authMiddleWare.js';
import { MessageData, sentMessage } from "../../controllers/ChatController.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.get('/messageData/:id',authMiddleware,MessageData);
router.post('/message/sent',authMiddleware,upload.single("file"),sentMessage);

export default router;