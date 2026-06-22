import prisma from '../config/prisma.js';
import { getIO } from "../utils/socket.js";
import { auditService } from "../services/audit.service.js";

const RT = { MEMBER: "MEMBER", ORG: "ORG" };
const meta = (req) => ({ ip: req.ip, userAgent: req.headers["user-agent"] ?? null });

const getUserOrganizations = async (userId) => {
  return await prisma.$queryRaw`
        SELECT o.id, o.name, o.member_count, o.proj_count, om.role, o."createdAt"
        FROM org_member om
        INNER JOIN org o ON om.org_id = o.id
        WHERE om.member_id = ${userId};
    `;
};

export const addOrganization = async (req, res) => {
  const { name } = req.body;
  const { id, email } = req.user;
  try {
    const exist = await prisma.org.findFirst({
      where: {
        name: name,
        userId: id
      }
    })

    if (exist) res.status(409).json({ message: "name already exist" });

    const org = await prisma.org.create({
      data: {
        name: name,
        userId: id,
        member_count: 0,
        proj_count: 0
      }
    });
    await prisma.org_member.create({
      data: {
        org_id: org.id,
        member_id: id,
        member_email: email,
        role: "admin"
      }
    });
    res.status(201).json({ org });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({
        message: "Organization name already exists"
      });
    }
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
};

export const updateOrganization = async (req, res) => {
  const { org_id, name } = req.body;
  const userId = req.user.id;

  try {
    const oldOrg = await prisma.org.findUnique({
      where: { id: org_id },
      select: { id: true, name: true },
    });
    if (!oldOrg) return res.status(404).json({ message: "Organization not found" });

    await prisma.org.update({ where: { id: org_id }, data: { name } });

    auditService.log({
      orgId: org_id,
      userId,
      action: "UPDATED",
      resourceType: "ORG",
      resourceId: org_id,
      oldValue: { name: oldOrg.name },
      newValue: { name },
      metadata: { diff: { name: { from: oldOrg.name, to: name } }, ...meta(req) },
    });

    return res.status(204).json({ message: "updated successfully" });
  } catch (error) {
    console.error("updateOrganization:", error.message);
    return res.status(400).json({ message: "something went wrong" });
  }
};

export const deleteOrganization = async (req, res) => {
  const org_id = Number(req.params.org_id);
  const io = getIO();
  try {
    await prisma.org.delete({
      where: {
        id: org_id
      }
    })

    io.to(`org_${org_id}`).emit("org deleted");
    res.status(204).json({ message: "Deleted successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: "something went wrong" });
  }
};

export const DataOrganization = async (req, res) => {
  try {
    const org = await getUserOrganizations(req.user.id);
    res.status(200).json(org);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const DataOrganizationMembers = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const data = await prisma.teaminvitation.findMany({
      where: {
        org_id: id
      }

    });
    res.status(200).json(data);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: "something went wrong" });
  }
}

export const updateactiveOrgs = async (req, res) => {
  const id = Number(req.params.id);
  const userID = req.user.id;
  try {
    await prisma.user.update({
      where: {
        id: userID
      },
      data: {
        activeorg: id
      }
    });
    const data = await prisma.org.findUnique({
      where: {
        id: id
      }
    })
    res.status(200).json(data);
  } catch (error) {
    console.log(error.message);
    console.log("updateactiveOrgs");
    res.status(400).json({ message: "something went wrong" });
  }
}

export const getActiveOrgs = async (req, res) => {
  const userID = req.user.id;
  try {
    let data = await prisma.user.findUnique({
      where: {
        id: userID
      },
      include: {
        org: true
      }
    });
    if (!data.org) {
      const org = await getUserOrganizations(userID);
      if (!org || org.length === 0) return res.status(400).json({ message: "No organization found" });
      await prisma.user.update({
        where: {
          id: userID
        },
        data: {
          activeorg: org[0].id
        }
      })
      data = await prisma.user.findUnique({
        where: { id: userID },
        include: { org: true }
      });
    }
    if (userID !== data.org.userId) data.org.role = 'member';
    res.status(200).json(data.org);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: "something went wrong" });
  }
}

