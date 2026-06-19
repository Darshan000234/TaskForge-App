import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { redis } from '../config/redis.js';

const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = 7 * 24 * 60 * 60;

export const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_ACCESS_TOKEN,
        { expiresIn: ACCESS_EXPIRY }
    );
};

export const generateRefreshToken = async (user) => {
    const jti = uuidv4();

    const refreshToken = jwt.sign(
        { id: user.id, email: user.email, jti },
        process.env.JWT_REFRESH_TOKEN,
        { expiresIn: '7d' }
    );

    const hash = crypto.createHash('sha256').update(jti).digest('hex');

    await redis.set(hash, user.id, 'EX', REFRESH_EXPIRY);

    return refreshToken;
};

export const refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'unauthorized' });

    try {
        // console.log(token);
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_TOKEN);
        // console.log(decoded);
        
        const hash = crypto.createHash('sha256').update(decoded.jti).digest('hex');

        const storedUserId = await redis.get(hash);
        if (!storedUserId) {
            return res.status(403).json({ message: 'token reuse detected' });
        }

        await redis.del(hash);

        const user = { id: decoded.id, email: decoded.email };

        const accessToken = generateAccessToken(user);
        const newRefreshToken = await generateRefreshToken(user);

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: REFRESH_EXPIRY * 1000
        });
        // console.log(accessToken);
        
        res.json({ accessToken });

    } catch (err){
        console.log(err.message);
        
        return res.status(403).json({ message: 'invalid token' });
    }
};