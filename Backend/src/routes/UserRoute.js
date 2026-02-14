const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController.js');
const authMiddleware = require('../middlewares/authMiddleware.js');

router.post('/signup',UserController.registerUser);
router.post('/login',UserController.LoginUser);
router.post('/googleauth',UserController.google);
router.post('/logout',authMiddleware,UserController.LogoutUser);

module.exports = router;