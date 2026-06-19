import { Worker } from "bullmq";
import { connection } from "../queue/connection.js";
import { transporter } from "../utils/mailer.js";

new Worker(
    "reminder",
    async (job) => {
        const { taskId } = job.data;

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                assignees: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!task) return;
        if (task.Status === "Done") return;
        if (new Date(task.dueDate) > new Date()) return;
        const emails = task.assignees
            .map(a => a.user?.email)
            .filter(Boolean);

        const BATCH_SIZE = 5;

        for (let i = 0; i < emails.length; i += BATCH_SIZE) {
            const batch = emails.slice(i, i + BATCH_SIZE);

            await Promise.all(
                batch.map(email =>
                    transporter.sendMail({
                        to: email,
                        subject: `⏰ Task Reminder: ${task.name}`,
                        text: `Task "${task.name}" is due on ${task.dueDate}`
                    })
                )
            );

            const sleep = (ms) => new Promise(res => setTimeout(res, ms));
            await sleep(1000);
        }
    },
    { connection }
);