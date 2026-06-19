import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    service : "gmail",
    auth : {
        user : process.env.EMAIL_USER,
        password : process.env.EMAIL_PASS
    }
});
