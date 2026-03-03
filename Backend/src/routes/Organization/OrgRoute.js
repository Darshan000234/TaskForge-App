import express from "express"
import authMiddleware from '../../middlewares/authMiddleware.js';
import { addOrganization, updateOrganization, deleteOrganization, DataOrganization } from '../../controllers/OrgController.js';
const router = express.Router();

router.get('/',authMiddleware,DataOrganization);
router.post('/add',authMiddleware,addOrganization);
router.patch('/update',authMiddleware,updateOrganization); // only can change username other than this there is nothing to change
router.delete('/delete',authMiddleware,deleteOrganization);

export default router;