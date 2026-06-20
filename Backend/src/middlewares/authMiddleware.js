import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;
    if(!header) return res.status(401).json({message:"Unauthorized"});
    
    const token = header.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token,process.env.JWT_ACCESS_TOKEN);
        req.user = decoded;
        // console.log(decoded);
         
        next();
    } catch (error) {
        console.log(error.message);
        console.log("authMiddleware");
        return res.status(401).json({message:"Invalid token"});
    }
};

export default authMiddleware;