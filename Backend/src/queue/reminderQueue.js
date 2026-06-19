import { Queue } from "bullmq";
import { connection } from "./connection.js";

export const reminderQueue = new Queue("reminder", {
  connection,
  limiter: {
    max: 10,      
    duration: 1000 
  }
});