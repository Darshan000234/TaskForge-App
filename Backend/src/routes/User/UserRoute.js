import express from 'express';
import {
    registerUser, LoginUser, google,
    LogoutUser, userData, DeleteAccount
} from '../../controllers/UserController.js';
import authMiddleware from '../../middlewares/authMiddleWare.js';
import { refreshToken } from '../../utils/generateTokens.js';
import {
    authLimiter, readLimiter, sensitiveLimiter
} from '../../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/signup',      authLimiter, registerUser);
router.post('/login',       authLimiter, LoginUser);
router.post('/googleauth',  authLimiter, google);
router.post('/refresh',     authLimiter, refreshToken);

router.get('/userdata',     authMiddleware, readLimiter, userData);
router.post('/logout',      authMiddleware, readLimiter, LogoutUser);

router.delete('/delete-account', authMiddleware, sensitiveLimiter, DeleteAccount);

export default router;