import prisma from '../config/prisma.js';


export const OrgcheckRole = () => {
    return async (req, res, next) => {
        const userId = req.user.id;
        const org_id = Number(req.body?.org_id || req.body?.org?.id || req.params?.org_id || req.body?.orgId );
        if (!org_id || isNaN(org_id)) {
            return res.status(400).json({ message: "Invalid org_id" });
        }
        
        const membership = await prisma.org_member.findFirst({
            where: {
                member_id: userId, 
                org_id: org_id
            }
        });
        
        if (!membership || membership.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden" });
        }

        next();
    };
};

export const ProjCheckRole = () => {
    return async (req, res, next) => {
        const userId = req.user.id;
        const proj_id = Number(req.body?.proj_id);

        
        const membership = await prisma.proj_member.findFirst({
            where: {
                member_id: userId,
                proj_id: proj_id
            }
        });

        if (!membership || membership.role === 'member') {
            return res.status(403).json({ message: "Forbidden" });
        }

        next();
    }
}

export const TaskCheckRole = () => {
  return async (req, res, next) => {
    try {
      const user_id = req.user.id;
      const task_id = Number(req.params.id);

      const task = await prisma.task.findUnique({
        where: { id: task_id },
        select: { project_id: true },
      });

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const projMember = await prisma.proj_member.findUnique({
        where: {
          proj_id_member_id: {
            proj_id: task.project_id,
            member_id: user_id,
          },
        },
      });

      if (!projMember) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (projMember.role === "admin" || projMember.role === "manager") {
        return next();
      }

      const assignment = await prisma.task_assignee.findUnique({
        where: {
          task_id_user_id: {
            task_id,
            user_id,
          },
        },
      });

      if (!assignment) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
};