import prisma from "../config/prisma.js";

export const projData = async (req, res) => {
    const { id } = req.user;
    const orgid = req.params.id;
    const { role } = req.body;
    // console.log(orgid);
    // console.log(role);
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
    console.log(proj);
    const io = req.app.get("io");
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
        io.to(`org_${org_member.id}`).emit('project_created', { project: project });
        res.status(201).json({ project: project });
    } catch (error) {
        console.log(error.message);
        res.status(404).json({ message: error.message });
    }
}

export const projectDelete = async (req, res) => {
    const pid = Number(req.params.id);
    const io = req.app.get("io");
    // console.log(pid);
    try {
        await prisma.project.delete({
            where: {
                id: pid
            }
        });

        // if (!proj) return res.status(404).json({ message: "project does not exist" });
        // console.log(pid);
        io.to(`project_${pid}`).emit('project_deleted', { id: pid });
        res.status(204).json({ message: ' project deleted successfully' });
    } catch (error) {
        console.log(error.message);
        res.status(404).json({ message: error.message });
    }
}

export const reassignProject = async (req, res) => {
    const id = req.params.id;
    const { email,org }  = req.body;
    try {
        const user = await prisma.user.findUnique({
            where : {
                email : email
            }
        });
        const project = await prisma.project.update({
            where : {
                id : id
            }
        });
        const proj = await prisma.project.update({
            where : {
                id : id
            },
            data : {
                assigned_to : user.id
            }
        })
        proj.email = email;
        const org_member = await prisma.org_member.findUnique({
            where: {
                member_id_org_id: {
                    member_id: user.id,
                    org_id: Number(org.id)
                }
            }
        });
        await prisma.proj_member.update({
            where : {
                proj_id : id,
                member_id : project.assigned_to,
            }, data :{
                member_id : user.id
            }
        })
        io.to(`org_${org_member.id}`).emit('project_created', { project : proj});
        io.to(`project_${id}`).emit('project_created', { project : proj});
        io.to(`user_${proj.assigned_to}`).emit('project_deleted', { id: id });
        res.status(204).json({ message : "assing to another user successfully"});
    } catch (error) {
        res.status(404).json({ message : error.message });
    }
}