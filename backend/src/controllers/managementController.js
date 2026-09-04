import * as studentManagementService from '../services/studentManagementService.js';
import * as wardenManagementService from '../services/wardenManagementService.js';
import { parseStudentFile, generateStudentTemplate } from '../utils/importParser.js';
import { removeTempFile } from '../utils/tempStorage.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getStudents = asyncHandler(async (req, res) => {
  const data = await studentManagementService.getStudents(req.query);
  res.json({ success: true, data });
});

export const createStudent = asyncHandler(async (req, res) => {
  const student = await studentManagementService.createStudent(req.body);
  res.status(201).json({ success: true, data: student });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await studentManagementService.updateStudent(req.params.id, req.body);
  res.json({ success: true, data: student });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const result = await studentManagementService.deleteStudent(req.params.id);
  res.json({ success: true, ...result });
});

export const importStudents = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a CSV or Excel file' });
  }

  try {
    const rows = parseStudentFile(req.file.path, req.file.originalname);
    const results = await studentManagementService.importStudents(rows);
    res.json({ success: true, data: results });
  } finally {
    await removeTempFile(req.file.path);
  }
});

export const downloadTemplate = asyncHandler(async (req, res) => {
  const buffer = generateStudentTemplate();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=student_import_template.xlsx');
  res.send(buffer);
});

export const getWardens = asyncHandler(async (req, res) => {
  const wardens = await wardenManagementService.getWardens(req.query);
  res.json({ success: true, data: wardens });
});

export const getAvailableWardens = asyncHandler(async (req, res) => {
  const wardens = await wardenManagementService.getAvailableWardens();
  res.json({ success: true, data: wardens });
});

export const createWarden = asyncHandler(async (req, res) => {
  const warden = await wardenManagementService.createWarden(req.body);
  res.status(201).json({ success: true, data: warden });
});

export const updateWarden = asyncHandler(async (req, res) => {
  const warden = await wardenManagementService.updateWarden(req.params.id, req.body);
  res.json({ success: true, data: warden });
});

export const deleteWarden = asyncHandler(async (req, res) => {
  const result = await wardenManagementService.deleteWarden(req.params.id);
  res.json({ success: true, ...result });
});

export const assignWardenToHostel = asyncHandler(async (req, res) => {
  const result = await wardenManagementService.assignWardenToHostel(
    req.params.hostelId,
    req.body.wardenId
  );
  res.json({ success: true, data: result });
});

export const unassignWardenFromHostel = asyncHandler(async (req, res) => {
  const result = await wardenManagementService.unassignWardenFromHostel(req.params.hostelId);
  res.json({ success: true, ...result });
});
