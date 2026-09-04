import { Router } from 'express';
import * as wardenController from '../controllers/wardenController.js';
import { protect, authorize, wardenHostelAccess } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { verifyDocumentValidation } from '../validators/authValidators.js';

const router = Router();

router.use(protect, authorize('warden'), wardenHostelAccess);

router.get('/dashboard', wardenController.getDashboard);
router.get('/students', wardenController.getStudents);
router.get('/rooms', wardenController.getRooms);
router.get('/documents', wardenController.getDocuments);
router.get('/students/:studentId/documents', wardenController.getStudentDocuments);
router.put('/documents/:id/verify', verifyDocumentValidation, validate, wardenController.verifyDocument);

export default router;
