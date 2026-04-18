import prisma from "../config/prisma.js";
import { io } from "../server.js";
import { userSockets } from "../utils/userSockets.js";


export const TaskData = async (req, res) => {
    const id = Number(req.params.id);
    try {
        const tasks = await prisma.task.findMany({
            where: { project_id: id },
            include: {
                assignees: {
                    include: {
                        user: true
                    }
                }
            }
        });

        const result = tasks.map(t => ({
            id: t.id,
            name: t.name,
            Description: t.Description,
            Status: t.Status,
            priority: t.priority,
            dueDate: t.dueDate,
            projectId: t.proj_id,
            orgId: t.org_id,
            assignees: t.assignees.map(a => a.user)
        }));

        res.status(200).json({ result });
    } catch (error) {
        console.log("taskData");
        console.log(error.message);
        res.status(404).json({ message: error.message });
    }
}

export const AddTask = async (req, res) => {
    const data = req.body.task;
    const projectId = Number(req.body.id);
    const orgId = Number(req.body.orgId);

    if (!data || !Array.isArray(data.assignees)) {
        return res.status(400).json({ message: "Invalid task data" });
    }

    try {

        const memberIds = data.assignees;
        const existingMembers = await prisma.proj_member.findMany({
            where: {
                proj_id: projectId,
            },
            select: {
                member_id: true
            }
        });

        const existingIds = new Set(existingMembers.map(m => m.member_id));
        const newMembers = memberIds.filter(id => !existingIds.has(id));

        if (newMembers.length > 0) {
            await prisma.proj_member.createMany({
                data: newMembers.map(userId => ({
                    proj_id: projectId,
                    org_id: orgId,
                    member_id: userId,
                    role: "member"
                })),
                skipDuplicates: true
            });
        }

        const task = await prisma.task.create({
            data: {
                name: data.name,
                Description: data.Description,
                Status: data.Status,
                priority: data.priority,
                dueDate: new Date(data.dueDate),
                project_id: projectId,
                org_id: orgId,
            }
        });
        task.dueDate = data.dueDate;
        await prisma.task_assignee.createMany({
            data: memberIds.map(id => ({
                task_id: task.id,
                user_id: id,
                proj_id: projectId,
                org_id: orgId,
            })),
            skipDuplicates: true
        });

        newMembers.map((userId) => {
            const sockets = userSockets.get(userId);
            if (sockets) {
                sockets.forEach(socketid => {
                    io.to(socketid).emit("add_proj", {
                        projectId: projectId
                    });
                });
            };
        });

        const createdTask = await prisma.task.findUnique({
            where: { id: task.id },
            include: {
                assignees: {
                    include: {
                        user: true
                    }
                }
            }
        });

        const result = {
            id: createdTask.id,
            name: createdTask.name,
            Description: createdTask.Description,
            Status: createdTask.Status,
            priority: createdTask.priority,
            dueDate: createdTask.dueDate,
            projectId: createdTask.proj_id,
            orgId: createdTask.org_id,
            assignees: createdTask.assignees.map(a => a.user)
        };

        if (existingIds) {
            io.to(`project_${projectId}`).emit("add_task", { taskId: result.id });
        }

        res.status(202).json({ task: result });
    } catch (error) {
        console.log(error.message);
        console.log("AddTask");
        res.status(404).json({ message: error.message });
    }
}

export const DeleteTask = async (req, res) => {
    const tid = req.body.id;
    try {
        await prisma.task.delete({
            where: {
                id: tid
            }
        })
        res.status(202).json({ message: "deleted task" });
    } catch (error) {
        console.log("DeleteTask");
        console.log(error.message);
        res.status(404).json({ message: error.message });
    }
}

export const OneTaskData = async (req, res) => {
    const id = Number(req.params.id);

    try {

        const tasks = await prisma.task.findUnique({
            where: { id: id },
            include: {
                assignees: {
                    include: {
                        user: true
                    }
                }
            }
        });

        const result = {
            id: tasks.id,
            name: tasks.name,
            Description: tasks.Description,
            Status: tasks.Status,
            priority: tasks.priority,
            dueDate: tasks.dueDate,
            projectId: tasks.proj_id,
            orgId: tasks.org_id,
            assignees: tasks.assignees.map(a => a.user)
        };

        res.status(202).json({ result });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const addmemberData = async (req, res) => {
    const taskid = Number(req.params.id);
    const projectId = Number(req.body.projectId);
    const org_id = Number(req.body.org_id);
    try {
        const assignees = await prisma.task_assignee.findMany({
            where: {
                task_id: taskid
            },
            select: {
                user: {
                    select: {
                        id: true
                    }
                }
            }
        });

        const manager = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                members: {
                    select: {
                        member_id: true
                    }
                }
            }
        });

        let member = await prisma.teaminvitation.findMany({
            where: {
                org_id: org_id
            },
        });

        const assignedIds = new Set([
            ...assignees.map(a => a.user.id),
            ...manager.members.map(m => m.member_id)
        ]);

        member = member.filter((m) => !assignedIds.has(m.receiver_id));

        member = member.map((m) => {
            return {
                user_id: m.receiver_id,
                email: m.receiver_email
            }
        })
        
        res.status(202).json({ member });
    } catch (error) {
        console.log("addmemberData");
        console.log(error.message);

        res.status(404).json({ message: error.message });
    }
}