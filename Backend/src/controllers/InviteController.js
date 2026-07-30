import prisma from "../config/prisma.js";
import { getIO } from "../utils/socket.js";
import { auditService } from "../services/audit.service.js";
import { inviteQueue } from "../queue/inviteQueue.js";
import { redis } from "../config/redis.js";
import { userSockets } from "../utils/userSockets.js";

const RT = { MEMBER: "MEMBER", ORG: "ORG" };
const meta = (req) => ({ ip: req.ip, userAgent: req.headers["user-agent"] ?? null });

export const inviteData = async (req, res) => {
  const uid = req.user.id;
  const cacheKey = `invites:${uid}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({ data: JSON.parse(cached) });
    }

    const data = await prisma.teaminvitation.findMany({
      where: {
        receiver_id: uid,
        status: "pending"
      }
    });

    await redis.set(cacheKey, JSON.stringify(data), "EX", 60);

    res.status(200).json({ data });
  } catch (error) {
    console.log(error.message);
    console.log("inviteData");
    res.status(500).json({ message: error.message });
  }
}

export const sendInvite = async (req, res) => {
  const uemail = req.user.email;
  const { email, org_id } = req.body;
  const userId = req.user.id;
  const io = getIO();

  try {
    const sender = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const receiver = await prisma.user.findUnique({ where: { email } });

    if (!receiver) return res.status(404).json({ message: "user does not exist in system" });
    if (uemail === email) return res.status(400).json({ message: "something went wrong" });

    const existingInvite = await prisma.teaminvitation.findUnique({
      where: { receiver_id_org_id: { receiver_id: receiver.id, org_id } },
    });

    if (existingInvite?.status === "pending") return res.status(400).json({ message: "invite already pending" });
    if (existingInvite?.status === "accepted") return res.status(400).json({ message: "user already a member" });

    let invite;
    if (existingInvite?.status === "rejected") {
      invite = await prisma.teaminvitation.update({
        where: { receiver_id_org_id: { receiver_id: receiver.id, org_id } },
        data: { sender_id: userId, status: "pending", message: `${sender.name} has invited you to join the organization` },
      });
    } else {
      invite = await prisma.teaminvitation.create({
        data: { sender_id: userId, receiver_id: receiver.id, receiver_email: email, org_id, status: "pending", message: `${sender.name} has invited you to join the organization` },
      });
    }
    // console.log(invite);
    
    io.to(`user:${receiver.id}`).emit("invite_received", { invite });
    await redis.del(`invites:${receiver.id}`);

    auditService.log({
      orgId: org_id, userId,
      action: "CREATED", resourceType: RT.MEMBER, resourceId: invite.id,
      newValue: { invitedEmail: email, status: "pending" },
      metadata: meta(req),
    });
    const org = await prisma.org.findUnique({ where: { id: org_id }, select: { name: true } });
    const data = {
      name: receiver.name,
      email: email,
      org_name: org.name
    }
    await inviteQueue.add(
      "send_invite_email",
      data,
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
    return res.status(202).json({ invite });
  } catch (error) {
    console.error("sendInvite:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const acceptInvite = async (req, res) => {
  const invite_id = Number(req.params.id);
  const userId = req.user.id;
  const io = getIO();

  try {
    const invite = await prisma.teaminvitation.update({
      where: { id: invite_id }, data: { status: "accepted" },
    });

    const org = await prisma.org.update({
      where: { id: invite.org_id }, data: { member_count: { increment: 1 } },
    });

    await prisma.org_member.create({
      data: { org_id: invite.org_id, member_id: invite.receiver_id, member_email: invite.receiver_email },
    });

    org.role = "member";
    io.to(`org_${org.id}`).emit("invite_accepted", { id: invite_id, status: "accepted" });
    io.to(`user:${invite.receiver_id}`).emit("joined_org", { org });

    await redis.del(`invites:${invite.receiver_id}`, `user:${invite.receiver_id}:organizations`);

    auditService.log({
      orgId: invite.org_id, userId,
      action: "CREATED", resourceType: RT.MEMBER, resourceId: invite.receiver_id,
      newValue: { joinedEmail: invite.receiver_email, role: "member" },
      metadata: { inviteId: invite_id, ...meta(req) },
    });

    return res.status(200).json({ message: "successfully joined" });
  } catch (error) {
    console.error("acceptInvite:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const rejectInvite = async (req, res) => {
  const invite_id = Number(req.params.id);
  const userId = req.user.id;
  const io = getIO();

  try {
    const receiver = await prisma.teaminvitation.update({
      where: { id: invite_id }, data: { status: "rejected" },
    });

    io.to(`user:${receiver.sender_id}`).emit("invite_rejected", { id: invite_id, status: "rejected" });
    await redis.del(`invites:${receiver.receiver_id}`);

    auditService.log({
      orgId: receiver.org_id, userId,
      action: "UPDATED", resourceType: RT.MEMBER, resourceId: invite_id,
      oldValue: { status: "pending" }, newValue: { status: "rejected" },
      metadata: { inviteId: invite_id, ...meta(req) },
    });

    return res.status(200).json({ receiver });
  } catch (error) {
    console.error("rejectInvite:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const DeleteInvite = async (req, res) => {
  const id = Number(req.params.id);
  const userId = req.user.id;
  const io = getIO();

  try {
    const invite = await prisma.teaminvitation.findUnique({
      where: { id },
    });

    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    let projectIds = [];
    let taskIds = [];

    if (invite.status === "accepted") {
      const [projectMemberships, taskAssignments] = await Promise.all([
        prisma.proj_member.findMany({
          where: {
            org_id: invite.org_id,
            member_id: invite.receiver_id,
          },
          select: {
            proj_id: true,
          },
        }),

        prisma.task_assignee.findMany({
          where: {
            org_id: invite.org_id,
            user_id: invite.receiver_id,
          },
          select: {
            task_id: true,
          },
        }),
      ]);

      projectIds = projectMemberships.map((p) => p.proj_id);
      taskIds = taskAssignments.map((t) => t.task_id);

      await prisma.$transaction([
        prisma.project.updateMany({
          where: {
            org_id: invite.org_id,
            assigned_to: invite.receiver_id,
          },
          data: {
            assigned_to: null,
          },
        }),

        prisma.proj_member.deleteMany({
          where: {
            org_id: invite.org_id,
            member_id: invite.receiver_id,
          },
        }),

        prisma.task_assignee.deleteMany({
          where: {
            org_id: invite.org_id,
            user_id: invite.receiver_id,
          },
        }),

        prisma.org_member.delete({
          where: {
            member_id_org_id: {
              member_id: invite.receiver_id,
              org_id: invite.org_id,
            },
          },
        }),

        prisma.teaminvitation.delete({
          where: {
            id: invite.id,
          },
        }),
      ]);
    } else {
      await prisma.teaminvitation.delete({
        where: {
          id: invite.id,
        },
      });
    }

    await redis.del(`invites:${invite.receiver_id}`);

    if (invite.status === "accepted") {
      await redis.del(`user:${invite.receiver_id}:organizations`);
    }

    auditService.log({
      orgId: invite.org_id,
      userId,
      action: "DELETED",
      resourceType: RT.MEMBER,
      resourceId: String(invite.receiver_id),
      oldValue: {
        email: invite.receiver_email,
        status: invite.status,
      },
      metadata: meta(req),
    });

    if (invite.status === "accepted") {
      io.to(`org_${invite.org_id}`).emit("member left", {
        userId: invite.receiver_id,
        email: invite.receiver_email,
        updatedProjects: projectIds,
        updatedTasks: taskIds,
      });

      io.to(`user_${invite.receiver_id}`).emit("member left", {
        orgId: invite.org_id,
      });
    } else {
      io.to(`org_${invite.org_id}`).emit("invite Deleted", {
        id: invite.id,
      });

      io.to(`user_${invite.receiver_id}`).emit("invite Deleted", {
        id: invite.id,
      });
    }

    const userData = userSockets.get(invite.receiver_id);

    if (userData) {
      for (const socketId of userData.sockets) {
        const socket = io.sockets.sockets.get(socketId);

        if (!socket) continue;

        socket.leave(`org_${invite.org_id}`);

        for (const roomId of projectIds) {
          socket.leave(`project_${roomId}`);
        }

        for (const roomId of taskIds) {
          socket.leave(`task_${roomId}`);
        }

        socket.leave(`org_member_${invite.org_id}`);
      }

      userData.orgs.delete(invite.org_id);
      userData.orgMembers.delete(invite.org_id);

      projectIds.forEach((id) => userData.projects.delete(id));
      taskIds.forEach((id) => userData.tasks.delete(id));
    }

    return res.status(200).json({
      message: "Successfully deleted",
    });
  } catch (error) {
    console.error("DeleteInvite:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};
