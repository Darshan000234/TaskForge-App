import express from "express"
import authMiddleware from '../../middlewares/authMiddleware.js';
import { 
    addOrganization, 
    updateOrganization, 
    deleteOrganization, 
    DataOrganization,
    DataOrganizationMembers,
    activeOrgs } from '../../controllers/OrgController.js';
const router = express.Router();

router.get('/',authMiddleware,DataOrganization);
router.post('/add',authMiddleware,addOrganization);
router.patch('/update',authMiddleware,updateOrganization); // only can change username other than this there is nothing to change
router.delete('/delete',authMiddleware,deleteOrganization);
router.get('/:id/members',authMiddleware,DataOrganizationMembers); // get all members of the organization
router.get('/activeorg/:id',authMiddleware,activeOrgs);

export default router;