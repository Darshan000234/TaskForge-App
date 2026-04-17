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
            title: t.name,
            description: t.Description,
            status: t.Status,
            priority: t.priority,
            dueDate: t.dueDate,
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
        // console.log(existingMembers);
        const existingIds = new Set(existingMembers.map(m => m.member_id));
        const newMembers = memberIds.filter(id => !existingIds.has(id));
        existingMembers = memberIds.filter(id => existingIds.has(id));
        // console.log(newMembers);
        // console.log(memberIds);
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
                name: data.title,
                Description: data.description,
                Status: data.status,
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
                    io.to(socketid).emit("project_joined", {
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
            title: createdTask.name,
            description: createdTask.Description,
            status: createdTask.Status,
            priority: createdTask.priority,
            dueDate: createdTask.dueDate,
            assignees: createdTask.assignees.map(a => a.user)
        };

        res.status(202).json({ task : result });
    } catch (error) {
        console.log(error.message);
        console.log("AddTask");
        res.status(404).json({ message: error.message });
    }
}

export const DeleteTask = async (req, res) => {
    const tid = req.body.id;
    console.log(tid);
    try { 
        await prisma.task.delete({
            where : {
                id : tid
            }
        })
        res.status(202).json({ message : "deleted task"});
    } catch (error) {
        console.log("DeleteTask");
        console.log(error.message);
        res.status(404).json({message : error.message});
    }
}