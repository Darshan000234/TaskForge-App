import bcrypt from 'bcrypt';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateTokens.js';
import { getIO } from "../utils/socket.js";
import { redis } from '../config/redis.js';
import crypto from 'crypto';

const URL = process.env.GOOGLE_URL;
const isProduction = process.env.NODE_ENV === "production";


export const registerUser = async (req, res) => {
    const { Username, email, password } = req.body;

    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
        return res.status(400).json({
            field: "email",
            message: "Email already exists"
        });
    }

    const usernameExists = await prisma.user.findUnique({ where: { name: Username } });
    if (usernameExists) {
        return res.status(400).json({
            field: "username",
            message: "Username already exists"
        });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
        data: { name: Username, email, password: hashed }
    });

    const accesstoken = generateAccessToken(newUser);
    const refreshToken = await generateRefreshToken(newUser);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accesstoken });
};

export const LoginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "invalid credentials" });

    const accesstoken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);
    console.log(refreshToken);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ accesstoken });
};

export const google = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: "token is required" });

        const { data } = await axios.get(`${URL}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const { sub, email, name } = data;

        let message = "Login Successful";

        let user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) || "user";
            let attempts = 0;
            while (attempts < 5) {
                try {
                    const username = `${baseUsername}_${crypto
                        .randomUUID()
                        .replace(/-/g, "")
                        .slice(0, 8)}`;

                    user = await prisma.user.create({
                        data: {
                            name: username,
                            email,
                            googleId: sub,
                            authProvider: "google",
                            password: null,
                        }
                    });

                    break;
                } catch (err) {
                    if (
                        err.code === "P2002" &&
                        err.meta?.target?.includes("name")
                    ) {
                        attempts++;
                        continue;
                    }

                    throw err;
                }
            }
            if (!user) {
                return res.status(500).json({
                    message: "Unable to generate a unique username."
                });
            }
        }

        const accesstoken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ accesstoken });

    } catch (error) {
        console.log(error.message);

        res.status(500).json({
            message: "Google authentication failed",
            error: error.message,
        });
    }
};

export const LogoutUser = async (req, res) => {

    const token = req.cookies.refreshToken;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_REFRESH_TOKEN);
            const hash = crypto.createHash('sha256').update(decoded.jti).digest('hex');
            await redis.del(hash);
            res.clearCookie('refreshToken');
            res.json({ message: "Logged out" });
        } catch (error) {
            return res.status(404).json({ message: error.message });
        }
    } else {
        return res.status(404).json({ message: error.message });
    }

};

export const userData = async (req, res) => {
    const cacheKey = `user:${req.user.id}`
    try {

        const cached = await redis.get(cacheKey);

        if (cached) {
            return res.status(202).json({
                data: JSON.parse(cached)
            });
        }
        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        await redis.set(cacheKey, JSON.stringify(user), "EX", 60);
        res.status(202).json({ data: user });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const DeleteAccount = async (req, res) => {
    const id = req.user.id;
    const io = getIO();
    try {
        const org = await prisma.org_member.findMany({
            where: {
                member_id: id
            }
        });

        await prisma.user.delete({
            where: {
                id: id
            }
        });

        await redis.del(`user:${id}`);

        for (const o of org) {
            const taskAssignments = await prisma.task_assignee.findMany({
                where: {
                    org_id: o.org_id,
                    user_id: id,
                },
                select: {
                    task_id: true,
                },
            });

            const projectMemberships = await prisma.proj_member.findMany({
                where: {
                    org_id: o.org_id,
                    member_id: id,
                },
                select: {
                    proj_id: true,
                },
            });

            io.to(`org_${o.org_id}`).emit("member left", {
                data: {
                    email: req.user.email,
                    id: id,
                    updatedProjects: projectMemberships,
                    updatedTasks: taskAssignments,
                },
            });
        }

        res.clearCookie('refreshToken');
        res.status(202).json({ message: "deleted account successfully " });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}