export const StatsData = async (req, res) => {
  const org_id = Number(req.params.id);
  const user_id = Number(req.user.id);

  try {
    const [projcount] = await prisma.$queryRaw`
      SELECT 
        COUNT(*) AS total_proj,
        COUNT(*) FILTER (WHERE p."status" = 'Completed') AS completed_projects
      FROM project p
      INNER JOIN proj_member pm 
        ON pm."proj_id" = p.id
      WHERE 
        pm."org_id" = ${org_id}
        AND pm."member_id" = ${user_id};
    `;

    const [taskcount] = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT t.id) AS total_task,
        COUNT(DISTINCT t.id) FILTER (
          WHERE t."dueDate" < NOW() 
          AND t."Status" != 'completed'
        ) AS overdue_task
      FROM task t
      LEFT JOIN org o 
        ON o.id = t.org_id
      LEFT JOIN project p 
        ON p.id = t.project_id
      LEFT JOIN task_assignee ta 
        ON ta.task_id = t.id 
        AND ta.user_id = ${user_id}
      WHERE 
        t.org_id = ${org_id}
        AND ( o."userId" = ${user_id} OR p."assigned_to" = ${user_id} OR ta.user_id = ${user_id} );
    `;

    const result = {
      total_proj: Number(projcount.total_proj),
      completed_projects: Number(projcount.completed_projects),
      my_task: Number(taskcount.total_task),
      overdue_task: Number(taskcount.overdue_task),
    };

    res.status(200).json(result);

  } catch (error) {
    console.log("StatsData error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getOrgTasks = async (req, res) => {
  try {
    const orgId = parseInt(req.params.orgId, 10);
    if (isNaN(orgId)) {
      return res.status(400).json({ message: "Invalid org id" });
    }

    const userId = req.user.id;

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const cursor = req.query.cursor ? parseInt(req.query.cursor, 10) : undefined;
    const search = req.query.search?.trim() || null;
    const status = req.query.status?.trim() || null;
    const priority = req.query.priority?.trim() || null;
    const due = req.query.due?.trim() || null;

    const [orgData, managedProjects] = await Promise.all([
      prisma.org.findUnique({
        where: { id: orgId },
        select: { userId: true },
      }),
      prisma.proj_member.findMany({
        where: {
          org_id: orgId,
          member_id: userId,
          role: "manager",
        },
        select: { proj_id: true },
      }),
    ]);

    const isOwner = orgData?.userId === userId;
    const managedProjectIds = managedProjects.map(p => p.proj_id);

    let where = { org_id: orgId };

    if (!isOwner) {
      if (managedProjectIds.length > 0) {
        where = {
          ...where,
          OR: [
            { project_id: { in: managedProjectIds } },
            { assignees: { some: { user_id: userId } } }
          ]
        };
      } else {
        where = {
          ...where,
          assignees: { some: { user_id: userId } }
        };
      }
    }

    const extraFilters = [];

    if (search) {
      extraFilters.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { Description: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (status) extraFilters.push({ Status: status });
    if (priority) extraFilters.push({ priority });

    if (due) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setHours(23, 59, 59, 999);

      const weekEnd = new Date(todayStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      if (due === "overdue") {
        extraFilters.push({ dueDate: { lt: now } });
        extraFilters.push({ Status: { not: "done" } });
      } else if (due === "today") {
        extraFilters.push({ dueDate: { gte: todayStart, lte: todayEnd } });
      } else if (due === "week") {
        extraFilters.push({ dueDate: { gte: todayStart, lte: weekEnd } });
      }
    }

    if (extraFilters.length > 0) {
      where = {
        AND: [where, ...extraFilters]
      };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),

        select: {
          id: true,
          name: true,
          Description: true,
          Status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          project: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              assignees: true,
            },
          },
        },
      }),

      prisma.task.count({ where }),
    ]);
    const formattedTasks = tasks.map((t) => ({
      id: t.id,
      name: t.name,
      Description: t.Description,
      Status: t.Status,
      priority: t.priority,
      dueDate: t.dueDate,
      createdAt: t.createdAt,
      project: t.project,
      assigneeCount: t._count.assignees,
    }));
    const hasNext = tasks.length > limit;
    if (hasNext) tasks.pop();

    const nextCursor = hasNext ? tasks[tasks.length - 1]?.id : null;

    return res.status(200).json({
      formattedTasks,
      nextCursor,
      total
    });

  } catch (err) {
    console.error("[getOrgTasks]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};