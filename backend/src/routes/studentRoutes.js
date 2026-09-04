import { Router } from 'express';
import * as studentController from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import {
  createGroupValidation,
  inviteRoommatesValidation,
  respondInvitationValidation,
  selectRoomValidation,
} from '../validators/authValidators.js';

const router = Router();

router.use(protect, authorize('student'));

router.get('/dashboard', studentController.getDashboard);
router.get('/group', studentController.getGroup);
router.post('/group/reset', studentController.resetGroup);
router.post('/group', createGroupValidation, validate, studentController.createGroup);
router.post('/group/invite', inviteRoommatesValidation, validate, studentController.inviteRoommates);
router.put('/invitations/:id/respond', respondInvitationValidation, validate, studentController.respondInvitation);
router.get('/rooms', studentController.getAvailableRooms);
router.post('/rooms/select', selectRoomValidation, validate, studentController.selectRoom);
router.get('/group/:groupId/documents', studentController.getDocuments);
router.post('/documents', upload.any(), studentController.uploadDocuments);

export default router;
