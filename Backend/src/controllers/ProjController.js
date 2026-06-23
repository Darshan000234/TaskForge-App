import prisma from "../config/prisma.js";
import { userSockets } from "../utils/userSockets.js";
import { getIO } from "../utils/socket.js";
import { auditService } from "../services/audit.service.js";
import { diffObjects }  from "../utils/diff.js";
 
const A  = { CREATED:"CREATED", UPDATED:"UPDATED", DELETED:"DELETED", ASSIGNED:"ASSIGNED" };
const RT = { PROJECT:"PROJECT", MEMBER:"MEMBER" };
const meta = (req) => ({ ip: req.ip, userAgent: req.headers["user-agent"] ?? null });

export const projData = async (req, res) => {
    const { id } = req.user;
    // console.log(id);
    const orgid = Number(req.params.orgId);
    const limit = Math.min(Number(req.query.limit) || 12, 50);
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
    
    try {
        const org = await prisma.org_member.findUnique({
            where: { member_id_org_id: { org_id: orgid, member_id: id } },
        });
        if (!org) return res.status(403).json({ message: "Not a member of this org" });

        const role = org.role;
        let raw = [];

        if (role === "admin") {
            raw = await prisma.project.findMany({
                take: limit + 1,
                ...(cursor && { skip: 1, cursor: { id: cursor } }),
                where: { org_id: orgid },
                orderBy: { id: "asc" },
                select: {
                    id: true,
                    name: true,
                    org_id: true,
                    Description: true,
                    status: true,
                    priority: true,
                    endDate: true,
                    createdAt: true,
                    member: { select: { email: true } },
                },
            });

            raw = raw.map((d) => ({ ...d, email: d.member?.email ?? null }));

        } else {
            raw = await prisma.proj_member.findMany({
                take: limit + 1,
                where: {
                    org_id: orgid,
                    member_id: id,
                    ...(cursor && { proj_id: { gt: cursor } }),
                },
                orderBy: { proj_id: "asc" },
                include: {
                    project: true,
                    member: { select: { email: true } },
                },
            });

            raw = raw.map((d) => ({ ...d.project, email: d.member?.email ?? null }));
        }

        const hasMore = raw.length > limit;
        const page_slice = hasMore ? raw.slice(0, limit) : raw;
        const nextCursor = hasMore ? page_slice[page_slice.length - 1].id : null;

        res.status(200).json({ result: page_slice, nextCursor, hasMore });
    } catch (error) {
        console.error("projData:", error.message);
        res.status(500).json({ message: error.message });
    }
};

export const OneProjData = async (req, res) => {
    const id = Number(req.params.id);
    const userId = req.user.id;
    try {
        const data = await prisma.project.findUnique({
            where: {
                id: id
            },
            include: {
                member: {
                    select: {
                        email: true
                    }
                }
            }
        });
        data.email = data.member.email;
        const org = await prisma.org_member.findUnique({
            where: {
                member_id_org_id: {
                    org_id: data.org_id,
                    member_id: userId
                }
            }
        });
        data.org = org;
        res.status(200).json({ data });
    } catch (error) {
        console.log("OneProjectData");
        console.log(error.message);
        res.status(404).json({ message: error.message });
    }
}

export const addProject = async (req, res) => {
    const { proj, org_id } = req.body;
    const userId = req.user.id;
    const io = getIO();

    try {
        const user = await prisma.user.findUnique({ where: { email: proj.email } });

        const project = await prisma.project.create({
            data: {
                name: proj.name,
                org_id: orgid,
                assigned_to: user.id,
                Description: proj.Description,
                status: proj.status,
                priority: proj.priority,
                endDate: new Date(proj.endDate),
            },
        });

        await prisma.proj_member.create({
            data: { proj_id: project.id, org_id: orgid, member_id: user.id, role: "manager" },
        });
        
        await prisma.proj_member.create({
            data: { proj_id: project.id, org_id: orgid, member_id: userId, role: "admin" },
        });

        project.email = proj.email;
        io.to(`org_${orgid}`).emit("project_created", { project });

        auditService.log({
            orgId: orgid, proj_id: project.id, userId,
            action: A.CREATED, resourceType: RT.PROJECT, resourceId: project.id,
            newValue: { name: project.name, status: project.status, priority: project.priority, endDate: project.endDate, assignedTo: proj.email },
            metadata: meta(req),
        });

        return res.status(201).json({ project });
    } catch (error) {
        console.error("addProject:", error.message);
        return res.status(500).json({ message: error.message });
    }
};

