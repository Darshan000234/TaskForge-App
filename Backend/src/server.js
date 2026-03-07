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

    if (user.email === "desaledarshan007@gmail.com" ) console.log("ok");
    
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

  socket.on("invite_user", async ({ email }) => {

    // console.log("invite receive");
    try {
      
      if (socket.user.email === email) {
        return socket.emit("invite_error", {
          message: "User not found"
        });
      }
      
      const existingInvite = await prisma.teaminvitation.findUnique({
        where: {
           sender_email_receiver_email: {
                sender_email: socket.user.email,
                receiver_email: email
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

      await prisma.teaminvitation.create({
        data: {
          sender_email: socket.user.email,
          receiver_email: email,
          status: "pending"
        }
      });
      console.log("invite sent through socket");
      io.to(email).emit("invite_received", {
        data : {
          sender_email: socket.user.name,
          status: "pending"
        }
      });

    } catch (err) {
      console.error(err);
    }

  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });

});


server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export { io };