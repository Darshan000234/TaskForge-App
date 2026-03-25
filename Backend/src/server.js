import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import prisma from "./config/prisma.js";

import userRoute from "./routes/User/UserRoute.js";
import orgRoute from "./routes/Organization/OrgRoute.js";
import inviteRoute from "./routes/User/inviteRoute.js";
import projectRoute from "./routes/Project/projectRoute.js";

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

app.use(cors({
  origin: URL,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.set("io",io);
app.use("/user", userRoute);
app.use("/orgs", orgRoute);
app.use("/invites", inviteRoute);
app.use("/org/proj", projectRoute);

// SOCKET AUTH
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


// SOCKET EVENTS
io.on("connection", (socket) => { 
 
  // console.log("user connected:", socket.id);
  // console.log("user:", socket.user.email);
  socket.join(`user:${socket.user.id}`);

  socket.on("join_org",async ({org})=>{
    const member = await prisma.org_member.findUnique({
      where : {
        member_id_org_id : {
          org_id : Number(org.id),
          member_id : socket.user.id
        }
      },
      select : {
        id : true
      }
    })
    // console.log(org.id);
    // console.log(socket.user.id);
    socket.join(`org_${member.id}`);
    // console.log(socket.user.email);
  });

  socket.on("join_proj",async ({proj})=>{
    socket.join(`project_${proj.id}`);
  });
  
  socket.on("invite_user", async ({ email, org_id }) => {
  
    // console.log("invite receive");
    try {
      const receiver = await prisma.user.findUnique({
        where: { email }
      });
      console.log("come");
      if (socket.user.email === email) {
        return socket.emit("invite_error", {
          message: "User not found"
        });
      }
      console.log(1);
      const existingInvite = await prisma.teaminvitation.findUnique({
        where: {
          receiver_id_org_id: {
            receiver_id: receiver.id,
            org_id: org_id
          }
        }
      });

      if (existingInvite && existingInvite.status === "pending") {
        return socket.emit("invite_error", {
          message: "User already invited"
        });
      }

      if (existingInvite && existingInvite.status === "accepted") {
        return socket.emit("invite_error", {
          message: "User already a member of the organization"
        });
      }

      let invite = null;
      let prev = true;
      if (existingInvite && existingInvite.status === "rejected") {
        prev = false;
        invite = await prisma.teaminvitation.update({
          where: {
            receiver_id_org_id: {
              receiver_id: receiver.id,
              org_id: org_id
            }
          },
          data: {
            sender_id: socket.user.id,
            status: "pending",
            message: `${socket.user.name} has invited you to join the organization`
          }
        });
      } else {
        invite = await prisma.teaminvitation.create({
          data: {
            sender_id: socket.user.id,
            receiver_id: receiver.id,
            receiver_email: email,
            org_id: org_id,
            status: "pending",
            message: `${socket.user.name} has invited you to join the organization`
          }
        });
      }

      if (!receiver) {
        return socket.emit("invite_error", { message: "User not found" });
      }

      console.log('sending');
      io.to(`user:${receiver.id}`).emit("invite_received", invite);
      if(prev) return socket.emit("sender_invite",invite);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("accept_invite", async ({ invite_id }) => {
    try {
      const invite = await prisma.teaminvitation.update({
        where: { id: invite_id },
        data: { status: "accepted" }
      });
      const org = await prisma.org.update({
        where: {id : invite.org_id},
        data:{
          member_count: {
            increment: 1
          }
        }
      })
      const id = invite.sender_id;
      await prisma.org_member.create({
        data: {
          org_id: invite.org_id,
          member_id: invite.receiver_id,
          member_email: invite.receiver_email
        }        
      })
      org.role = "member";
      const data = await prisma.teaminvitation.findMany({
        where : {
          org_id : invite.org_id
        }
      })
      io.to(`user:${id}`).emit("invite_accepted", { id: invite_id, status: "accepted" });
      return socket.emit("joined_org", { org: org , invite : data});
    } catch (err) {
      console.error(err);
    }
  });
  
  socket.on("reject_invite", async ({ invite_id }) => {
    try {
      const receiver = await prisma.teaminvitation.update({
        where: { id: invite_id },
        data: { status: "rejected" }
      });
      const id = receiver.sender_id;
      io.to(`user:${id}`).emit("invite_rejected", { id: invite_id, status: "rejected" });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("project_created", async ({ project, orgId }) => {
    // console.log("coming");
    // console.log(project.description);
    try {
      const user = await prisma.user.findUnique({
        where : {
          email : project.email
        }
      })
      const data = await prisma.project.create({
        data : {
          name : project.name,
          org_id : orgId,
          assigned_to : user.id,
          Description : project.description,
          status : project.status,
          priority : project.priority,
          endDate : new Date(project.endDate) 
        }
      });
    
      await prisma.proj_member.create({
        data : {
          proj_id : data.id,
          org_id : orgId,
          member_id : user.id,
          role : "manager"
        }
      })
      const member = await prisma.org_member.findUnique({
        where : {
          member_id_org_id : {
            org_id : orgId, 
            member_id : user.id
          }
        }
      })
      // console.log(member.id);
      io.to(`org_${member.id}`).emit("project_created", { project : data });
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("disconnect", () => {
    // console.log("user disconnected:", socket.id);
  });

});


server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export { io };