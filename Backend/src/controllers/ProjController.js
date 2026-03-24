import prisma from "../config/prisma.js";

export const projData = async (req, res) => {
    const { id } = req.user;
    const orgid = req.params.id;
    const { role } = req.body;
    console.log(orgid);
    console.log(role);

    try {
        let data = [];
        if (role === "admin") {
            data = await prisma.project.findMany({
                where: {
                    org_id: Number(orgid)
                }
            });
            data = data.map((d)=>{
                return {
                    ...d,
                    email : req.user.email
                }
            });
            console.log(data);
        } else {
            data = await prisma.proj_member.findMany({
                where: {
                    org_id: Number(orgid),
                    member_id: id
                },
                include: {
                    project: true,
                    member : { 
                        select : {
                            email : true,
                        }
                    }
                }
            });
            data = data.map((d)=>{
                return {
                    ...d.project,
                    email : d.member.email
                }
            });
        }
        res.status(200).json(data);
    } catch (error) {
        console.log(error.message);
        res.status(404).json({ message: error.message });
    }
};