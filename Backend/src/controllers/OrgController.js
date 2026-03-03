import prisma from '../config/prisma.js';

export const addOrganization = async (req, res) => {
    const { name } = req.body;
    const { id, email } = req.user;
    try {
        // console.log(name);
        await prisma.org.create({
            data : {
                name: name,
                userId: id,
                user_email: email,
                member_count: 0,
                proj_count: 0
            }
        });
        res.status(201).json({ message: "create successfully" });
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
    // console.log(id);
    try {
        const data = await prisma.org.findMany({
            where : {
                userId : id
            }
        });
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: "something went wrong" });
    }
};