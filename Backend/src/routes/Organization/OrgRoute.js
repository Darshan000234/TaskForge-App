import express from "express";
import {
    addOrganization, updateOrganization, deleteOrganization,
    DataOrganization, DataOrganizationMembers, updateactiveOrgs,
    getActiveOrgs, StatsData, getOrgTasks
} from '../../controllers/OrgController.js';
import { OrgcheckRole } from "../../middlewares/RBACMiddleware.js";
import { readLimiter, writeLimiter } from "../../middlewares/rateLimiter.js";
import prisma from "../../config/prisma.js";

const router = express.Router();

router.get('/',                 readLimiter, DataOrganization);
router.get('/activeorgs',       readLimiter, getActiveOrgs);
router.get('/activeorgs/:id',   readLimiter, updateactiveOrgs);
router.get('/stats/:id',        readLimiter, StatsData);
router.get('/:id/members',      readLimiter, DataOrganizationMembers);
router.get('/:orgId/tasks/',    readLimiter, getOrgTasks);

router.get('/mine', readLimiter, async (req, res) => {
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

router.post('/add',             writeLimiter, addOrganization);
router.patch('/update',         OrgcheckRole, writeLimiter, updateOrganization);
router.delete('/delete/:org_id',OrgcheckRole, writeLimiter, deleteOrganization);

export default router;