export const reassignProject = async (req, res) => {
    const id = Number(req.params.id);
    const { email, org } = req.body;
    const userId = req.user.id;
    const io = getIO();

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        const project = await prisma.project.findUnique({ where: { id } });

        const prevManager = await prisma.user.findUnique({
            where: { id: project.assigned_to },
            select: { id: true, name: true, email: true },
        });

        const org_member = await prisma.org_member.findUnique({ where: { member_id_org_id: { member_id: user.id, org_id: Number(org.id) } } });
        const prevOrgMember = await prisma.org_member.findUnique({ where: { member_id_org_id: { member_id: project.assigned_to, org_id: Number(org.id) } } });

        await prisma.$transaction([
            prisma.proj_member.delete({ where: { proj_id_member_id: { proj_id: id, member_id: project.assigned_to } } }),
            prisma.proj_member.create({ data: { proj_id: id, org_id: project.org_id, member_id: user.id, role: "manager" } }),
        ]);

        const proj = await prisma.project.update({ where: { id }, data: { assigned_to: user.id } });
        proj.email = email;

        io.to(`project_${id}`).emit("project_created", { proj_id: proj.id });
        io.to(`org_member_${org_member.org_id}`).emit("project_created", { proj_id: proj.id });
        io.to(`org_member_${prevOrgMember.id}`).emit("project_deleted", { id });

        const sockets = userSockets.get(project.assigned_to);
        if (sockets) {
            for (const socketId of sockets) {
                const socket = io.sockets.sockets.get(socketId);
                if (socket) socket.leave(`project_${id}`);
            }
        }

        auditService.log({
            orgId: project.org_id, proj_id: id, userId,
            action: A.ASSIGNED, resourceType: RT.PROJECT, resourceId: id,
            oldValue: { assignedTo: { id: prevManager.id, name: prevManager.name, email: prevManager.email } },
            newValue: { assignedTo: { id: user.id, name: user.name ?? null, email } },
            metadata: { diff: { assignedTo: { from: prevManager.email, to: email } }, ...meta(req) },
        });

        return res.status(204).json({ message: "assigned to another user successfully" });
    } catch (error) {
        console.error("reassignProject:", error.message);
        return res.status(500).json({ message: error.message });
    }
};

export const UpdateProject = async (req, res) => {
    const { proj } = req.body;
    const userId = req.user.id;

    try {
        const oldProject = await prisma.project.findUnique({
            where: { id: Number(proj.id) },
            select: { id: true, name: true, Description: true, endDate: true, status: true, priority: true, org_id: true },
        });
        if (!oldProject) return res.status(404).json({ message: "Project not found" });

        const project = await prisma.project.update({
            where: { id: Number(proj.id) },
            data: { name: proj.name, Description: proj.Description, endDate: new Date(proj.endDate), status: proj.status, priority: proj.priority },
        });

        const diff = diffObjects(oldProject, project, ["id", "org_id"]);

        auditService.log({
            orgId: oldProject.org_id, proj_id: Number(proj.id), userId,
            action: "UPDATED", resourceType: RT.PROJECT, resourceId: proj.id,
            oldValue: { name: oldProject.name, Description: oldProject.Description, endDate: oldProject.endDate, status: oldProject.status, priority: oldProject.priority },
            newValue: { name: project.name, Description: project.Description, endDate: project.endDate, status: project.status, priority: project.priority },
            metadata: { diff, ...meta(req) },
        });

        return res.status(202).json({ data: project });
    } catch (error) {
        console.error("UpdateProject:", error.message);
        return res.status(500).json({ message: error.message });
    }
};

export const getMember = async (req, res) => {
    const { org_id } = req.body;
    const pid = Number(req.params.id);
    try {
        const check = await prisma.project.findUnique({
            where: {
                org_id: org_id,
                id: pid
            }
        })
        if (!check) return res.status(404).json({ message: "not found" });
        const data = await prisma.teaminvitation.findMany({
            where: {
                org_id: org_id,
                receiver_id: {
                    not: check.assigned_to
                }
            }
        });

        res.status(202).json({ data });
    } catch (error) {
        console.log(error.message);
        console.log("getMember", "projcontroller");
        res.status(404).json({ message: error.message });
    }
}

export const projectDelete = async (req, res) => {
    const pid = Number(req.params.id);
    const userId = req.user.id;
    const io = getIO();

    try {
        const oldProject = await prisma.project.findUnique({
            where: { id: pid },
            select: { id: true, name: true, status: true, priority: true, org_id: true },
        });

        const proj = await prisma.project.delete({ where: { id: pid } });

        io.to(`org_${proj.org_id}`).emit("project_deleted", { id: pid });
        io.to(`proj_${pid}`).emit("project_deleted");

        const sockets = await io.in(`proj_${pid}`).fetchSockets();
        for (const socket of sockets) socket.leave(`proj_${pid}`);

        auditService.log({
            orgId: proj.org_id, proj_id: pid, userId,
            action: A.DELETED, resourceType: RT.PROJECT, resourceId: pid,
            oldValue: { name: oldProject.name, status: oldProject.status, priority: oldProject.priority },
            metadata: meta(req),
        });

        return res.status(204).json({ message: "project deleted successfully" });
    } catch (error) {
        console.error("projectDelete:", error.message);
        return res.status(500).json({ message: error.message });
    }
};

export const userData = async (req,res) => {
    const id = Number(req.params.id);
    const user_id = Number(req.user.id);
    try {
        const member = await prisma.proj_member.findUnique({
            where : {
                proj_id_member_id : {
                    proj_id : id,
                    member_id : user_id
                }
            }
        })
        res.status(200).json(member);
    } catch (error) {
        res.status(404).json({ message : error.message });
    }
};

// export const statsData = async (req, res) => {
  
// };