import { Queue } from "bullmq";
import { connection } from "./connection.js";

export const inviteQueue = new Queue("invite", {
  connection,
  limiter: {
    max: 10,       
    duration: 1000
  }
});