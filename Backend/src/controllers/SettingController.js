import prisma from "../config/prisma.js";
import { redis } from "../config/redis.js";


export const EditUsername = async (req, res) => {
    const user_id = req.user.id;
    const { username } = req.body;
    console.log(username);
    
    try {
        if (!username || username.trim() === "") {
            return res.status(400).json({
                message: "Username is required"
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                name: username
            }
        });

        if (existingUser && existingUser.id !== user_id) {
            return res.status(409).json({
                message: "Username already exists"
            });
        }

        const user = await prisma.user.update({
            where: {
                id: user_id
            },
            data: {
                name: username
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        await redis.del(`user:${user_id}`);

        return res.status(200).json({
            message: "Username updated successfully",
            data: user
        });

    } catch (error) {
        console.error("EditUsername:", error.message);

        return res.status(500).json({
            message: error.message
        });
    }
};