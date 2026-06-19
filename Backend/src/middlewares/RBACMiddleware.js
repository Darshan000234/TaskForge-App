import prisma from '../config/prisma.js';


export const OrgcheckRole = () => {
    return async (req, res, next) => {
        const userId = req.user.id;
        const org_id = Number(req.body?.org_id || req.body?.org?.id || req.params?.org_id || req.body?.orgId);

        const membership = await prisma.org_member.findFirst({
            where: {
                member_id: userId,
                org_id: org_id
            }
        });

        if (!membership || membership.role !== 'member') {
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

        if (!membership || membership.role !== 'member') {
            return res.status(403).json({ message: "Forbidden" });
        }

        next();
    }
}
