import prisma from '../config/prisma.js';

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
        // console.log(name);
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

    try {
        await prisma.org.update({
            where: {
                id: org_id
            },
            data: {
                name: name
            }
        })
        res.status(204).json({ message: "update successfully" });
    } catch (error) {
        console.log(error.message);
        res.status(400).json({ message: "something went wrong" });
    }
};

export const deleteOrganization = async (req, res) => {
    const { org_id } = req.body;

    try {
        await prisma.org.delete({
            where: {
                id: org_id
            }
        })
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
    // console.log(id);
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
    // console.log(userID);
    console.log(id);
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
    // console.log(userID);
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
        if(userID !== data.org.userId) data.org.role = 'member';
        res.status(200).json(data.org);
    } catch (error) {
        console.log(error.message);
        res.status(400).json({ message: "something went wrong" });
    }
}

