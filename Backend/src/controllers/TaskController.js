import prisma from "../config/prisma.js";
import { getIO } from "../utils/socket.js";
import { userSockets } from "../utils/userSockets.js";
import { auditService } from "../services/audit.service.js";
import { diffObjects, diffAssignees } from "../utils/diff.js";
import { reminderQueue } from "../queue/reminderQueue.js";
import { redis } from "../config/redis.js";
import { buildDueWhere } from "../utils/taskDueFilter.js";

const invalidateTaskCaches = async ({ taskId, projectId, orgId }) => {
  const keys = [];
  if (taskId) keys.push(`task:${taskId}`, `taskAssignees:${taskId}`);
  if (orgId) {
    const statsKeys = await redis.keys(`taskStats:${orgId}:*`);
    keys.push(...statsKeys);
    const orgTaskKeys = await redis.keys(`orgTasks:${orgId}:*`);
    keys.push(...orgTaskKeys);
    const orgStatsKeys = await redis.keys(`stats:*:${orgId}`);
    keys.push(...orgStatsKeys);
  }
  if (keys.length) await redis.del(...keys);
};

const A = { CREATED: "CREATED", UPDATED: "UPDATED", DELETED: "DELETED", ASSIGNED: "ASSIGNED", UNASSIGNED: "UNASSIGNED", STATUS_CHANGED: "STATUS_CHANGED", PRIORITY_CHANGED: "PRIORITY_CHANGED" };
const RT = { TASK: "TASK", PROJECT: "PROJECT", MEMBER: "MEMBER", ORG: "ORG" };
const meta = (req) => ({ ip: req.ip, userAgent: req.headers["user-agent"] ?? null });

