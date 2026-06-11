import bcrypt from 'bcrypt';
import axios from 'axios';
import prisma from '../config/prisma.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateTokens.js';
import { getIO } from "../utils/socket.js";
const URL = process.env.GOOGLE_URL;

export const registerUser = async (req, res) => {
    
    const { fullName, email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        return res.status(400).json({ message: "User already exists" });
    }
    const name  = await prisma.user.findFirst({ where : { name : fullName}});
    if(name){
        return res.status(204).json({ message : "username should be unique"});
    }
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
        data: { name:fullName, email, password: hashed }
    });
    const accesstoken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

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
    const refreshToken = generateRefreshToken(user);

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

export const userData = async (req,res) => {    
    try { 
        const user = await prisma.user.findUnique({
            where : {
                id : req.user.id
            },
            select : {
                id : true,
                name : true,
                email : true
            }
        })
        // console.log(user);
        
        res.status(202).json({ data : user});
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}

export const DeleteAccount = async (req, res) => {
  const id = req.user.id;
  const io = getIO();
  try {
    const org = await prisma.org_member.findMany({
        where : {
            member_id : id
        }
    })
    await prisma.user.delete({
        where : {
            id : id
        }
    });
    org.forEach((o)=>{
        io.to(`org_${o.org_id}`).emit("member_removed",{id : id});
    });
    res.clearCookie('refreshToken');
    res.status(202).json({ message : "deleted account successfully "});
  } catch (error) {
    res.status(404).json({message : error.message});
  }
}