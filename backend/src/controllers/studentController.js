import { asyncHandler } from '../utils/asyncHandler.js';
import * as studentService from '../services/studentService.js';
import { uploadDocumentFromPath } from '../services/cloudinaryService.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await studentService.getStudentDashboard(req.user._id);
  res.json({ success: true, data });
});

export const createGroup = asyncHandler(async (req, res) => {
  const group = await studentService.createGroup(req.user._id, req.body.size);
  res.status(201).json({ success: true, data: group });
});

export const inviteRoommates = asyncHandler(async (req, res) => {
  const invitations = await studentService.inviteRoommates(req.user._id, req.body.roommates);
  res.status(201).json({ success: true, data: invitations });
});

export const respondInvitation = asyncHandler(async (req, res) => {
  const result = await studentService.respondToInvitation(
    req.params.id,
    req.user._id,
    req.body.action
  );
  res.json({ success: true, ...result });
});

export const getAvailableRooms = asyncHandler(async (req, res) => {
  const rooms = await studentService.getAvailableRooms(req.user._id);
  res.json({ success: true, data: rooms });
});

export const selectRoom = asyncHandler(async (req, res) => {
  const result = await studentService.selectRoom(req.user._id, req.body.roomId);
  res.json({ success: true, data: result });
});

export const uploadDocuments = asyncHandler(async (req, res) => {
  const groupId = req.body.groupId;

  if (!groupId) {
    return res.status(400).json({ success: false, message: 'Group ID is required' });
  }

  if (req.files?.length) {
    const uploaded = [];
    for (const file of req.files) {
      const result = await uploadDocumentFromPath(file.path, file.mimetype);
      const [userId, type] = file.fieldname.split('|');
      uploaded.push({
        userId,
        type,
        fileUrl: result.fileUrl,
        publicId: result.publicId,
      });
    }
    const uploadResult = await studentService.uploadDocuments(req.user._id, groupId, uploaded);
    return res.json({ success: true, data: uploadResult });
  }

  const { documents } = req.body;
  const result = await studentService.uploadDocuments(req.user._id, groupId, documents || []);
  res.json({ success: true, data: result });
});

export const getGroup = asyncHandler(async (req, res) => {
  const group = await studentService.getGroupDetails(req.user._id);
  res.json({ success: true, data: group });
});

export const getDocuments = asyncHandler(async (req, res) => {
  const docs = await studentService.getGroupDocuments(req.params.groupId, req.user._id);
  res.json({ success: true, data: docs });
});

export const resetGroup = asyncHandler(async (req, res) => {
  const result = await studentService.resetGroup(req.user._id);
  res.json({ success: true, ...result });
});
