const jwt = require('jsownwebtoken');

export const generateAccessToken = (user) => {
    return jwt.sign(
        {id:user.id,email:user.email},
        process.env.JWT_ACCESS_TOKEN,
        {expiresIn:'15m'}
    )
};

export const generateRefreshToken = (user) => {
    return jwt.sign(
        {id:user.id,email:user.email},
        process.env.JWT_REFRESH_TOKEN,
        {expiresIn:'7d'}
    )
};

export const refreshToken = (req,res) => {
    const token = req.cookies.refreshToken;
    if(!token) res.status(401).json({message : 'invaild credentials'});

    try {
        const decoded = jwt.verfiy(token,process.env.JWT_REFRESH_TOKEN);
        const user = {id:decoded.id,email:decoded.email};
        const accesstoken = generateAccessToken(user);
        res.json({accesstoken});
    } catch (error) {
        return res.status(403).json({message : 'invaild credentials'});
    }
};