import prisma from '../config/prisma.js';

export const addOrganization = async (req, res) => {
    const { name } = req.body;
    const { id, email } = req.user;
    try {
        await prisma.org.create({
            name: name,
            userId: id,
            user_email: email
        });
        res.status(201).json({ message: "create successfully" });
    } catch (error) {
        res.status(400).json({ message: "something went wrong" });
    }
}

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
}

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
}