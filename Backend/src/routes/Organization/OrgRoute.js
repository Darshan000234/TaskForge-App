import express from "express";
import {
    addOrganization, updateOrganization, deleteOrganization,
    DataOrganization, DataOrganizationMembers, updateactiveOrgs,
    getActiveOrgs, StatsData, getOrgTasks
} from '../../controllers/OrgController.js';
import { OrgcheckRole } from "../../middlewares/RBACMiddleware.js";
import { methodLimiter } from "../../middlewares/RateLimiter.js";
import prisma from "../../config/prisma.js";
import { redis } from "../../config/redis.js";

const router = express.Router();

router.use(methodLimiter);

router.get('/', DataOrganization);
router.get('/activeorgs', getActiveOrgs);
router.put('/activeorgs/:id', updateactiveOrgs);
router.get('/stats/:id', StatsData);
router.get('/:id/members', DataOrganizationMembers);
router.get('/:orgId/tasks/', getOrgTasks);
router.get('/mine', async (req, res) => {
    try {
        const data = await prisma.org.findFirst({
            where: { userId: req.user.id }
        });

        if (!data) return res.status(404).json({ message: "Org not found" });
        return res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.post('/add', addOrganization);
router.patch('/update', OrgcheckRole(), updateOrganization);
router.delete('/delete/:org_id', deleteOrganization);

export default router;
