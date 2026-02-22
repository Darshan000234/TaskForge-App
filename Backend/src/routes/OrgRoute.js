import express from "express"
import authMiddleware from '../middlewares/authMiddleware.js';
const router = express.Router();

router.post('/add',authMiddleware);
router.patch('/update',authMiddleware); // only can change username other than this there is nothing to change
router.delete('/delete',authMiddleware);

export default router;