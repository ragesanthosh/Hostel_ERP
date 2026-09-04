import Hostel from '../models/Hostel.js';
import Room from '../models/Room.js';
import Mapping from '../models/Mapping.js';
import { AppError } from '../utils/asyncHandler.js';

const GENDERS = ['Boys', 'Girls', 'Mixed'];
const HOSTEL_STATUSES = ['Active', 'Inactive'];
const ROOM_STATUSES = ['Active', 'Inactive', 'Under Maintenance'];

const emptyReport = () => ({
  totalProcessed: 0,
  successCount: 0,
  failedCount: 0,
  successful: [],
  failed: [],
});

export const recalculateHostelCapacity = async (hostelId) => {
  const rooms = await Room.find({ hostelId, status: 'Active' });
  const capacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  await Hostel.findByIdAndUpdate(hostelId, { capacity });
  return capacity;
};

export const getHostels = async ({ search, status } = {}) => {
  const query = {};
  if (status) query.status = status;
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ name: regex }, { code: regex }];
  }
  return Hostel.find(query).populate('wardenId', 'name email employeeId').sort({ name: 1 });
};

export const createHostel = async (data) => {
  validateHostelData(data);

  const dup = await Hostel.findOne({ $or: [{ name: data.name }, { code: data.code.toUpperCase() }] });
  if (dup) {
    if (dup.name === data.name) throw new AppError('Hostel name already exists', 400);
    throw new AppError('Hostel code already exists', 400);
  }

  return Hostel.create({
    name: data.name.trim(),
    code: data.code.trim().toUpperCase(),
    capacity: Number(data.capacity) || 0,
    floors: data.floors ? Number(data.floors) : undefined,
    gender: data.gender || 'Mixed',
    status: data.status || 'Active',
    occupiedSeats: 0,
  });
};

export const updateHostel = async (id, data) => {
  const hostel = await Hostel.findById(id);
  if (!hostel) throw new AppError('Hostel not found', 404);

  if (data.name && data.name !== hostel.name) {
    const dup = await Hostel.findOne({ name: data.name, _id: { $ne: id } });
    if (dup) throw new AppError('Hostel name already exists', 400);
    hostel.name = data.name.trim();
  }
  if (data.code && data.code.toUpperCase() !== hostel.code) {
    const dup = await Hostel.findOne({ code: data.code.toUpperCase(), _id: { $ne: id } });
    if (dup) throw new AppError('Hostel code already exists', 400);
    hostel.code = data.code.trim().toUpperCase();
  }
  if (data.capacity !== undefined) {
    const cap = Number(data.capacity);
    if (cap < hostel.occupiedSeats) throw new AppError('Capacity cannot be less than occupied seats', 400);
    hostel.capacity = cap;
  }
  if (data.floors !== undefined) hostel.floors = data.floors ? Number(data.floors) : undefined;
  if (data.gender) hostel.gender = data.gender;
  if (data.status) hostel.status = data.status;

  await hostel.save();
  return hostel.populate('wardenId', 'name email employeeId');
};

export const deleteHostel = async (id) => {
  const hostel = await Hostel.findById(id);
  if (!hostel) throw new AppError('Hostel not found', 404);
  if (hostel.occupiedSeats > 0) throw new AppError('Cannot delete hostel with occupied seats', 400);

  await Mapping.deleteMany({ hostelId: id });
  await Room.deleteMany({ hostelId: id });
  await hostel.deleteOne();
  return { message: 'Hostel deleted successfully' };
};

