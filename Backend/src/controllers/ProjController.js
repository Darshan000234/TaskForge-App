import prisma from "../config/prisma.js";
import { userSockets } from "../utils/userSockets.js";
import { getIO } from "../utils/socket.js";

export const projData = async (req, res) => {
    const { id } = req.user;
    const orgid = Number(req.params.id);
    const org = await prisma.org_member.findUnique({
        where: {
            member_id_org_id: {
                org_id: orgid,
                member_id: id
            }
        }
    })
    let role = org.role;
    try {
        let data = [];
        if (role === "admin") {
            data = await prisma.project.findMany({
                where: {
                    org_id: Number(orgid)
                },
                select: {
                    id: true,
                    name: true,
                    org_id: true,
                    Description: true,
                    status: true,
                    priority: true,
                    endDate: true,
                    createdAt: true,

                    member: {
                        select: {
                            email: true
                        }
                    }
                }
            });
            data = data.map((d) => {
                return {
                    ...d,
                    email: d.member.email
                }
            })
        } else {
            data = await prisma.proj_member.findMany({
                where: {
                    org_id: Number(orgid),
                    member_id: id
                },
                include: {
                    project: true,
                    member: {
                        select: {
                            email: true
                        }
                    }
                }
            });
            data = data.map((d) => {
                return {
                    ...d.project,
                    email: d.member.email
                }
            });
        }
        res.status(200).json(data);
    } catch (error) {
        console.log(error.message);
        res.status(404).json({ message: error.message });
    }
};

export const addProject = async (req, res) => {
    const { proj, orgid } = req.body;
    // console.log(proj,orgid);
    // console.log(proj);
    const io = getIO();
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: proj.email
            }
        });
        const project = await prisma.project.create({
            data: {
                name: proj.name,
                org_id: orgid,
                assigned_to: user.id,
                Description: proj.Description,
                status: proj.status,
                priority: proj.priority,
                endDate: new Date(proj.endDate)
            }
        });
        await prisma.proj_member.create({
            data: {
                proj_id: project.id,
                org_id: orgid,
                member_id: user.id,
                role: "manager"
            }
        });

        const org_member = await prisma.org_member.findUnique({
            where: {
                member_id_org_id: {
                    member_id: user.id,
                    org_id: orgid
                }
            }
        });
        project.email = proj.email;
        // console.log(project);
        // console.log(req.app.get("io"));
        io.to(`org_${org_member.org_id}`).emit('project_created', { project: project });
        res.status(201).json({ project: project });
    } catch (error) {
        console.log(error.message);
        res.status(404).json({ message: error.message });
    }
}

export const projectDelete = async (req, res) => {
    const pid = Number(req.params.id);
    const io = getIO();
    // console.log(pid);
    try {
        await prisma.project.delete({
            where: {
                id: pid
            }
        });

        io.to(`project_${pid}`).emit('project_deleted', { id: pid });
        const sockets = await io.in(`proj_${pid}`).fetchSockets();
        for (const socket of sockets) {
            socket.leave(`proj_${pid}`);
        }
        res.status(204).json({ message: ' project deleted successfully' });
    } catch (error) {
        console.log(error.message);
        res.status(404).json({ message: error.message });
    }
}

export const reassignProject = async (req, res) => {
    const id = Number(req.params.id);
    const { email, org } = req.body;
    const io = getIO();
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        const project = await prisma.project.findUnique({
            where: {
                id: id
            }
        });
        const org_member = await prisma.org_member.findUnique({
            where: {
                member_id_org_id: {
                    member_id: user.id,
                    org_id: Number(org.id)
                }
            }
        });
        await prisma.$transaction([
            prisma.proj_member.delete({
                where: {
                    proj_id_member_id: {
                        proj_id: id,
                        member_id: project.assigned_to,
                    }
                }
            }),
            prisma.proj_member.create({
                data: {
                    proj_id: id,
                    org_id: project.org_id,
                    member_id: user.id,
                    role: "manager"
                }
            })
        ]);
        const proj = await prisma.project.update({
            where: {
                id: id
            },
            data: {
                assigned_to: user.id
            }
        })
        proj.email = email;
        const prevOrgmember = await prisma.org_member.findUnique({
            where: {
                member_id_org_id: {
                    member_id: project.assigned_to,
                    org_id: Number(org.id)
                }
            }
        });

        io.to(`project_${id}`).emit('project_created', { proj_id: proj.id });
        io.to(`org_member_${org_member.org_id}`).emit('project_created', { proj_id: proj.id });
        io.to(`org_member_${prevOrgmember.id}`).emit('project_deleted', { id: id });

        const sockets = userSockets.get(project.assigned_to);
        if (!sockets) return;

        for (const socketId of sockets) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.leave(`project_${id}`);
            }
        }
        res.status(204).json({ message: "assing to another user successfully" });
    } catch (error) {
        console.log(error.message);
        res.status(404).json({ message: error.message });
    }
}

export const OneProjData = async (req, res) => {
    const id = Number(req.params.id);
    const userId = req.user.id;
    // console.log(id);
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

export const getMember = async (req, res) => {
    const { org_id } = req.query;
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