import bcrypt from 'bcrypt';
import axios from 'axios';
// const prisma = require('../config/prisma.js');
import prisma from '../config/prisma.js';
// const generateToken = require('../utils/generateTokens.js');
import { generateAccessToken, generateRefreshToken } from '../utils/generateTokens.js';
// import redis  from '../config/redis.js';

const URL = process.env.GOOGLE_URL;

export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        return res.status(400).json({ message: "User already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
        data: { name, email, password: hashed }
    });
    const accesstoken = generateAccessToken(user);
    const { id, refreshToken } = generateRefreshToken(newUser);
    // await redis.set(id, user.id, 'EX', 7 * 24 * 60 * 60);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accesstoken, message: "User created successfully" });
};

export const LoginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "invaild credentials" });

    const vaild = await bcrypt.compare(password, user.password);
    if (!vaild) return res.status(400).json({ message: "invaild credentials" });

    const accesstoken = generateAccessToken(user);
    const { id, refreshToken } = generateRefreshToken(newUser);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accesstoken, message: "Login successful" });
};

export const google = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: "token is required" });
        const { data } = await axios.get(`${URL}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const { sub, email, name } = data;
        let message = "Login Successful";
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: name,
                    email: email,
                    googleId: sub,
                    authProvider: "google",
                    password: null,
                }
            });
            message = "SignUp Successful";

        }
        const accesstoken = generateAccessToken(user);
        const { refreshToken } = generateRefreshToken(user);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ accesstoken, message });
    } catch (error) {
        res.status(500).json({ message: "Google authentication failed", error: error.message });
    }
};

export const LogoutUser = async (req, res) => {
    res.clearCookie('refreshToken');
    res.json({ message: "Logged out" });
};