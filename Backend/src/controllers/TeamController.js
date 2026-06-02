import prisma from "../config/prisma.js";
import { getIO } from "../utils/socket.js";
import { userSockets } from "../utils/userSockets.js";

export const TeamData = async (req, res) => {
    const projectId = Number(req.params.id);
    try {
        const members = await prisma.proj_member.findMany({
            where: {
                proj_id: projectId,
                role: {
                    not: "manager"
                }
            },
            select: {
                member_id: true,
                role: true,
                member: {
                    select: {
                        id: true,
                        name: true,
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
            id : m.member.id,
            name: m.member.name,
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

export const DeleteMember = async (req, res) => {
    const user_id = req.body.user_id;
    const id = Number(req.params.id);
    const io = getIO();
    try {

        await prisma.proj_member.delete({
            where: {
                proj_id_member_id: {
                    proj_id: id,
                    member_id: user_id,
                }
            }
        })

        const task = await prisma.task_assignee.deleteMany({
            where: {
                proj_id: id,
                user_id: user_id
            }
        });


        io.to(`proj_${id}`).emit("Member Deleted", { id: user_id });
        io.to(`task_${task.task_id}`).emit("updateTask", { id : task.task_id});
        res.status(202).json({ message: "deleted user from project successfully" });
    } catch (error) {
        console.log("DeleteMember teamcontroller");
        console.log(error.message);
        res.status(404).json({ message: error.message });
    }
}

export const deleteTask = async (req, res) => {
    const { task_id, user_id } = req.body;
    try {
        const data = await prisma.task_assignee.delete({
            where: {
                task_id_user_id: {
                    user_id: user_id,
                    task_id: task_id
                }
            }
        });
        io.to(`proj_${data.proj_id}`).emit("removed member", { task_id, user_id});
        io.to(`task_${data.task_id}`).emit("updateTask", { id : data.task_id});
        res.status(202).json({ message: "successfully deleted " });
    } catch (error) {
        console.log("deleteTask from TeamController");
        console.log(error.message);

        res.status(404).json({ message: error.message });
    }
}

export const manyTeamData = async (req, res) => {
    const projectId = Number(req.params.id);
    const memberIds = req.body.memberIds;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
        return res.status(400).json({ message: "memberIds must be a non-empty array" });
    }

    try {
        const members = await prisma.proj_member.findMany({
            where: {
                proj_id: projectId,
                member_id: { in: memberIds },
                role: {
                    not: "manager"
                }
            },
            select: {
                member_id: true,
                role: true,
                member: {
                    select: {
                        id: true,
                        name: true,
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
            name: m.member.name,
            memberId: m.member_id,
            email: m.member.email,
            role: m.role,
            tasks: m.member.task_assignee.map(a => a.task)
        }));

        res.status(200).json({ result });
    } catch (error) {
        console.log("manyTeamData error:", error.message);
        res.status(500).json({ message: error.message });
    }
};
