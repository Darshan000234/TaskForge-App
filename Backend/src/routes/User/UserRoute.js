import express from 'express';
import {
    registerUser,
    LoginUser,
    google,
    LogoutUser,
    userData,
    DeleteAccount
} from '../../controllers/UserController.js';

import authMiddleware from '../../middlewares/authMiddleWare.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', LoginUser);
router.post('/googleauth', google);
router.post('/logout', authMiddleware, LogoutUser);
router.get('/userdata',authMiddleware,userData);
router.get('/delete-account',authMiddleware,DeleteAccount);

export default router;
