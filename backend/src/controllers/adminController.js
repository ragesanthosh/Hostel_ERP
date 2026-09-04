import { asyncHandler } from '../utils/asyncHandler.js';
import * as adminService from '../services/adminService.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.json({ success: true, data: stats });
});

export const createHostel = asyncHandler(async (req, res) => {
  const hostel = await adminService.createHostel(req.body);
  res.status(201).json({ success: true, data: hostel });
});

export const updateHostel = asyncHandler(async (req, res) => {
  const hostel = await adminService.updateHostel(req.params.id, req.body);
  res.json({ success: true, data: hostel });
});

export const deleteHostel = asyncHandler(async (req, res) => {
  const result = await adminService.deleteHostel(req.params.id);
  res.json({ success: true, ...result });
});

export const getHostel = asyncHandler(async (req, res) => {
  const hostel = await adminService.getHostelById(req.params.id);
  res.json({ success: true, data: hostel });
});

export const assignWarden = asyncHandler(async (req, res) => {
  const result = await adminService.assignWarden(req.params.id, req.body);
  res.json({ success: true, data: result });
});

export const createMapping = asyncHandler(async (req, res) => {
  const { year, branches } = req.body;
  const mappings = await adminService.createBranchYearMapping(req.params.id, year, branches);
  res.status(201).json({ success: true, data: mappings });
});

export const getHostelMappings = asyncHandler(async (req, res) => {
  const mappings = await adminService.getMappingsByHostel(req.params.id);
  res.json({ success: true, data: mappings });
});

export const getAllMappings = asyncHandler(async (req, res) => {
  const mappings = await adminService.getAllMappings();
  res.json({ success: true, data: mappings });
});

export const updateMapping = asyncHandler(async (req, res) => {
  const mapping = await adminService.updateMapping(req.params.id, req.body);
  res.json({ success: true, data: mapping });
});

export const deleteMapping = asyncHandler(async (req, res) => {
  const result = await adminService.deleteMapping(req.params.id);
  res.json({ success: true, ...result });
});

export const getBranchStrengths = asyncHandler(async (req, res) => {
  const strengths = await adminService.getBranchStrengths(req.query.year);
  res.json({ success: true, data: strengths });
});

export const getAllocationOverview = asyncHandler(async (req, res) => {
  const overview = await adminService.getAllocationOverview();
  res.json({ success: true, data: overview });
});
