import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  adminLoginValidation,
  studentLoginValidation,
  wardenLoginValidation,
  updateAdminProfileValidation,
  changePasswordValidation,
} from '../validators/authValidators.js';

const router = Router();

router.post('/admin/login', adminLoginValidation, validate, authController.loginAdmin);
router.post('/student/login', studentLoginValidation, validate, authController.loginStudent);
router.post('/warden/login', wardenLoginValidation, validate, authController.loginWarden);
router.get('/me', protect, authController.getMe);
router.put(
  '/admin/profile',
  protect,
  authorize('admin'),
  updateAdminProfileValidation,
  validate,
  authController.updateAdminProfile
);
router.put(
  '/change-password',
  protect,
  authorize('student', 'warden'),
  changePasswordValidation,
  validate,
  authController.changePassword
);

export default router;
