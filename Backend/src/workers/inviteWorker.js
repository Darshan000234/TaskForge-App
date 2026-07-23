import { Worker } from "bullmq";
import { connection } from "../queue/connection.js";
import { transporter } from "../utils/mailer.js";

new Worker (
    "invite",
    async (job) => {
        if(job.name === "send_invite_email") {
            const { email,org_name,name } = job.data;

            await transporter.sendMail({
                to : email,
                subject : "you are invited!",
                text : `you have been invited by ${name} to join the org ${org_name}`
            })

            // console.log("Email sent to:", email);
        }
    },
    { connection }
);