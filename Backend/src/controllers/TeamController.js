import prisma from "../config/prisma.js";
import { userSockets } from "../utils/userSockets.js";

export const TeamData = async (req, res) => {
    const projectId = Number(req.params.id);
    try {
        const members = await prisma.proj_member.findMany({
            where: { proj_id: projectId },
            select: {
                member_id: true,
                role: true,
                member: {
                    select: {
                        id: true,
                        email: true,
                        task_assignee: {
                            where: { proj_id: projectId },
                            select: {
                                task: {
                                    select: {
                                        id: true,
                                        name: true,
                                        Status: true,
                                        priority: true,
                                        dueDate: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        const result = members.map(m => ({
            memberId: m.member_id,
            email: m.member.email,
            role: m.role,
            tasks: m.member.task_assignee.map(a => a.task)
        }));
        res.status(202).json({ result });
    } catch (error) {
        console.log("TeamData");
        console.log(error.message);
        res.status(404).json({ message: error.message });
    }
}   