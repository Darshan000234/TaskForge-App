import express from "express"
import authMiddleware from '../../middlewares/authMiddleWare.js';
import { 
    addOrganization, 
    updateOrganization, 
    deleteOrganization, 
    DataOrganization,
    DataOrganizationMembers,
    updateactiveOrgs,
    getActiveOrgs,
    StatsData,getOrgTasks } from '../../controllers/OrgController.js';
import { OrgcheckRole } from "../../middlewares/RBACMiddleware.js";

const router = express.Router();

router.get('/',authMiddleware,DataOrganization);
router.get('/mine',authMiddleware, async (req, res) => {
  const { id } = req.user;
  try {
    const data = await prisma.org.findFirst({
        where : {
            userId : id
        }
    })
    return data;
  } catch (error) {
    res.status(404).json({message : error.message});
  }
})
router.post('/add',authMiddleware,addOrganization);
router.patch('/update',authMiddleware,OrgcheckRole,updateOrganization); // only can change username other than this there is nothing to change
router.delete('/delete/:org_id',authMiddleware,OrgcheckRole,deleteOrganization);
router.get('/:id/members',authMiddleware,DataOrganizationMembers); // get all members of the organization
router.get('/activeorgs',authMiddleware,getActiveOrgs); // get all active orgs of the user
router.get('/activeorgs/:id',authMiddleware,updateactiveOrgs);
router.get('/stats/:id',authMiddleware,StatsData);
router.get('/:orgId/tasks/',authMiddleware,getOrgTasks);

export default router;