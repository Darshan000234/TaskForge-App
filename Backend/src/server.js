import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import prisma from "./config/prisma.js";
import authMiddleware from "./middlewares/authMiddleware.js";
import { globalLimiter } from './middlewares/RateLimiter.js';
import { userSockets } from "./utils/userSockets.js";
import { redis } from './config/redis.js';
import { setIO } from "./utils/socket.js";
import { socketRateLimiter } from "./utils/socketRateLimiter.js";
import userRoute from "./routes/User/UserRoute.js";
import inviteRoute from "./routes/User/inviteRoute.js";
import TaskRoute from "./routes/Task/TaskRoute.js";
import projectTeamRoute from "./routes/ProjectTeam/projectTeamRoute.js";
import projectRoute from "./routes/Project/projectRoute.js";
import orgRoute from "./routes/Organization/OrgRoute.js";
import ChatRoute from "./routes/Chat/ChatRoute.js";
import AuditRoute from "./routes/Audit/AuditRoute.js";
import SettingRoute from "./routes/Setting/SettingRoute.js";

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

setIO(io);

app.use(cors({
  origin: URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use("/user", userRoute);
app.use("/orgs", authMiddleware, orgRoute);
app.use("/invites", authMiddleware, inviteRoute);
app.use("/orgs/proj", authMiddleware, projectRoute);
app.use("/proj/task", authMiddleware, TaskRoute);
app.use("/proj/team", authMiddleware, projectTeamRoute);
app.use("/proj/task/chat", authMiddleware, ChatRoute);
app.use("/audit", authMiddleware, AuditRoute);
app.use("/setting", authMiddleware, SettingRoute);

// health router to wake up render when he try to shut down 
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

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
    userSockets.set(userId, {
      sockets: new Set(),
      orgs: new Set(),
      orgMembers: new Set(),
      projects: new Set(),
      tasks: new Set(),
    });
  }

  const userData = userSockets.get(userId);

  if (userData.sockets.size >= 5) {
    socket.disconnect();
    return;
  }

  userData.sockets.add(socket.id);

  socket.join(`user:${socket.user.id}`);

  socket.on("join_org", async ({ id }) => {
    const orgId = Number(id);

    if (userData.orgs.has(orgId)) return;

    try {
      const isLimited = await socketRateLimiter({
        redis,
        key: `rate:socket:join_org:user:${userId}`,
        limit: 10,
        windowSec: 60,
      });

      if (isLimited) {
        return socket.emit("rate_limited", {
          message: "Too many organization joins.",
        });
      }

      userData.orgs.add(orgId);
      socket.join(`org_${orgId}`);
    } catch (err) {
      console.error("join_org limiter:", err);
    }
  });

  socket.on("join_org_member", async ({ id }) => {
    const orgId = Number(id);

    const orgMember = await prisma.org_member.findUnique({
      where: {
        member_id_org_id: {
          member_id: userId,
          org_id: orgId,
        },
      },
    });

    if (!orgMember) return;

    if (userData.orgMembers.has(orgMember.id)) return;

    try {
      const isLimited = await socketRateLimiter({
        redis,
        key: `rate:socket:join_org_member:user:${userId}`,
        limit: 20,
        windowSec: 60,
      });

      if (isLimited) {
        return socket.emit("rate_limited", {
          message: "Too many member joins.",
        });
      }

      userData.orgMembers.add(orgMember.id);
      socket.join(`org_member_${orgMember.id}`);
    } catch (err) {
      console.error("join_org_member limiter:", err);
    }
  });

  socket.on("join_proj", async ({ id }) => {
    const projectId = Number(id);

    if (userData.projects.has(projectId)) return;

    try {
      const isLimited = await socketRateLimiter({
        redis,
        key: `rate:socket:join_project:user:${userId}`,
        limit: 30,
        windowSec: 60,
      });

      if (isLimited) {
        return socket.emit("rate_limited", {
          message: "Too many project joins.",
        });
      }

      userData.projects.add(projectId);
      socket.join(`project_${projectId}`);
    } catch (err) {
      console.error("join_proj limiter:", err);
    }
  });

  socket.on("join_task", async ({ id }) => {
    const taskId = Number(id);

    if (userData.tasks.has(taskId)) return;

    try {
      const isLimited = await socketRateLimiter({
        redis,
        key: `rate:socket:join_task:user:${userId}`,
        limit: 50,
        windowSec: 60,
      });

      if (isLimited) {
        return socket.emit("rate_limited", {
          message: "Too many task joins.",
        });
      }

      userData.tasks.add(taskId);
      socket.join(`task_${taskId}`);
    } catch (err) {
      console.error("join_task limiter:", err);
    }
  });

  socket.on("disconnect", () => {
    const userData = userSockets.get(userId);

    if (!userData) return;

    userData.sockets.delete(socket.id);

    if (userData.sockets.size === 0) {
      userSockets.delete(userId);
    } else {
      userData.orgs.clear();
      userData.orgMembers.clear();
      userData.projects.clear();
      userData.tasks.clear();
    }
  });

});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export { io };
