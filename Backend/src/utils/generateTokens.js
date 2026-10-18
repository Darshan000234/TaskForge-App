import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { redis } from '../config/redis.js';
import { perfNow, elapsedMs, logPerformance } from './performance.js';

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
    const startedAt = perfNow();
    const stages = {};
    const token = req.cookies.refreshToken;

    if (!token) {
        logPerformance({
            req,
            endpoint: "POST /user/refresh",
            statusCode: 401,
            startedAt,
            stages,
            extra: { outcome: "missing_refresh_cookie" },
        });
        return res.status(401).json({ message: 'unauthorized' });
    }

    try {
        let stageStartedAt = perfNow();
        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_REFRESH_TOKEN);
        } finally {
            stages.jwtVerifyMs = elapsedMs(stageStartedAt);
        }

        const hash = crypto.createHash('sha256').update(decoded.jti).digest('hex');

        stageStartedAt = perfNow();
        const storedUserId = await redis.get(hash);
        stages.redisGetMs = elapsedMs(stageStartedAt);

        if (!storedUserId) {
            logPerformance({
                req,
                endpoint: "POST /user/refresh",
                statusCode: 403,
                startedAt,
                stages,
                extra: { outcome: "refresh_token_not_found" },
            });
            return res.status(403).json({
                message: "token reuse detected"
            });
        }

        stageStartedAt = perfNow();
        const deleted = await redis.del(hash);
        stages.redisDeleteMs = elapsedMs(stageStartedAt);

        if (deleted !== 1) {
            logPerformance({
                req,
                endpoint: "POST /user/refresh",
                statusCode: 403,
                startedAt,
                stages,
                extra: { outcome: "refresh_token_already_used" },
            });
            return res.status(403).json({
                message: "refresh token already used"
            });
        }
        const user = { id: decoded.id, email: decoded.email };

        stageStartedAt = perfNow();
        const accessToken = generateAccessToken(user);
        stages.accessTokenSignMs = elapsedMs(stageStartedAt);

        // generateRefreshToken also persists the new refresh token in Redis.
        stageStartedAt = perfNow();
        const newRefreshToken = await generateRefreshToken(user);
        stages.refreshTokenSignAndRedisSetMs = elapsedMs(stageStartedAt);

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: REFRESH_EXPIRY * 1000
        });

        logPerformance({
            req,
            endpoint: "POST /user/refresh",
            statusCode: 200,
            startedAt,
            stages,
            extra: { outcome: "success" },
        });

        res.json({ accessToken });

    } catch (err) {
        logPerformance({
            req,
            endpoint: "POST /user/refresh",
            statusCode: 403,
            startedAt,
            stages,
            extra: { outcome: "error" },
        });
        console.log(err.message);
        return res.status(403).json({ message: 'invalid token' });
    }
};
