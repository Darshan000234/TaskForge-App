const bcrypt = require('bcrypt');
const prisma = require('../config/prisma.js');
const generateToken = require('../utils/generateTokens.js');

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
    const accesstoken = generateToken.generateAccessToken(user);
    const refreshtoken = generateToken.generateRefreshToken(user);

    res.cookie('refreshToken', refreshtoken, {
        httpOnly: true,
        secure: false,
        samesite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accesstoken , message: "User created successfully" });
};

export const LoginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "invaild credentials" });

    const vaild = await bcrypt.compare(password, user.password);
    if (!vaild) return res.status(400).json({ message: "invaild credentials" });

    const accesstoken = generateToken.generateAccessToken(user);
    const refreshtoken = generateToken.generateRefreshToken(user);

    res.cookie('refreshToken', refreshtoken, {
        httpOnly: true,
        secure: false,
        samesite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accesstoken , message: "Login successful" });
};

export const google = async (req, res) => {
    try {
        const token = req.body;
        if (!token) return res.status(400).json({ message: "token is required" });
        const { data } = await axios.get(`${URL}`,
            { headers: { Authorization: `Beared ${token}` } }
        );
        const {sub,email,name} = data;
        let message = "Login Successful";
        let user = await prisma.user.findUnique({ where: { email } });
        if(!user){
            user = await prisma.user.create({
                data : {
                    name: name,
                    email: email,
                    googleId: sub,
                    authProvider: "google",
                    password: null,
                }
            });
            message = "SignUp Successful";
        }
        const accesstoken = generateToken.generateAccessToken(user);
        const refreshtoken = generateToken.generateRefreshToken(user);

        res.cookie('refreshToken', refreshtoken, {
            httpOnly: true,
            secure: false,
            samesite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ accesstoken , message});
    } catch (error) {
        res.status(500).json({ message: "Google authentication failed",error:error.message });
    }
};

export const LogoutUser = async (req, res) => {
    res.clearCookie('refreshToken');
    res.json({ message: "Logged out" });
};