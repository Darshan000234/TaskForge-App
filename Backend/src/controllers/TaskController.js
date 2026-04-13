import prisma from "../config/prisma.js";
import { userSockets } from "../utils/userSockets.js";


export const TaskData = async (req, res) => {
    const id = Number(req.params.id);
    // console.log(id);
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
        console.log(result);
        res.status(200).json({ result });
    } catch (error) {
        console.log("taskData");
        console.log(error.message);
        res.status(404).json({ message : error.message });
    }
}