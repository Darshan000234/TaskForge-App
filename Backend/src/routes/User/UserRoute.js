import express from 'express';
import {
    registerUser, LoginUser, google,
    LogoutUser, userData, DeleteAccount
} from '../../controllers/UserController.js';
import authMiddleware from '../../middlewares/authMiddleware.js';
import { refreshToken } from '../../utils/generateTokens.js';
import {
    authLimiter, readLimiter, sensitiveLimiter,RefreshLimiter
} from '../../middlewares/RateLimiter.js';

const router = express.Router();


router.post('/signup', authLimiter, registerUser);
router.post('/login', authLimiter, LoginUser);
router.post('/googleauth', authLimiter, google);
router.post('/refresh', RefreshLimiter, refreshToken);
// router.post(
//     "/rate-test",
//     writeLimiter,
//     (req, res) => {
//         res.json({ success: true });
//     }
// );
router.get('/userdata', authMiddleware, readLimiter, userData);
router.get('/logout', authMiddleware, readLimiter, LogoutUser);

// Account deletion -> sensitiveLimiter
router.delete('/delete-account', authMiddleware, sensitiveLimiter, DeleteAccount);

export default router;
