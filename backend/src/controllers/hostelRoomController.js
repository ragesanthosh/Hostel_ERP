import * as hostelRoomService from '../services/hostelRoomService.js';
import { parseHostelRows, parseRoomRows, generateHostelTemplate, generateRoomTemplate } from '../utils/hostelImportParser.js';
import { removeTempFile } from '../utils/tempStorage.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getHostels = asyncHandler(async (req, res) => {
  const hostels = await hostelRoomService.getHostels(req.query);
  res.json({ success: true, data: hostels });
});

export const createHostel = asyncHandler(async (req, res) => {
  const hostel = await hostelRoomService.createHostel(req.body);
  res.status(201).json({ success: true, data: hostel });
});

export const updateHostel = asyncHandler(async (req, res) => {
  const hostel = await hostelRoomService.updateHostel(req.params.id, req.body);
  res.json({ success: true, data: hostel });
});

export const deleteHostel = asyncHandler(async (req, res) => {
  const result = await hostelRoomService.deleteHostel(req.params.id);
  res.json({ success: true, ...result });
});

export const importHostels = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a CSV or Excel file' });

  try {
    const rows = parseHostelRows(req.file.path);
    const report = await hostelRoomService.importHostels(rows);
    res.json({ success: true, data: report });
  } finally {
    await removeTempFile(req.file.path);
  }
});

export const downloadHostelTemplate = asyncHandler(async (req, res) => {
  const buffer = generateHostelTemplate();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=hostel_import_template.xlsx');
  res.send(buffer);
});

export const getRooms = asyncHandler(async (req, res) => {
  const rooms = await hostelRoomService.getRoomsByHostel(req.params.hostelId, req.query);
  res.json({ success: true, data: rooms });
});

export const createRoom = asyncHandler(async (req, res) => {
  const room = await hostelRoomService.createRoom(req.params.hostelId, req.body);
  res.status(201).json({ success: true, data: room });
});

export const updateRoom = asyncHandler(async (req, res) => {
  const room = await hostelRoomService.updateRoom(req.params.roomId, req.body);
  res.json({ success: true, data: room });
});

export const deleteRoom = asyncHandler(async (req, res) => {
  const result = await hostelRoomService.deleteRoom(req.params.roomId);
  res.json({ success: true, ...result });
});

export const importRooms = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a CSV or Excel file' });

  try {
    const rows = parseRoomRows(req.file.path);
    const report = await hostelRoomService.importRooms(rows, req.params.hostelId || null);
    res.json({ success: true, data: report });
  } finally {
    await removeTempFile(req.file.path);
  }
});

export const importRoomsGlobal = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a CSV or Excel file' });

  try {
    const rows = parseRoomRows(req.file.path);
    const report = await hostelRoomService.importRooms(rows);
    res.json({ success: true, data: report });
  } finally {
    await removeTempFile(req.file.path);
  }
});

export const downloadRoomTemplate = asyncHandler(async (req, res) => {
  const buffer = generateRoomTemplate();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=room_import_template.xlsx');
  res.send(buffer);
});

export const recalculateCapacity = asyncHandler(async (req, res) => {
  const capacity = await hostelRoomService.recalculateHostelCapacity(req.params.hostelId);
  res.json({ success: true, data: { capacity } });
});
