import prisma from "../config/prisma.js";
import { getIO } from "../utils/socket.js";

export const inviteData = async (req, res) => {
  const uid = req.user.id;
  // console.log(uid);
  try {
    const data = await prisma.teaminvitation.findMany({
      where: {
        receiver_id: uid,
        status: "pending"
      }
    });
    // console.log(data);
    // if (!data) return res.status(404).json({ message: "No invite found" });
    res.status(200).json({ data });
  } catch (error) {
    console.log(error.message);
    console.log("inviteData");
    res.status(500).json({ message: error.message });
  }
}

export const sendInvite = async (req, res) => {

  const uemail = req.user.email
  const { email, org_id } = req.body;
  const io = getIO();
  try {
    const sender = await prisma.user.findUnique({
      where: {
        id: req.user.id
      },
      select: {
        name: true
      }
    })
    const receiver = await prisma.user.findUnique({
      where: { email }
    });
    // console.log("come");
    if (!receiver) return res.status(404).json({ message: "user does not exist in system" });
    // console.log("passes");

    if (uemail === email) {
      return res.status(404).json({ message: " something went wrong " });
    }
    // console.log(receiver);
    const existingInvite = await prisma.teaminvitation.findUnique({
      where: {
        receiver_id_org_id: {
          receiver_id: receiver.id,
          org_id: org_id
        }
      }
    });
    // console.log("ok1");
    if (existingInvite && existingInvite.status === "pending") {
      return res.status(404).json({ message: " something went wrong " });
    }

    if (existingInvite && existingInvite.status === "accepted") {
      return res.status(404).json({ message: " something went wrong " });
    }
    // console.log("ok");
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
          sender_id: req.user.id,
          status: "pending",
          message: `${sender.name} has invited you to join the organization`
        }
      });
    } else {
      invite = await prisma.teaminvitation.create({
        data: {
          sender_id: req.user.id,
          receiver_id: receiver.id,
          receiver_email: email,
          org_id: org_id,
          status: "pending",
          message: `${sender.name} has invited you to join the organization`
        }
      });
    }

    if (!receiver) {
      return res.status(404).json({ message: " something went wrong " });
    }

    io.to(`user:${receiver.id}`).emit("invite_received", { invite });
    return res.status(202).json({ invite });
  } catch (error) {
    console.log(error.message);
    console.log("sendInvite");
    res.status(404).json({ message: error.message });
  }
}

export const acceptInvite = async (req, res) => {
  const invite_id = Number(req.params.id);
  const io = getIO();
  try {
    const invite = await prisma.teaminvitation.update({
      where: { id: invite_id },
      data: { status: "accepted" }
    });
    const org = await prisma.org.update({
      where: { id: invite.org_id },
      data: {
        member_count: {
          increment: 1
        }
      }
    });
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
      where: {
        org_id: invite.org_id
      }
    })
    console.log("accept invite");
    io.to(`org_${org.id}`).emit("invite_accepted", { id: invite_id, status: "accepted" });
    io.to(`user:${invite.receiver_id}`).emit("joined_org", { org: org });
    res.status(200).json({ message: "successfully joined " });
  } catch (error) {
    console.log(error.message);
    console.log("acceptInvite");
    res.status(404).json({ message: error.message });
  }
}

export const rejectInvite = async (req, res) => {
  const invite_id = Number(req.params.id);
  const io = getIO();
  try {
    const receiver = await prisma.teaminvitation.update({
      where: { id: invite_id },
      data: { status: "rejected" }
    });
    const id = receiver.sender_id;
    io.to(`user:${id}`).emit("invite_rejected", { id: invite_id, status: "rejected" });
    res.status(200).json({ receiver });
  } catch (error) {
    console.log(error.message);
    console.log("rejectInvite");
    res.status(404).json({ message: error.message });
  }
}

export const DeleteInvite = async (req, res) => {
  const id = Number(req.params.id);
  const io = getIO();
  try {
    const invite = await prisma.teaminvitation.findUnique({
      where: {
        id: id
      }
    });
    await prisma.teaminvitation.delete({
      where: {
        id: invite.id
      }
    });
    if (invite.status === "accepted")
      await prisma.org_member.delete({
        where : {
          member_id_org_id : {
            member_id : invite.receiver_id,
            org_id : invite.receiver_id
          }
        }
      })
    
    io.to(`org_${invite.org_id}`).emit('invite Deleted', { id: invite.id });
    res.status(200).json({ message: "successfully Deleted" });
  } catch (error) {
    console.log(error.message);
    console.log("DeleteInvite");
    res.status(404).json({ message: error.message });
  }
}