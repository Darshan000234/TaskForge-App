import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import prisma from "./config/prisma.js";
import { userSockets } from "./utils/userSockets.js";
import userRoute from "./routes/User/UserRoute.js";
import orgRoute from "./routes/Organization/OrgRoute.js";
import inviteRoute from "./routes/User/inviteRoute.js";
import projectRoute from "./routes/Project/projectRoute.js";
import TaskRoute from "./routes/Task/TaskRoute.js";
import projectTeamRoute from "./routes/ProjectTeam/projectTeamRoute.js";

dotenv.config();

const app = express();
const port = 3000; 
const URL = process.env.CLIENT_URL;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: URL,
    credentials: true
  }
});

app.set("io", io);

app.use(cors({
  origin: URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use("/user", userRoute);
app.use("/orgs", orgRoute);
app.use("/invites", inviteRoute);
app.use("/orgs/proj", projectRoute);
app.use("/proj/task",TaskRoute);
app.use("/proj/team",projectTeamRoute);

io.use(async (socket, next) => {
  try {
    // console.log("use");
    const token = socket.handshake.auth.token;
    // console.log(token);
    if (!token) return next(new Error("Unauthorized"));

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN);

    const user = await prisma.user.findUnique({
      where: { email: decoded.email }
    });

    if (!user) return next(new Error("User not found"));

    socket.user = {
      email: user.email,
      name: user.name,
      id: user.id
    };
    // console.log(user);

    next();

  } catch (err) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", async (socket) => {
  const userId = socket.user.id;

  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }

  userSockets.get(userId).add(socket.id);
  const projects = await prisma.proj_member.findMany({
    where: { member_id: userId }
  });

  projects.forEach(p => {
    socket.join(`project_${p.proj_id}`);
  });
  // console.log("user connected:", socket.id);
  // console.log("user:", socket.user.email);
  socket.join(`user:${socket.user.id}`); 

  socket.on("join_org", async ({ id }) => {
    // console.log(org);
    socket.join(`org_${Number(id)}`);
  });

  socket.on("join_proj", async ({ id }) => { 
    socket.join(`project_${id}`);
  });

  socket.on("disconnect", () => {
    userSockets.get(userId)?.delete(socket.id);
  });

});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export { io };