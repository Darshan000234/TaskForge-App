import { Worker } from "bullmq";
import { connection } from "../queue/connection.js";
import { transporter } from "../utils/mailer.js";
import prisma from "../config/prisma.js";

const worker = new Worker(
    "reminder",
    async (job) => {
        console.log("JOB RECEIVED:", job.id, job.data);
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
        const emails = task.assignees
            .map(a => a.user?.email)
            .filter(Boolean);

        const BATCH_SIZE = 5;

        for (let i = 0; i < emails.length; i += BATCH_SIZE) {
            const batch = emails.slice(i, i + BATCH_SIZE);

            await Promise.all(
                batch.map(async (email) => {
                    try {
                        const info = await transporter.sendMail({
                            to: email,
                            subject: `⏰ Task Reminder: ${task.name}`,
                            text: `Task "${task.name}" is due on ${task.dueDate}`
                        });

                        console.log("Email sent:", email, info.messageId);
                    } catch (err) {
                        console.log("Email failed:", email, err.message);
                    }
                })
            );

            const sleep = (ms) => new Promise(res => setTimeout(res, ms));
            await sleep(1000);
        }
    },
    { connection }
);

worker.on("completed", job => {
    console.log("Job completed:", job.id);
});

worker.on("failed", (job, err) => {
    console.log("Job failed:", job?.id, err.message);
});

worker.on("error", err => {
    console.log("Worker error:", err);
});