export const importHostels = async (rows) => {
  const report = emptyReport();
  report.totalProcessed = rows.length;
  const seenNames = new Set();
  const seenCodes = new Set();

  for (const row of rows) {
    try {
      if (!row.name) throw new Error('Hostel Name is required');
      if (!row.code) throw new Error('Hostel Code is required');
      if (!row.capacity && row.capacity !== 0) throw new Error('Total Capacity is required');

      const capacity = Number(row.capacity);
      if (isNaN(capacity) || capacity < 0) throw new Error('Invalid Total Capacity');

      const code = row.code.toUpperCase();
      if (seenNames.has(row.name.toLowerCase())) throw new Error('Duplicate hostel name in file');
      if (seenCodes.has(code)) throw new Error('Duplicate hostel code in file');
      seenNames.add(row.name.toLowerCase());
      seenCodes.add(code);

      const gender = normalizeGender(row.gender);
      const status = normalizeHostelStatus(row.status);

      const existing = await Hostel.findOne({ $or: [{ name: row.name }, { code }] });
      if (existing) {
        if (existing.name === row.name) throw new Error('Hostel name already exists in database');
        throw new Error('Hostel code already exists in database');
      }

      const hostel = await Hostel.create({
        name: row.name.trim(),
        code,
        capacity,
        floors: row.floors ? Number(row.floors) : undefined,
        gender,
        status,
        occupiedSeats: 0,
      });

      report.successful.push({ row: row.rowNumber, name: hostel.name, code: hostel.code });
      report.successCount++;
    } catch (err) {
      report.failed.push({ row: row.rowNumber, record: row, reason: err.message });
      report.failedCount++;
    }
  }

  return report;
};

export const getRoomsByHostel = async (hostelId, { search, status } = {}) => {
  const query = { hostelId };
  if (status) query.status = status;
  if (search) query.roomNumber = new RegExp(search, 'i');

  return Room.find(query)
    .populate('students', 'name regNo rollNo')
    .sort({ floorNumber: 1, roomNumber: 1 });
};

export const createRoom = async (hostelId, data) => {
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) throw new AppError('Hostel not found', 404);
  validateRoomData(data);

  const existing = await Room.findOne({ hostelId, roomNumber: data.roomNumber.trim() });
  if (existing) throw new AppError('Room number already exists in this hostel', 400);

  const room = await Room.create({
    hostelId,
    roomNumber: data.roomNumber.trim(),
    floorNumber: data.floorNumber ? Number(data.floorNumber) : undefined,
    capacity: Number(data.capacity),
    status: data.status || 'Active',
    students: [],
  });

  await recalculateHostelCapacity(hostelId);
  return room;
};

export const updateRoom = async (roomId, data) => {
  const room = await Room.findById(roomId);
  if (!room) throw new AppError('Room not found', 404);

  if (data.roomNumber && data.roomNumber !== room.roomNumber) {
    const dup = await Room.findOne({ hostelId: room.hostelId, roomNumber: data.roomNumber.trim(), _id: { $ne: roomId } });
    if (dup) throw new AppError('Room number already exists in this hostel', 400);
    room.roomNumber = data.roomNumber.trim();
  }
  if (data.capacity !== undefined) {
    const cap = Number(data.capacity);
    if (cap < room.students.length) throw new AppError('Capacity cannot be less than occupied seats', 400);
    room.capacity = cap;
  }
  if (data.floorNumber !== undefined) room.floorNumber = data.floorNumber ? Number(data.floorNumber) : undefined;
  if (data.status) room.status = data.status;

  await room.save();
  await recalculateHostelCapacity(room.hostelId);
  return room;
};

export const deleteRoom = async (roomId) => {
  const room = await Room.findById(roomId);
  if (!room) throw new AppError('Room not found', 404);
  if (room.students.length > 0) throw new AppError('Cannot delete room with assigned students', 400);
  if (room.isLocked) throw new AppError('Cannot delete a locked room', 400);

  const hostelId = room.hostelId;
  await room.deleteOne();
  await recalculateHostelCapacity(hostelId);
  return { message: 'Room deleted successfully' };
};

