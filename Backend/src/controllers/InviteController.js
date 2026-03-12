import prisma from "../config/prisma.js";

export const inviteData = async (req, res) => {
    const { email } = req.user;
    // console.log(email);

    try {
        const data = await prisma.teaminvitation.findMany({
            where : {
                receiver_email : email,
                status : "pending"
            }
        });

        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({message : error.message});
    }
}

// export const acceptInvite = async (req, res) => {

// }
