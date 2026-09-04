import { asyncHandler } from '../utils/asyncHandler.js';
import * as wardenService from '../services/wardenService.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await wardenService.getWardenDashboard(req.wardenHostel);
  res.json({ success: true, data });
});

export const getStudents = asyncHandler(async (req, res) => {
  const students = await wardenService.getStudentsInHostel(req.wardenHostel._id);
  res.json({ success: true, data: students });
});

export const getRooms = asyncHandler(async (req, res) => {
  const rooms = await wardenService.getRoomStatus(req.wardenHostel._id);
  res.json({ success: true, data: rooms });
});

export const getDocuments = asyncHandler(async (req, res) => {
  const docs = await wardenService.getDocumentsForHostel(req.wardenHostel._id);
  res.json({ success: true, data: docs });
});

export const verifyDocument = asyncHandler(async (req, res) => {
  const doc = await wardenService.verifyDocument(req.params.id, req.user._id, req.body.verified);
  res.json({ success: true, data: doc });
});

export const getStudentDocuments = asyncHandler(async (req, res) => {
  const docs = await wardenService.getStudentDocuments(req.params.studentId, req.wardenHostel._id);
  res.json({ success: true, data: docs });
});