export const TaskData = async (req, res) => {
  const proj_id = Number(req.params.proj_id);
  const { cursor, limit = 10, status, priority, search, due } = req.query;

  try {

    const take = Number(limit) + 1;
    const dueWhere = buildDueWhere(due);

    // Build status conditions as an array first so status + due=overdue
    // (both target Status) combine via AND instead of one overwriting
    // the other through object-key collision.
    const statusConditions = [];
    if (status) statusConditions.push({ Status: status });
    if (dueWhere.Status) statusConditions.push({ Status: dueWhere.Status });
    const member = await prisma.proj_member.findUnique({
      where: {
        proj_id_member_id: {
          proj_id: proj_id,
          member_id: req.user.id
        }
      }
    })
    const where = {
      project_id: proj_id,
      ...(member.role === "member" && {
        assignees: {
          some: {
            user_id: req.user.id,
          },
        },
      }),
      ...(priority && { priority }),
      ...(dueWhere.dueDate && { dueDate: dueWhere.dueDate }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { Description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(statusConditions.length === 1 && statusConditions[0]),
      ...(statusConditions.length > 1 && { AND: statusConditions }),
    };

    const tasks = await prisma.task.findMany({
      where,
      take,
      ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),
      orderBy: { id: "desc" },
      select: {
        id: true,
        name: true,
        Description: true,
        Status: true,
        priority: true,
        dueDate: true,
        _count: { select: { assignees: true } },
      },
    });

    const hasMore = tasks.length > Number(limit);
    if (hasMore) tasks.pop();

    const result = tasks.map((t) => ({
      id: t.id,
      name: t.name,
      Description: t.Description,
      Status: t.Status,
      priority: t.priority,
      dueDate: t.dueDate,
      assigneeCount: t._count.assignees,
      assignees: null,
    }));

    const nextCursor = hasMore ? tasks[tasks.length - 1].id : null;
    const result_payload = { result, nextCursor, hasMore };
    res.status(200).json(result_payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const OneTaskData = async (req, res) => {
  const id = Number(req.params.id);
  const cacheKey = `task:${id}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(202).json({ result: JSON.parse(cached) });
    }

    const tasks = await prisma.task.findUnique({
      where: { id: id },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        project: {
          select: {
            name: true
          }
        }
      }
    });

    if (!tasks) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    const result = {
      id: tasks.id,
      name: tasks.name,
      Description: tasks.Description,
      Status: tasks.Status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      projectId: tasks.project_id,
      proj_name: tasks.project.name,
      orgId: tasks.org_id,
      assignees: tasks.assignees.map(a => a.user)
    };

    await redis.set(cacheKey, JSON.stringify(result), "EX", 60);

    res.status(202).json({ result });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}

export const addmemberData = async (req, res) => {
  const projectId = Number(req.params.proj_id);
  const org_id = Number(req.params.org_id);
  const task_id = Number(req.params.id);
  // console.log(projectId);

  try {
    const proj = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!proj) {
      return res.status(404).json({ message: "Project not found" });
    }

    const assignedUsers = await prisma.task_assignee.findMany({
      where: { task_id },
      select: { user_id: true },
    });

    const assignedIds = assignedUsers.map((u) => u.user_id);

    const users = await prisma.org_member.findMany({
      where: {
        org_id,
        role: { not: "admin" },
        member_id: {
          notIn: [...assignedIds, proj.assigned_to],
        },
      },
      select: {
        member_id: true,
        member_email: true
      },
    });

    const formatted = users.map((u) => ({
      receiver_id: u.member_id,
      receiver_email: u.member_email,
    }));

    res.status(200).json({ member: formatted });

  } catch (error) {
    console.log("addmemberData");
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const AddTask = async (req, res) => {
  const data = req.body.task;
  const projectId = Number(req.body.proj_id);
  const orgId = Number(req.body.orgId);
  const userId = req.user.id;
  const io = getIO();
  const userIds = data.assignees;

  if (!data || !Array.isArray(data.assignees))
    return res.status(400).json({ message: "Invalid task data" });

  const validMembers = await prisma.org_member.findMany({
    where: {
      org_id: orgId,
      member_id: {
        in: userIds,
      },
    },
    select: {
      member_id: true,
    },
  });

  if (validMembers.length !== userIds.length) {
    return res.status(404).json({
      message: "One or more selected users are no longer part of the organization.",
    });
  }

  try {
    const memberIds = data.assignees;
    const existingMembers = await prisma.proj_member.findMany({
      where: { proj_id: projectId }, select: { member_id: true },
    });
    const existingIds = new Set(existingMembers.map((m) => m.member_id));
    const newMembers = memberIds.filter((id) => !existingIds.has(id));

    if (newMembers.length > 0) {
      await prisma.proj_member.createMany({
        data: newMembers.map((uid) => ({ proj_id: projectId, org_id: orgId, member_id: uid, role: "member" })),
        skipDuplicates: true,
      });
    }

    const task = await prisma.task.create({
      data: {
        name: data.name, Description: data.Description, Status: data.Status,
        priority: data.priority, dueDate: new Date(data.dueDate),
        project_id: projectId, org_id: orgId,
      },
    });
    task.dueDate = data.dueDate;

    await prisma.task_assignee.createMany({
      data: memberIds.map((id) => ({ task_id: task.id, user_id: id, proj_id: projectId, org_id: orgId })),
      skipDuplicates: true,
    });

    newMembers.forEach((uid) => {
      const sockets = userSockets.get(uid);
      if (sockets) sockets.forEach((sid) => io.to(sid).emit("add_proj", { projectId }));
    });

    const createdTask = await prisma.task.findUnique({
      where: { id: task.id },
      include: { assignees: { include: { user: true } } },
    });

    const result = {
      id: createdTask.id, name: createdTask.name, Description: createdTask.Description,
      Status: createdTask.Status, priority: createdTask.priority, dueDate: createdTask.dueDate,
      projectId: createdTask.project_id, orgId: createdTask.org_id,
      assignees: createdTask.assignees.map((a) => a.user),
    };

    // console.log(result);
    

    io.to(`project_${projectId}`).emit("add_task", { task: result });
    io.to(`project_${projectId}`).emit("add task", { memberIds });

    await invalidateTaskCaches({ projectId, orgId });

    auditService.log({
      orgId, proj_id: projectId, userId,
      action: A.CREATED, resourceType: RT.TASK, resourceId: result.id,
      newValue: { name: result.name, Status: result.Status, priority: result.priority, dueDate: result.dueDate, assignees: result.assignees.map((u) => ({ id: u.id, name: u.name })) },
      metadata: meta(req),
    });
    const REMINDER_OFFSET = 60 * 60 * 1000;
    const dueDate = new Date(task.dueDate);
    const delay = dueDate.getTime() - Date.now() - REMINDER_OFFSET;
    const taskId = task.id;
    await reminderQueue.add(
      "task_reminder",
      { taskId },
      {
        delay: Math.max(0, delay),
        jobId: `task_reminder_${taskId}`,
      }
    );
    return res.status(202).json({ task: result });
  } catch (error) {
    console.error("AddTask:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const DeleteTask = async (req, res) => {
  const tid = req.body.id;
  const userId = req.user.id;
  const io = getIO();

  try {
    const [memberIds, oldTask] = await Promise.all([
      prisma.task_assignee.findMany({ where: { task_id: tid }, select: { user_id: true } }),
      prisma.task.findUnique({
        where: { id: tid },
        select: { id: true, name: true, Status: true, priority: true, dueDate: true, project_id: true, org_id: true },
      }),
    ]);

    if (!oldTask) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }
    
    const task = await prisma.task.delete({ where: { id: tid } });

    io.to(`project_${task.project_id}`).emit("task_deleted", { taskId: tid, memberIds });
    io.to(`task_${tid}`).emit("deleteTask", { pid: task.project_id });

    await invalidateTaskCaches({ taskId: tid, projectId: oldTask.project_id, orgId: oldTask.org_id });

    auditService.log({
      orgId: oldTask.org_id, proj_id: oldTask.project_id, userId,
      action: A.DELETED, resourceType: RT.TASK, resourceId: tid,
      oldValue: { name: oldTask.name, Status: oldTask.Status, priority: oldTask.priority, dueDate: oldTask.dueDate },
      metadata: meta(req),
    });

    return res.status(202).json({ message: "deleted task" });
  } catch (error) {
    console.error("DeleteTask:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const RemoveMemeber = async (req, res) => {
  const id = Number(req.params.id);
  const { user_id } = req.body;
  const userId = req.user.id;
  const io = getIO();

  try {
    const task = await prisma.task.findUnique({
      where: { id: id },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        project: {
          select: {
            name: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    const removedUser = await prisma.task_assignee.findUnique({
      where: { task_id_user_id: { task_id: id, user_id } },
    });

    if (!removedUser) {
      return res.status(404).json({
        message: "selected users are no longer part of the task.",
      });
    }
    
    const data = await prisma.task_assignee.delete({
      where: { task_id_user_id: { task_id: id, user_id } },
    });

    await invalidateTaskCaches({ taskId: id, orgId: data.org_id });
    await redis.del(`memberTasks:${data.proj_id}:${user_id}`);

    const sockets = userSockets.get(user_id);

    if (sockets) {
      for (socketId of sockets) {
        const socket = io.sockets.sockets.get(socketId);

        if (!socket) continue;
        socket.leave(`task_{id}`);
      }
    }
    io.to(`proj_${data.proj_id}`).emit("removed member", { task_id: id, user_id });
    io.to(`task_${id}`).emit("updateTask", task);
    auditService.log({
      orgId: data.org_id, proj_id: data.proj_id, userId,
      action: A.UNASSIGNED, resourceType: RT.TASK, resourceId: id,
      oldValue: { removedAssignee: removedUser },
      metadata: { diff: { removed: [removedUser] }, ...meta(req) },
    });

    return res.status(202).json({ message: "deleted Successfully" });
  } catch (error) {
    console.error("RemoveMemeber:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const addmember = async (req, res) => {
  const id = Number(req.params.id);
  let { users, org_id } = req.body;
  const userId = req.user.id;
  const io = getIO();
  // console.log(org_id);
  try {
    if (!users) return res.status(400).json({ message: "users is required" });
    users = Array.isArray(users) ? users : [users];
    if (!users.length) return res.status(400).json({ message: "users array cannot be empty" });
    if (users.some((u) => !u.receiver_id)) return res.status(400).json({ message: "Invalid user format" });

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const prevAssignees = await prisma.task_assignee.findMany({
      where: { task_id: id }, include: { user: { select: { id: true, name: true } } },
    });
    const oldAssigneeList = prevAssignees.map((a) => a.user);
    const userIds = users.map(u => u.receiver_id);

    const validMembers = await prisma.org_member.findMany({
      where: {
        org_id: task.org_id,
        member_id: {
          in: userIds,
        },
      },
      select: {
        member_id: true,
      },
    });

    if (validMembers.length !== userIds.length) {
      return res.status(404).json({
        message: "One or more selected users are no longer part of the organization.",
      });
    }

    await prisma.task_assignee.createMany({
      data: users.map((u) => ({ task_id: id, user_id: u.receiver_id, proj_id: task.project_id, org_id: task.org_id })),
      skipDuplicates: true,
    });

    await Promise.all(users.map(async (u) => {
      const exists = await prisma.proj_member.findUnique({
        where: { proj_id_member_id: { proj_id: task.project_id, member_id: u.receiver_id } },
      });
      if (!exists) {
        await prisma.proj_member.create({
          data: { proj_id: task.project_id, member_id: u.receiver_id, org_id, role: "member" },
        });
        io.to(`org_member_${task.org_id}`).emit("project_created", { proj_id: task.project_id });
      }
    }));
    const updated = await prisma.task.findUnique({
      where: { id: id },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        project: {
          select: {
            name: true
          }
        }
      }
    });
    const newUsers = await prisma.user.findMany({
      where: { id: { in: users.map((u) => u.receiver_id) } },
      select: { id: true, email: true, name: true },
    });

    io.to(`proj_${task.project_id}`).emit("member_added", { members: newUsers });
    io.to(`proj_${task.project_id}`).emit("Add member", newUsers.map((u) => ({ id: u.id })));
    io.to(`task_${id}`).emit("updateTask", updated);

    await invalidateTaskCaches({ taskId: id, orgId: task.org_id });
    await Promise.all(
      users.map((u) => redis.del(`memberTasks:${task.project_id}:${u.receiver_id}`))
    );

    const assigneeDiff = diffAssignees(
      oldAssigneeList,
      [...oldAssigneeList, ...newUsers.map((u) => ({ id: u.id, name: u.name }))],
    );

    if (assigneeDiff.added.length > 0) {
      auditService.log({
        orgId: task.org_id, proj_id: task.project_id, userId,
        action: A.ASSIGNED, resourceType: RT.TASK, resourceId: id,
        oldValue: { assignees: oldAssigneeList },
        newValue: { assignees: newUsers },
        metadata: { diff: assigneeDiff, ...meta(req) },
      });
    }

    return res.status(201).json({ result: { taskId: id, members: newUsers } });
  } catch (error) {
    console.error("addmember:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const UpdateTask = async (req, res) => {
  const { data } = req.body;
  const userId = req.user.id;

  try {
    const oldTask = await prisma.task.findUnique({
      where: { id: Number(data.id) },
      select: { id: true, name: true, Description: true, Status: true, priority: true, dueDate: true, project_id: true, org_id: true },
    });
    if (!oldTask) return res.status(404).json({ message: "Task not found" });

    const updated = await prisma.task.update({
      where: { id: Number(data.id) },
      data: { name: data.name, Description: data.Description, Status: data.Status, priority: data.priority, dueDate: new Date(data.dueDate) },
      select: { id: true, name: true, Description: true, Status: true, priority: true, dueDate: true },
    });

    const diff = diffObjects(oldTask, updated, ["id", "project_id", "org_id"]);

    const changedKeys = Object.keys(diff);
    let action = A.UPDATED;
    if (changedKeys.length === 1 && changedKeys[0] === "Status") action = A.STATUS_CHANGED;
    if (changedKeys.length === 1 && changedKeys[0] === "priority") action = A.PRIORITY_CHANGED;

    auditService.log({
      orgId: oldTask.org_id, proj_id: oldTask.project_id, userId,
      action, resourceType: RT.TASK, resourceId: data.id,
      oldValue: { name: oldTask.name, Description: oldTask.Description, Status: oldTask.Status, priority: oldTask.priority, dueDate: oldTask.dueDate },
      newValue: { name: updated.name, Description: updated.Description, Status: updated.Status, priority: updated.priority, dueDate: updated.dueDate },
      metadata: { diff, ...meta(req) },
    });

    await invalidateTaskCaches({ taskId: updated.id, orgId: oldTask.org_id });

    await reminderQueue.remove(`task_reminder_${updated.id}`);
    const REMINDER_OFFSET = 60 * 60 * 1000;
    const dueDate = new Date(updated.dueDate);
    const delay = dueDate.getTime() - Date.now() - REMINDER_OFFSET;
    const taskId = updated.id;
    await reminderQueue.add(
      "task_reminder",
      { taskId },
      {
        delay: Math.max(0, delay),
        jobId: `task_reminder_${taskId}`,
      }
    );
    return res.status(202).json({ message: "successfully updated" });
  } catch (error) {
    console.error("UpdateTask:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const StatsData = async (req, res) => {
  const org_id = Number(req.params.id);
  const user_id = Number(req.user.id);
  const cacheKey = `taskStats:${org_id}:${user_id}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    const [orgMember, projectMemberships] = await Promise.all([
      prisma.org_member.findUnique({
        where: {
          member_id_org_id: {
            org_id: org_id,
            member_id: user_id,
          },
        },
        select: { role: true },
      }),

      prisma.proj_member.findMany({
        where: {
          org_id: org_id,
          member_id: user_id
        },
        select: {
          proj_id: true,
          role: true,
        },
      }),
    ]);

    const isOrgAdmin = orgMember?.role === "admin";

    const managedProjectIds = projectMemberships
      .filter((p) => p.role === "manager")
      .map((p) => p.proj_id);

    const baseTaskFilter = { org_id };

    const assignedFilter = {
      org_id,
      assignees: { some: { user_id } },
    };

    const managedFilter =
      managedProjectIds.length > 0
        ? {
          org_id,
          project_id: { in: managedProjectIds },
        }
        : null;

    const mergeTasks = (arr1, arr2) => {
      const map = new Map();
      [...arr1, ...(arr2 || [])].forEach((t) => {
        map.set(t.id, t);
      });
      return Array.from(map.values());
    };

    const getTasks = async (extraWhere, orderBy) => {
      if (isOrgAdmin) {
        return prisma.task.findMany({
          where: {
            ...baseTaskFilter,
            ...extraWhere,
          },
          orderBy,
          take: 7,
          select: {
            id: true,
            name: true,
            Status: true,
            dueDate: true,
          },
        });
      }

      const [assignedTasks, managedTasks] = await Promise.all([
        prisma.task.findMany({
          where: {
            ...assignedFilter,
            ...extraWhere,
          },
          orderBy,
          take: 7,
          select: {
            id: true,
            name: true,
            Status: true,
            dueDate: true,
          },
        }),

        managedFilter
          ? prisma.task.findMany({
            where: {
              ...managedFilter,
              ...extraWhere,
            },
            orderBy,
            take: 7,
            select: {
              id: true,
              name: true,
              Status: true,
              dueDate: true,
            },
          })
          : [],
      ]);

      return mergeTasks(assignedTasks, managedTasks).slice(0, 7);
    };

    const [myTasks, overdueTasks, inProgressTasks] = await Promise.all([
      getTasks(
        { Status: { not: "Done" } },
        [{ dueDate: "asc" }, { createdAt: "desc" }]
      ),

      getTasks(
        {
          Status: { not: "Done" },
          dueDate: { lt: new Date() },
        },
        { dueDate: "asc" }
      ),

      getTasks(
        { Status: "In Progress" },
        { dueDate: "asc" }
      ),
    ]);
    const Data = await prisma.proj_member.findMany({
      take: 8,
      where: {
        org_id: org_id,
        member_id: user_id
      },
      orderBy: {
        project: {
          createdAt: "desc"
        }
      },
      include: {
        project: {
          select: {
            name: true,
            Description: true,
            status: true,
            priority: true,
            endDate: true,
            member: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    const projData = Data.map((p) => {
      return {
        name: p.project.name,
        role: p.role,
        Description: p.project.Description,
        status: p.project.status,
        priority: p.project.priority,
        endDate: p.project.endDate,
        username: p.project.member?.name
      }
    });
    const statsResult = {
      tasks: {
        my: myTasks,
        overdue: overdueTasks,
        inProgress: inProgressTasks,
      },
      projData
    };

    await redis.set(cacheKey, JSON.stringify(statsResult), "EX", 30);

    res.status(200).json(statsResult);

  } catch (error) {
    console.log("StatsData error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getTaskAssignees = async (req, res) => {
  const taskId = Number(req.params.id);
  const cacheKey = `taskAssignees:${taskId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(202).json({ users: JSON.parse(cached) });
    }

    const assignees = await prisma.task_assignee.findMany({
      where: { task_id: taskId },
      select: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    const users = assignees.map(a => a.user);
    await redis.set(cacheKey, JSON.stringify(users), "EX", 60);

    res.status(202).json({ users });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};