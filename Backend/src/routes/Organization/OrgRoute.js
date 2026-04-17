import express from "express"
import authMiddleware from '../../middlewares/authMiddleWare.js';
import { 
    addOrganization, 
    updateOrganization, 
    deleteOrganization, 
    DataOrganization,
    DataOrganizationMembers,
    updateactiveOrgs,
    getActiveOrgs } from '../../controllers/OrgController.js';
import { checkRole } from "../../middlewares/RBACMiddleware.js";

const router = express.Router();

router.get('/',authMiddleware,DataOrganization);
router.post('/add',authMiddleware,addOrganization);
router.patch('/update',authMiddleware,checkRole("admin"),updateOrganization); // only can change username other than this there is nothing to change
router.delete('/delete',authMiddleware,checkRole("admin"),deleteOrganization);
router.get('/:id/members',authMiddleware,DataOrganizationMembers); // get all members of the organization
router.get('/activeorgs/:id',authMiddleware,updateactiveOrgs);
router.get('/activeorgs',authMiddleware,getActiveOrgs); // get all active orgs of the user


export default router;