import Hostel from '../models/Hostel.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Document from '../models/Document.js';
import Group from '../models/Group.js';
import Mapping from '../models/Mapping.js';
import { AppError } from '../utils/asyncHandler.js';
import { createNotification } from '../utils/notifications.js';

const buildHostelStudentQuery = async (hostelId) => {
  const [mappings, rooms] = await Promise.all([
    Mapping.find({ hostelId }).select('year branch').lean(),
    Room.find({ hostelId }).select('students').lean(),
  ]);

  const orConditions = [{ hostelId }];
  for (const { year, branch } of mappings) {
    orConditions.push({ year, branch });
  }

  const roomStudentIds = [
    ...new Set(rooms.flatMap((room) => (room.students || []).map(String))),
  ].filter(Boolean);

  if (roomStudentIds.length) {
    orConditions.push({ _id: { $in: roomStudentIds } });
  }

  return { role: 'student', $or: orConditions };
};
export const getWardenDashboard = async (hostel) => {
  const rooms = await Room.find({ hostelId: hostel._id });
  const totalRooms = rooms.length;
  const occupiedSeats = rooms.reduce((sum, r) => sum + r.students.length, 0);
  const vacantSeats = hostel.capacity - occupiedSeats;

  return {
    hostel,
    totalRooms,
    occupiedSeats,
    vacantSeats,
    capacity: hostel.capacity,
  };
};

export const studentBelongsToHostel = async (studentId, hostelId) => {
  const query = await buildHostelStudentQuery(hostelId);
  query._id = studentId;
  return User.exists(query);
};

export const getStudentsInHostel = async (hostelId) => {
  const query = await buildHostelStudentQuery(hostelId);

  return User.find(query)
    .populate('roomId', 'roomNumber capacity')
    .populate('groupId', 'size status')
    .select('name regNo rollNo branch year email roomId groupId isRoomAllocated documentsVerified hostelId')
    .sort({ branch: 1, year: 1, name: 1 });
};

export const getRoomStatus = async (hostelId) => {
  const rooms = await Room.find({ hostelId })
    .populate('students', 'name regNo rollNo branch year email')
    .sort('roomNumber');

  return rooms.map((room) => ({
    _id: room._id,
    roomNumber: room.roomNumber,
    capacity: room.capacity,
    occupiedSeats: room.students.length,
    vacantSeats: room.capacity - room.students.length,
    isLocked: room.isLocked,
    students: room.students,
  }));
};

export const getDocumentsForHostel = async (hostelId) => {
  const query = await buildHostelStudentQuery(hostelId);
  const students = await User.find(query).select('_id');
  const studentIds = students.map((s) => s._id);
  const groups = await Group.find({ hostelId, documentsSubmitted: true });
  const groupIds = groups.map((g) => g._id);

  return Document.find({ groupId: { $in: groupIds }, userId: { $in: studentIds } })
    .populate('userId', 'name regNo rollNo branch year email roomId')
    .populate('groupId', 'size status')
    .sort({ createdAt: -1 });
};

export const verifyDocument = async (documentId, wardenId, verified) => {
  const doc = await Document.findById(documentId).populate({
    path: 'userId',
    populate: { path: 'hostelId' },
  });
  if (!doc) throw new AppError('Document not found', 404);

  const hostel = await Hostel.findOne({ wardenId });
  if (!hostel) {
    throw new AppError('Not authorized to verify this document', 403);
  }

  const belongs = await studentBelongsToHostel(doc.userId._id, hostel._id);
  if (!belongs) {
    throw new AppError('Not authorized to verify this document', 403);
  }
  doc.verified = verified;
  doc.verifiedBy = wardenId;
  doc.verifiedAt = new Date();
  await doc.save();

  if (verified) {
    const allDocs = await Document.find({ userId: doc.userId._id, groupId: doc.groupId });
    const allVerified = allDocs.every((d) => d.verified);
    if (allVerified) {
      await User.findByIdAndUpdate(doc.userId._id, { documentsVerified: true });
      await createNotification({
        userId: doc.userId._id,
        type: 'documents_verified',
        title: 'Documents Verified',
        message: 'All your documents have been verified by the warden',
        relatedId: doc._id,
      });
    }
  }

  return doc;
};

export const getStudentDocuments = async (studentId, wardenHostelId) => {
  const belongs = await studentBelongsToHostel(studentId, wardenHostelId);
  if (!belongs) {
    throw new AppError('Student not found in your hostel', 404);
  }

  return Document.find({ userId: studentId }).populate('groupId', 'size status');
};