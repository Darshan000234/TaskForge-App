import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
// import redis  from '../config/redis.js';

export const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_ACCESS_TOKEN,
        { expiresIn: '2h' }
    )
};

export const generateRefreshToken = (user) => {
    const id = uuidv4();
    const refreshToken = jwt.sign(
        { id: user.id, email: user.email},
        process.env.JWT_REFRESH_TOKEN,
        { expiresIn: '7d' }
    )

    return { id, refreshToken };
};

export const refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) res.status(401).json({ message: 'invaild credentials' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_TOKEN);
        // const storeUserId = await redis.get(decoded.jti);
        // if (!storeUserId) return res.status(403).json({ message: 'invaild credentials' });

        // await redis.del(decoded.jti);

        const user = { id: decoded.id, email: decoded.email };
        const accesstoken = generateAccessToken(user);
        // const { id, refreshToken } = generateRefreshToken(user);

        // await redis.set(id, user.id, 'EX', 7 * 24 * 60 * 60);
        // res.cookie('refreshToken',refreshToken,{
        //     httpOnly: true,
        //     secure: false,
        //     sameSite: 'strict',
        //     maxAge: 7 * 24 * 60 * 60 * 1000
        // });

        res.json({ accesstoken });
    } catch (error) {
        return res.status(403).json({ message: 'invaild credentials' });
    }
};