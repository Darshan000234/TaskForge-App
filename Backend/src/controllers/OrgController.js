import prisma from '../config/prisma.js';

export const addOrganization = async (req, res) => {
    const { name } = req.body;
    const { id,email } = req.user; 
    try {
        // console.log(name);
        const org = await prisma.org.create({
            data : {
                name: name,
                userId: id,
                member_count: 0,
                proj_count: 0
            }
        });
        await prisma.org_member.create({
            data : {
                org_id : org.id,
                member_id : id,
                member_email : email,
                role : "admin"
            }
        });
        res.status(201).json(org);
    } catch (error) {
         if (error.code === "P2002") {
            return res.status(400).json({
                message: "Organization name already exists"
            });
        }
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
            date: {
                name: name
            }
        })
        res.status(204).json({ message: "update successfully" });
    } catch (error) {
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
        res.status(400).json({ message: "something went wrong" });
    }
};

export const DataOrganization = async (req, res) => {
    const { id } = req.user;

    try {
        const org = await prisma.$queryRaw`
        SELECT o.id, o.name, o.member_count, o.proj_count, om.role, o."createdAt" 
        FROM org_member om 
        INNER JOIN org o 
        ON om.org_id = o.id 
        WHERE om.member_id = ${id}`;
        // console.log(org);
        res.status(200).json( org );
    } catch (error) {
        console.error(error , "dataorganization");
        res.status(500).json({ message: "Something went wrong" });
    }
};

export const DataOrganizationMembers = async (req, res) => {
    const id = Number(req.params.id);
    // console.log(id);
    try {
        const data  = await prisma.teaminvitation.findMany({
            where : {
                org_id : id
            }
            
        });
        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: "something went wrong" });
    }
}

export const activeOrgs = async(req,res) => {
    const id  = req.params.id;
    const userID = req.user.id;
    try {
        await prisma.user.update({
            where : {
                id : userID
            },
            data : {
                activeOrgs : id
            }
        });
        res.status(200).json( id );
    } catch (error) {
        res.status(400).json({ message: "something went wrong"});
    }
}