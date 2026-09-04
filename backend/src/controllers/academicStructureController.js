import * as academicStructureService from '../services/academicStructureService.js';
import {
  parseAcademicStructureFile,
  generateAcademicStructureTemplate,
} from '../utils/academicStructureParser.js';
import { removeTempFile } from '../utils/tempStorage.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getRecords = asyncHandler(async (req, res) => {
  const data = await academicStructureService.getRecords(req.query);
  res.json({ success: true, data });
});

export const getYears = asyncHandler(async (req, res) => {
  const years = await academicStructureService.getYears();
  res.json({ success: true, data: years });
});

export const getBranchesByYear = asyncHandler(async (req, res) => {
  const records = await academicStructureService.getBranchesByYear(req.params.year);
  res.json({ success: true, data: records });
});

export const getStatus = asyncHandler(async (req, res) => {
  const status = await academicStructureService.getStatus();
  res.json({ success: true, data: status });
});

export const createRecord = asyncHandler(async (req, res) => {
  const record = await academicStructureService.createRecord(req.body);
  res.status(201).json({ success: true, data: record });
});

export const updateRecord = asyncHandler(async (req, res) => {
  const record = await academicStructureService.updateRecord(req.params.id, req.body);
  res.json({ success: true, data: record });
});

export const deleteRecord = asyncHandler(async (req, res) => {
  const result = await academicStructureService.deleteRecord(req.params.id);
  res.json({ success: true, ...result });
});

export const importRecords = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a CSV or Excel file' });
  }

  try {
    const rows = parseAcademicStructureFile(req.file.path);
    const report = await academicStructureService.importRecords(rows);
    res.json({ success: true, data: report });
  } finally {
    await removeTempFile(req.file.path);
  }
});

export const downloadTemplate = asyncHandler(async (req, res) => {
  const buffer = generateAcademicStructureTemplate();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=academic_structure_template.xlsx');
  res.send(buffer);
});
