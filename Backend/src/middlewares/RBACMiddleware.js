import prisma from '../config/prisma.js';


export const checkRole = (requiredRole) => {
    return async (req, res, next) => {
        const userId = req.user.id;
        const org_id = Number(req.body.org_id || req.params.orgId || req.body.orgId);

        const membership = await prisma.org_member.findFirst({
            where: {
                member_id: userId,
                org_id: org_id
            }
        });

        if (!membership || membership.role !== requiredRole) {
            return res.status(403).json({ message: "Forbidden" });
        }

        next();
    };
};