export const importRooms = async (rows, defaultHostelId = null) => {
  const report = emptyReport();
  report.totalProcessed = rows.length;
  const seenInFile = new Map();

  for (const row of rows) {
    try {
      if (!row.roomNumber) throw new Error('Room Number is required');
      if (!row.capacity) throw new Error('Room Capacity is required');
      if (!row.hostelCode && !row.hostelName && !defaultHostelId) {
        throw new Error('Hostel Code or Hostel Name is required');
      }

      const capacity = Number(row.capacity);
      if (isNaN(capacity) || capacity < 1) throw new Error('Invalid Room Capacity');

      const status = normalizeRoomStatus(row.status);
      let hostel;

      if (defaultHostelId) {
        hostel = await Hostel.findById(defaultHostelId);
      } else if (row.hostelCode) {
        hostel = await Hostel.findOne({ code: row.hostelCode.toUpperCase() });
      } else {
        hostel = await Hostel.findOne({ name: new RegExp(`^${row.hostelName.trim()}$`, 'i') });
      }

      if (!hostel) throw new Error('Hostel not found — check Hostel Code or Hostel Name');

      const roomKey = `${hostel._id}:${row.roomNumber.trim()}`;
      if (seenInFile.has(roomKey)) throw new Error('Duplicate room number for same hostel in file');
      seenInFile.set(roomKey, true);

      const existing = await Room.findOne({ hostelId: hostel._id, roomNumber: row.roomNumber.trim() });
      if (existing) throw new Error('Room number already exists in database for this hostel');

      const room = await Room.create({
        hostelId: hostel._id,
        roomNumber: row.roomNumber.trim(),
        floorNumber: row.floorNumber ? Number(row.floorNumber) : undefined,
        capacity,
        status,
        students: [],
      });

      await recalculateHostelCapacity(hostel._id);

      report.successful.push({
        row: row.rowNumber,
        roomNumber: room.roomNumber,
        hostel: hostel.name,
        capacity: room.capacity,
        vacantSeats: room.capacity,
      });
      report.successCount++;
    } catch (err) {
      report.failed.push({ row: row.rowNumber, record: row, reason: err.message });
      report.failedCount++;
    }
  }

  return report;
};

const validateHostelData = (data) => {
  if (!data.name?.trim()) throw new AppError('Hostel name is required', 400);
  if (!data.code?.trim()) throw new AppError('Hostel code is required', 400);
  if (data.capacity === undefined || data.capacity === '') throw new AppError('Capacity is required', 400);
  if (Number(data.capacity) < 0) throw new AppError('Invalid capacity', 400);
  if (data.gender && !GENDERS.includes(data.gender)) throw new AppError('Invalid gender', 400);
  if (data.status && !HOSTEL_STATUSES.includes(data.status)) throw new AppError('Invalid status', 400);
};

const validateRoomData = (data) => {
  if (!data.roomNumber?.trim()) throw new AppError('Room number is required', 400);
  if (!data.capacity || Number(data.capacity) < 1) throw new AppError('Invalid room capacity', 400);
  if (data.status && !ROOM_STATUSES.includes(data.status)) throw new AppError('Invalid room status', 400);
};

const normalizeGender = (val) => {
  const v = val?.trim()?.toLowerCase();
  if (['boys', 'boy', 'male'].includes(v)) return 'Boys';
  if (['girls', 'girl', 'female'].includes(v)) return 'Girls';
  if (['mixed', 'co-ed', 'coed'].includes(v)) return 'Mixed';
  if (GENDERS.includes(val)) return val;
  throw new Error(`Invalid gender: ${val}`);
};

const normalizeHostelStatus = (val) => {
  const v = val?.trim()?.toLowerCase();
  if (['active', 'a'].includes(v)) return 'Active';
  if (['inactive', 'i'].includes(v)) return 'Inactive';
  if (HOSTEL_STATUSES.includes(val)) return val;
  throw new Error(`Invalid status: ${val}`);
};

const normalizeRoomStatus = (val) => {
  const v = val?.trim()?.toLowerCase();
  if (['active', 'a'].includes(v)) return 'Active';
  if (['inactive', 'i'].includes(v)) return 'Inactive';
  if (['under maintenance', 'maintenance', 'maint'].includes(v)) return 'Under Maintenance';
  if (ROOM_STATUSES.includes(val)) return val;
  throw new Error(`Invalid room status: ${val}`);
};
