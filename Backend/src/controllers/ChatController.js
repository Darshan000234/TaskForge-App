import prisma from "../config/prisma.js";
import { getIO } from "../utils/socket.js";
import cloudinary from "../config/cloudinary.js";
import { uploadToCloudinary } from "../utils/upload.js";

export const MessageData = async (req, res) => {
  const task_id = Number(req.params.id);
  try {
    const result = await prisma.message.findMany({
      where: {
        task_id: task_id
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    res.status(202).json({ result });
  } catch (error) {
    console.log("MessageData");
    console.log(error.message);

    res.status(404).json({ messages: error.message });
  }
}

export const sentMessage = async (req, res) => {
  const user_id = req.user.id;
  const io = getIO();
  try {
    const { task_id, type, content, proj_id } = req.body;
    const file = req.file;
    const exist = await prisma.task_assignee.findUnique({
      where: {
        task_id_user_id: {
          task_id: Number(task_id),
          user_id: user_id
        }
      },
      select : {
        proj_id : true
      }
    })

    const projectmemberShip = await prisma.proj_member.findUnique({
      where: {
        proj_id_member_id: {
          proj_id: Number(proj_id),
          member_id: user_id
        }
      }
    })

    if (!exist && projectmemberShip && projectmemberShip.role === 'member') {
      return res.status(404).json({ message: "forbidden" });
    }

    let fileUrl = null;
    let fileName = null;
    let mimeType = null;

    if (file) {

      const result = await uploadToCloudinary(file);

      fileUrl = result.secure_url;
      fileName = file.originalname;
      mimeType = file.mimetype;
    }

    const msg = await prisma.$transaction(async (tx) => {
      return await tx.message.create({
        data: {
          task_id: Number(task_id),
          user_id,
          type,
          content: type === "TEXT" ? content : null,
          fileUrl,
          fileName,
          mimeType,
        },
      });
    });
    const data = await prisma.message.findUnique({
      where: {
        id: msg.id
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    io.to(`task_${task_id}`).emit("message", data);
    res.status(200).json({ result: msg });
  } catch (error) {
    console.log("sentMessage");
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
};
