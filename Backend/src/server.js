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

dotenv.config();

const app = express();
const port = 3000;
const URL = process.env.CLIENT_URL;

app.use(cors({
  origin: URL,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/user", userRoute);
app.use("/orgs", orgRoute);
app.use("/invites", inviteRoute);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: URL,
    credentials: true
  }
});

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

    socket.join(user.email);

    next();

  } catch (err) {
    next(new Error("Invalid token"));
  }
});


// SOCKET EVENTS
io.on("connection", (socket) => {

  // console.log("user connected:", socket.id);
  // console.log("user:", socket.user.email);

  socket.on("invite_user", async ({ email , org_id }) => {

    // console.log("invite receive");
    try {
      
      // console.log("come");
      if (socket.user.email === email) {
        return socket.emit("invite_error", {
          message: "User not found"
        });
      }
      // console.log(1);
      const existingInvite = await prisma.teaminvitation.findUnique({
        where: {
          receiver_email_org_id: {
            receiver_email: email,
            org_id: org_id
          }
        }
      });

      if (existingInvite && existingInvite.status === "pending" ) {
        return socket.emit("invite_error", {
          message: "User already invited"
        });
      }

      if(existingInvite && existingInvite.status === "accepted") {
        return socket.emit("invite_error", {
          message: "User already a member of the organization"
        });
      }
      
      const invite = null;
      if(existingInvite && existingInvite.status === "rejected") {
        invite = await prisma.teaminvitation.update({
            where : {
              receiver_email_org_id : {
                receiver_email: email,
                org_id: org_id
              }
            },
            data : {
              sender_email: socket.user.email,
              status: "pending",
              message: `${socket.user.name} has invited you to join the organization`
            }
        });
      }else{
        invite = await prisma.teaminvitation.create({
          data: {
            sender_email: socket.user.email,
            receiver_email: email,
            org_id: org_id,
            status: "pending",
            message: `${socket.user.name} has invited you to join the organization`
          }
        });
      }

      io.to(email).emit("invite_received", invite);

    } catch (err) {
      console.error(err);
    }

  });

  socket.on("accept_invite", async ({ invite_id, org_id }) => {
    try {
      await prisma.teaminvitation.update({
        where: { id: invite_id, org_id: org_id },
        data: { status: "accepted" }
      });
      console.log("invite accepted");
      socket.emit("invite_accepted", { id : invite_id, status: "accepted" });
    }catch (err){
      console.error(err);
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