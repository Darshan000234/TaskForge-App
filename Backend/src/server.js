import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
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
import { perfNow, logPerformance } from "./utils/performance.js";
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
const port = process.env.PORT || 3000;
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
  credentials: true,
  exposedHeaders: ["X-Request-Id"],
}));

app.use(express.json());
app.use(cookieParser());

// Opt-in timings for the startup and dashboard API path.
// The request ID is returned to the browser so its round-trip time can be
// compared with the time spent inside Express.
const isStartupPerformanceRoute = (req) => {
  if (req.method === "POST" && req.path === "/user/refresh") return true;

  return req.method === "GET" && (
    req.path === "/orgs" ||
    req.path === "/orgs/activeorgs" ||
    /^\/orgs\/stats\/[^/]+$/.test(req.path) ||
    /^\/proj\/task\/stats\/[^/]+$/.test(req.path)
  );
};

app.use((req, res, next) => {
  if (
    process.env.PERFORMANCE_LOGS !== "true" ||
    !isStartupPerformanceRoute(req)
  ) {
    return next();
  }

  const startedAt = perfNow();
  const requestId = randomUUID();
  req.performanceRequestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.once("finish", () => {
    logPerformance({
      req,
      endpoint: `${req.method} ${req.path}`,
      statusCode: res.statusCode,
      startedAt,
    });
  });

  next();
});

// Health endpoint.
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});
app.use("/user", userRoute);
app.use("/orgs", authMiddleware, orgRoute);
app.use("/invites", authMiddleware, inviteRoute);
app.use("/orgs/proj", authMiddleware, projectRoute);
app.use("/proj/task", authMiddleware, TaskRoute);
app.use("/proj/team", authMiddleware, projectTeamRoute);
app.use("/proj/task/chat", authMiddleware, ChatRoute);
app.use("/audit", authMiddleware, AuditRoute);
app.use("/setting", authMiddleware, SettingRoute);


async function canAccessOrganization(userId, orgId) {
  const org = await prisma.org.findUnique({
    where: { id: orgId },
    select: { id: true, userId: true },
  });

  if (!org) return false;

  if (org.userId === userId) return true;

  const membership = await prisma.org_member.findUnique({
    where: {
      member_id_org_id: {
        member_id: userId,
        org_id: orgId,
      },
    },
    select: { role: true },
  });

  return Boolean(membership);
}

async function canAccessProject(userId, projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, org_id: true },
  });

  if (!project) return false;

  const org = await prisma.org.findUnique({
    where: { id: project.org_id },
    select: { userId: true },
  });

  if (!org) return false;

  if (org.userId === userId) return true;

  const membership = await prisma.org_member.findUnique({
    where: {
      member_id_org_id: {
        member_id: userId,
        org_id: project.org_id,
      },
    },
    select: { role: true },
  });

  if (!membership) return false;

  if (["admin", "manager"].includes(membership.role.toLowerCase())) {
    return true;
  }

  const projectMembership = await prisma.proj_member.findFirst({
    where: {
      proj_id: projectId,
      org_id: project.org_id,
      member_id: userId,
    },
    select: { id: true },
  });

  return Boolean(projectMembership);
}

async function canAccessTask(userId, taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      org_id: true,
      project_id: true,
      created_by: true,
    },
  });

  if (!task) return false;

  if (await canAccessProject(userId, task.project_id)) {
    return true;
  }

  if (!(await canAccessOrganization(userId, task.org_id))) {
    return false;
  }

  if (task.created_by === userId) return true;

  const assignment = await prisma.task_assignee.findFirst({
    where: {
      task_id: taskId,
      user_id: userId,
      org_id: task.org_id,
      proj_id: task.project_id,
    },
    select: { task_id: true },
  });

  return Boolean(assignment);
}


io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
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

  socket.on("join_org_member", async ({ id } = {}) => {
    const orgId = Number(id);

    if (!Number.isSafeInteger(orgId) || orgId <= 0) {
      return socket.emit("socket_error", {
        message: "Invalid organization ID",
      });
    }

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

      const orgMember = await prisma.org_member.findUnique({
        where: {
          member_id_org_id: {
            member_id: userId,
            org_id: orgId,
          },
        },
        select: { id: true },
      });

      if (!orgMember) {
        return socket.emit("socket_error", {
          message: "You do not have membership access to this organization",
        });
      }

      const room = `org_member_${orgMember.id}`;

      if (socket.rooms.has(room)) return;

      userData.orgMembers.add(orgMember.id);
      socket.join(room);
    } catch (err) {
      console.error("join_org_member error:", err);
    }
  });

  socket.on("join_proj", async ({ id } = {}) => {
    const projectId = Number(id);

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
      return socket.emit("socket_error", {
        message: "Invalid project ID",
      });
    }

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

      // NEW: authorize project access
      if (!(await canAccessProject(userId, projectId))) {
        return socket.emit("socket_error", {
          message: "You do not have access to this project",
        });
      }

      const room = `project_${projectId}`;

      if (socket.rooms.has(room)) return;

      userData.projects.add(projectId);
      socket.join(room);
    } catch (err) {
      console.error("join_proj error:", err);
    }
  });

  socket.on("join_task", async ({ id } = {}) => {
    const taskId = Number(id);

    if (!Number.isSafeInteger(taskId) || taskId <= 0) {
      return socket.emit("socket_error", {
        message: "Invalid task ID",
      });
    }

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

      // NEW: authorize task access
      if (!(await canAccessTask(userId, taskId))) {
        return socket.emit("socket_error", {
          message: "You do not have access to this task",
        });
      }

      const room = `task_${taskId}`;

      if (socket.rooms.has(room)) return;

      userData.tasks.add(taskId);
      socket.join(room);
    } catch (err) {
      console.error("join_task error:", err);
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

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});

export { io };


