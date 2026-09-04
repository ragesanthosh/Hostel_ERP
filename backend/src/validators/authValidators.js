import { body } from 'express-validator';
import { BRANCHES, YEARS, GENDERS } from '../utils/constants.js';

export const adminLoginValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('pin').trim().notEmpty().withMessage('Security PIN is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const studentLoginValidation = [
  body('regNo').trim().notEmpty().withMessage('Registration number is required'),
  body('rollNo').trim().notEmpty().withMessage('Roll number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const wardenLoginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const createStudentValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('regNo').trim().notEmpty().withMessage('Registration number is required'),
  body('rollNo').trim().notEmpty().withMessage('Roll number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('branch').isIn(BRANCHES).withMessage('Invalid branch'),
  body('year').isIn(YEARS).withMessage('Invalid academic year'),
  body('gender').isIn(GENDERS).withMessage('Invalid gender'),
  body('password').optional().isLength({ min: 6 }),
];

export const createWardenValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
  body('pin').trim().notEmpty().withMessage('Security PIN is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const assignWardenToHostelValidation = [
  body('wardenId').notEmpty().withMessage('Warden ID is required'),
];

export const createHostelValidation = [
  body('name').trim().notEmpty().withMessage('Hostel name is required'),
  body('code').trim().notEmpty().withMessage('Hostel code is required'),
  body('capacity').isInt({ min: 0 }).withMessage('Capacity must be 0 or greater'),
  body('gender').optional().isIn(['Boys', 'Girls', 'Mixed']),
  body('status').optional().isIn(['Active', 'Inactive']),
];

export const createRoomValidation = [
  body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Room capacity must be at least 1'),
  body('status').optional().isIn(['Active', 'Inactive', 'Under Maintenance']),
];

export const assignWardenValidation = [
  body('wardenId').optional().notEmpty(),
  body('name').optional().trim().notEmpty(),
  body('employeeId').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('mobile').optional().trim().notEmpty(),
  body('pin').optional().trim().notEmpty(),
  body('password').optional().isLength({ min: 6 }),
];

export const createMappingValidation = [
  body('year').notEmpty().withMessage('Year is required'),
  body('branches').isArray({ min: 1 }).withMessage('At least one branch is required'),
];

export const updateMappingValidation = [
  body('hostelId').notEmpty().withMessage('Hostel ID is required'),
];

export const createAcademicStructureValidation = [
  body('year').isIn(YEARS).withMessage('Invalid academic year'),
  body('branch').trim().notEmpty().withMessage('Branch name is required'),
  body('studentStrength').isInt({ min: 1 }).withMessage('Student strength must be at least 1'),
];

export const createGroupValidation = [
  body('size').isInt({ min: 1, max: 3 }).withMessage('Group size must be between 1 and 3'),
];

export const inviteRoommatesValidation = [
  body('roommates').isArray().withMessage('Roommates must be an array'),
  body('roommates.*.regNo').trim().notEmpty(),
  body('roommates.*.rollNo').trim().notEmpty(),
  body('roommates.*.email').isEmail(),
];

export const respondInvitationValidation = [
  body('action').isIn(['accept', 'reject']).withMessage('Action must be accept or reject'),
];

export const selectRoomValidation = [
  body('roomId').notEmpty().withMessage('Room ID is required'),
];

export const verifyDocumentValidation = [
  body('verified').isBoolean().withMessage('Verified must be a boolean'),
];

export const updateAdminProfileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('currentPassword').optional().notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
  body().custom((value) => {
    if (value.newPassword && !value.currentPassword) {
      throw new Error('Current password is required to set a new password');
    }
    if (!value.name && !value.email && !value.newPassword) {
      throw new Error('At least one field must be provided');
    }
    return true;
  }),
];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];
