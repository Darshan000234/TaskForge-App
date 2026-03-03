import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;
    // console.log('come');
    if(!header) return res.status(401).json({message:"Unauthorized"});

    const token = header.split(' ')[1];

    try {
        const decoded = jwt.verify(token,process.env.JWT_ACCESS_TOKEN);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({message:"Invalid token"});
    }
};

export default authMiddleware;