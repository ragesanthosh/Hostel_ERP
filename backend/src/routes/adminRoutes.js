import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import * as managementController from '../controllers/managementController.js';
import * as hostelRoomController from '../controllers/hostelRoomController.js';
import * as academicStructureController from '../controllers/academicStructureController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { importUpload } from '../middleware/importUpload.js';
import {
  createHostelValidation,
  createRoomValidation,
  assignWardenValidation,
  assignWardenToHostelValidation,
  createMappingValidation,
  updateMappingValidation,
  createStudentValidation,
  createWardenValidation,
  createAcademicStructureValidation,
} from '../validators/authValidators.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/allocation-overview', adminController.getAllocationOverview);
router.get('/branch-strengths', adminController.getBranchStrengths);
router.get('/mappings', adminController.getAllMappings);
router.put('/mappings/:id', updateMappingValidation, validate, adminController.updateMapping);
router.delete('/mappings/:id', adminController.deleteMapping);

router.get('/academic-structure/template', academicStructureController.downloadTemplate);
router.get('/academic-structure/years', academicStructureController.getYears);
router.get('/academic-structure/status', academicStructureController.getStatus);
router.get('/academic-structure/by-year/:year', academicStructureController.getBranchesByYear);
router.get('/academic-structure', academicStructureController.getRecords);
router.post(
  '/academic-structure',
  createAcademicStructureValidation,
  validate,
  academicStructureController.createRecord
);
router.put('/academic-structure/:id', academicStructureController.updateRecord);
router.delete('/academic-structure/:id', academicStructureController.deleteRecord);
router.post(
  '/academic-structure/import',
  importUpload.single('file'),
  academicStructureController.importRecords
);

router.get('/students/template', managementController.downloadTemplate);
router.get('/students', managementController.getStudents);
router.post('/students', createStudentValidation, validate, managementController.createStudent);
router.put('/students/:id', managementController.updateStudent);
router.delete('/students/:id', managementController.deleteStudent);
router.post('/students/import', importUpload.single('file'), managementController.importStudents);

router.get('/wardens', managementController.getWardens);
router.get('/wardens/available', managementController.getAvailableWardens);
router.post('/wardens', createWardenValidation, validate, managementController.createWarden);
router.put('/wardens/:id', managementController.updateWarden);
router.delete('/wardens/:id', managementController.deleteWarden);

router.get('/hostels/template', hostelRoomController.downloadHostelTemplate);
router.post('/hostels/import', importUpload.single('file'), hostelRoomController.importHostels);
router.get('/hostels/list', hostelRoomController.getHostels);
router.post('/hostels', createHostelValidation, validate, hostelRoomController.createHostel);
router.get('/hostels/:id', adminController.getHostel);
router.put('/hostels/:id', hostelRoomController.updateHostel);
router.delete('/hostels/:id', hostelRoomController.deleteHostel);
router.post('/hostels/:id/assign-warden', assignWardenValidation, validate, adminController.assignWarden);
router.post('/hostels/:hostelId/assign-warden-by-id', assignWardenToHostelValidation, validate, managementController.assignWardenToHostel);
router.delete('/hostels/:hostelId/warden', managementController.unassignWardenFromHostel);
router.post('/hostels/:id/mappings', createMappingValidation, validate, adminController.createMapping);
router.get('/hostels/:id/mappings', adminController.getHostelMappings);
router.post('/hostels/:hostelId/recalculate-capacity', hostelRoomController.recalculateCapacity);

router.get('/rooms/template', hostelRoomController.downloadRoomTemplate);
router.post('/rooms/import', importUpload.single('file'), hostelRoomController.importRoomsGlobal);
router.get('/hostels/:hostelId/rooms', hostelRoomController.getRooms);
router.post('/hostels/:hostelId/rooms', createRoomValidation, validate, hostelRoomController.createRoom);
router.post('/hostels/:hostelId/rooms/import', importUpload.single('file'), hostelRoomController.importRooms);
router.put('/rooms/:roomId', hostelRoomController.updateRoom);
router.delete('/rooms/:roomId', hostelRoomController.deleteRoom);

export default router;
