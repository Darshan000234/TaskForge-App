import prisma from "../config/prisma.js";
import { getIO } from "../utils/socket.js";
import { userSockets } from "../utils/userSockets.js";
import { auditService } from "../services/audit.service.js";
import { Status } from "@prisma/client";

const A = { DELETED: "DELETED", UNASSIGNED: "UNASSIGNED" };
const RT = { TASK: "TASK", MEMBER: "MEMBER" };
const meta = (req) => ({ ip: req.ip, userAgent: req.headers["user-agent"] ?? null });

export const TeamData = async (req, res) => {
  const projectId = Number(req.params.id);
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;

  if (!projectId || isNaN(projectId)) {
    return res.status(400).json({ message: "Invalid project id" });
  }

  try {
    const members = await prisma.proj_member.findMany({
      take: limit + 1,
      ...(cursor && {
        skip: 1,
        cursor: {
          proj_id_member_id: {
            proj_id: projectId,
            member_id: cursor,
          },
        },
      }),
      where: {
        proj_id: projectId,
        role: { notIn: ["admin", "manager"] },
      },
      orderBy: { member_id: "asc" },

      select: {
        member_id: true,
        role: true,
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            _count: {
              select: {
                task_assignee: {
                  where: { proj_id: projectId },
                },
              },
            },
          },
        },
      },
    });

    const hasMore = members.length > limit;
    const page_slice = hasMore ? members.slice(0, limit) : members;

    const result = page_slice.map((m) => ({
      id: m.member.id,
      name: m.member.name,
      memberId: m.member_id,
      email: m.member.email,
      role: m.role,
      taskCount: m.member._count.task_assignee,
    }));

    const nextCursor = hasMore
      ? page_slice[page_slice.length - 1].member_id
      : null;

    res.status(200).json({ result, nextCursor, hasMore });
  } catch (error) {
    console.error("TeamData:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const DeleteMember = async (req, res) => {
  const user_id = req.body.user_id;
  const id = Number(req.params.id);
  const userId = req.user.id;
  const io = getIO();

  try {
    const removedUser = await prisma.user.findUnique({
      where: { id: user_id },
      select: { id: true, name: true, email: true },
    });

    const projMember = await prisma.proj_member.findUnique({
      where: { proj_id_member_id: { proj_id: id, member_id: user_id } },
      select: { org_id: true, role: true },
    });

    await prisma.proj_member.delete({
      where: { proj_id_member_id: { proj_id: id, member_id: user_id } },
    });

    const task = await prisma.task_assignee.deleteMany({
      where: { proj_id: id, user_id },
    });

    io.to(`proj_${id}`).emit("Member Deleted", { id: user_id });

    auditService.log({
      orgId: projMember?.org_id ?? null,
      proj_id: id,
      userId,
      action: A.DELETED,
      resourceType: RT.MEMBER,
      resourceId: user_id,
      oldValue: {
        removedUser: { id: removedUser.id, name: removedUser.name, email: removedUser.email },
        role: projMember?.role ?? null,
        tasksUnassigned: task.count,
      },
      metadata: meta(req),
    });

    return res.status(202).json({ message: "deleted user from project successfully" });
  } catch (error) {
    console.error("DeleteMember:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  const { task_id, user_id } = req.body;
  const userId = req.user.id;
  const io = getIO();

  try {
    const [removedUser, taskInfo] = await Promise.all([
      prisma.user.findUnique({ where: { id: user_id }, select: { id: true, name: true, email: true } }),
      prisma.task.findUnique({ where: { id: task_id }, select: { id: true, name: true, org_id: true, project_id: true } }),
    ]);

    const data = await prisma.task_assignee.delete({
      where: { task_id_user_id: { user_id, task_id } },
    });

    io.to(`proj_${data.proj_id}`).emit("removed member", { task_id, user_id });
    io.to(`task_${data.task_id}`).emit("updateTask", { id: data.task_id });

    auditService.log({
      orgId: taskInfo?.org_id ?? null,
      proj_id: taskInfo?.project_id ?? null,
      userId,
      action: A.UNASSIGNED,
      resourceType: RT.TASK,
      resourceId: task_id,
      oldValue: { removedAssignee: removedUser, taskName: taskInfo?.name },
      metadata: { diff: { removed: [removedUser] }, ...meta(req) },
    });

    return res.status(202).json({ message: "successfully deleted" });
  } catch (error) {
    console.error("deleteTask (TeamController):", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const manyTeamData = async (req, res) => {
  const projectId = Number(req.params.id);
  const memberIds = req.body.memberIds;

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return res.status(400).json({ message: "memberIds must be a non-empty array" });
  }

  try {
    const members = await prisma.proj_member.findMany({
      where: {
        proj_id: projectId,
        member_id: { in: memberIds },
        role: {
          not: "manager"
        }
      },
      select: {
        member_id: true,
        role: true,
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            task_assignee: {
              where: { proj_id: projectId },
              select: {
                task: {
                  select: {
                    id: true,
                    name: true,
                    Status: true,
                    priority: true,
                    dueDate: true
                  }
                }
              }
            }
          }
        }
      }
    });


    const result = members.map(m => ({
      name: m.member.name,
      memberId: m.member_id,
      email: m.member.email,
      role: m.role,
      tasks: m.member.task_assignee.map(a => a.task)
    }));

    res.status(200).json({ result });
  } catch (error) {
    console.log("manyTeamData error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const teamTaskData = async (req,res) => {
  
  const member_id = Number(req.params.member_id);
  const proj_id = Number(req.params.proj_id);
  // console.log(member_id,proj_id);
  
  try {

    const data = await prisma.task_assignee.findMany({
      where : {
        proj_id : proj_id
      },
      select : {
        task_id : true,
        task : {
          select : {
            name : true,
            priority : true,
            Status : true,
          }
        }
      }  
    })

    const result = data.map((t)=>{
      return {
        id : t.task_id,
        name : t.task.name,
        priority : t.task.priority,
        Status : t.task.Status
      }
    });
    
    res.status(202).json({ result });
  } catch (error) {
    console.log("teamTaskData",error.message);
    res.status(404).json({ message : error.message });
  }
};