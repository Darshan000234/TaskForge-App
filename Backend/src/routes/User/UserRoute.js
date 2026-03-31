import express from 'express';
import {
    registerUser,
    LoginUser,
    google,
    LogoutUser
} from '../../controllers/UserController.js';

import authMiddleware from '../../middlewares/authMiddleWare.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', LoginUser);
router.post('/googleauth', google);
router.post('/logout', authMiddleware, LogoutUser);

export default router;
