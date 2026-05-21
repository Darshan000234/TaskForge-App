import prisma from "../config/prisma.js";
import { getIO } from "../utils/socket.js";
import { userSockets } from "../utils/userSockets.js";


export const TaskData = async (req, res) => {
    const id = Number(req.params.id);
    try {
        const tasks = await prisma.task.findMany({
            where: { project_id: id },
            include: {
                assignees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { id: 'asc' }
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
    const io = getIO();

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

        io.to(`project_${projectId}`).emit("add task", { memberIds });
        res.status(202).json({ task: result });
    } catch (error) {
        console.log(error.message);
        console.log("AddTask");
        res.status(404).json({ message: error.message });
    }
}

export const DeleteTask = async (req, res) => {
    const tid = req.body.id;
    const io = getIO();
    try {
        const memberIds = await prisma.task_assignee.findMany({
            where: {
                task_id: tid
            },
            select: {
                user_id: true
            }
        });

        const task = await prisma.task.delete({
            where: {
                id: tid
            }
        })


        res.status(202).json({ message: "deleted task" });

        io.to(`project_${task.project_id}`).emit("deleted_task", { taskId: tid });
        io.to(`project_${task.project_id}`).emit("delete task", { memberIds: memberIds });

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
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
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

export const RemoveMemeber = async (req, res) => {
    const id = Number(req.params.id);
    const { user_id } = req.body;
    const io = getIO();
    try {
        const data = await prisma.task_assignee.delete({
            where: {
                task_id_user_id: {
                    task_id: id,
                    user_id: user_id
                }
            }
        })

        io.to(`proj_${data.proj_id}`).emit("removed member", { task_id : id, user_id });
        res.status(202).json({ message: "deleted Successfully " });
    } catch (error) {
        console.log("RemoveMemeber");
        console.log(error.message);
        res.status(404).json({ message: error.message });
    }
}

export const addmember = async (req, res) => {
    const id = Number(req.params.id);
    let { users, org_id } = req.body;
    // console.log(users);
    // return;
    const io = getIO();

    try {
        // Normalize input (handle both object and array)
        if (!users) {
            return res.status(400).json({ message: "users is required" });
        }

        users = Array.isArray(users) ? users : [users];

        if (users.length === 0) {
            return res.status(400).json({ message: "users array cannot be empty" });
        }

        // Validate structure
        const invalid = users.some(u => !u.receiver_id);
        if (invalid) {
            return res.status(400).json({ message: "Invalid user format" });
        }

        const task = await prisma.task.findUnique({ where: { id } });
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Insert task assignees
        await prisma.task_assignee.createMany({
            data: users.map(u => ({
                task_id: id,
                user_id: u.receiver_id,
                proj_id: task.project_id,
                org_id: task.org_id,
            })),
            skipDuplicates: true,
        });

        // Ensure users are part of project
        await Promise.all(
            users.map(async (u) => {
                const exists = await prisma.proj_member.findUnique({
                    where: {
                        proj_id_member_id: {
                            proj_id: task.project_id,
                            member_id: u.receiver_id,
                        },
                    },
                });

                if (!exists) {
                    // Add user to project
                    await prisma.proj_member.create({
                        data: {
                            proj_id: task.project_id,
                            member_id: u.receiver_id,
                            org_id: org_id,
                            role: "member"
                        },
                    });

                    io.to(`org_member_${task.org_id}`).emit("project_created", {
                        proj_id: task.project_id,
                    });
                }
            })
        );

        const newUsers = await prisma.user.findMany({
            where: {
                id: { in: users.map(u => u.receiver_id) },
            },
            select: { id: true, email: true, name: true },
        });

        const result = {
            members: newUsers,
        };
        
        const taskresult =  newUsers.map(user => ({
            id : user.id
        }));

        io.to(`proj_${task.project_id}`).emit("member_added", result);
        io.to(`proj_${task.project_id}`).emit("Add member", taskresult);
        return res.status(201).json({ result });
    } catch (error) {
        console.error("addmember:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};