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
                }
            });
            data = data.map((d) => {
                return {
                    ...d,
                    email: req.user.email
                }
            });
            // console.log(data);
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
                            email: true,
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
        // console.log(error.message);
        res.status(404).json({ message: error.message });
    }
};

export const addProject = async (req, res) => {
    const { proj,orgid } = req.body;
    console.log(proj,orgid);
    const io = req.app.get("io");
    try {
        const user = await prisma.user.findUnique({
            where : {
                email : proj.email
            }
        });
        const project = await prisma.project.create({
            data : {
                name : proj.name,
                org_id : orgid,
                assigned_to : user.id,
                Description : proj.description,
                status : proj.status,
                priority : proj.priority,
                endDate : proj.endDate
            }
        });
        const member = await prisma.proj_member.create({
            data : {
                proj_id : project.id,
                org_id : orgid,
                member_id : user.id,
                role : "manager"
            }
        });

        const org_member = await prisma.org_member.findUnique({
            where : {
                member_id_org_id : {
                    member_id : user.id,
                    org_id : orgid
                }
            }
        });
   
        console.log("passes");
        io.to(`org_${org_member.id}`).emit('project_created', { project : project});
        res.status(201).json({message : "success fully created"});
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}