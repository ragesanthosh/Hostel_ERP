import Hostel from '../models/Hostel.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Mapping from '../models/Mapping.js';
import AcademicStructure from '../models/AcademicStructure.js';
import { AppError } from '../utils/asyncHandler.js';
import * as hostelRoomService from './hostelRoomService.js';
import * as academicStructureService from './academicStructureService.js';

export const getDashboardStats = async () => {
  const hostels = await Hostel.find().populate('wardenId', 'name email employeeId');
  const totalCapacity = hostels.reduce((sum, h) => sum + h.capacity, 0);
  const totalOccupied = hostels.reduce((sum, h) => sum + h.occupiedSeats, 0);
  const assignedWardens = hostels.filter((h) => h.wardenId).length;
  const totalStudents = await User.countDocuments({ role: 'student' });
  const totalWardens = await User.countDocuments({ role: 'warden' });
  const totalRooms = await Room.countDocuments();

  return {
    totalHostels: hostels.length,
    totalCapacity,
    totalOccupied,
    totalRemaining: totalCapacity - totalOccupied,
    assignedWardens,
    totalStudents,
    totalWardens,
    totalRooms,
    hostels,
  };
};

export const createHostel = (data) => hostelRoomService.createHostel(data);
export const updateHostel = (id, data) => hostelRoomService.updateHostel(id, data);
export const deleteHostel = (id) => hostelRoomService.deleteHostel(id);

export const getHostelById = async (id) => {
  const hostel = await Hostel.findById(id).populate('wardenId', 'name email employeeId mobile pin');
  if (!hostel) throw new AppError('Hostel not found', 404);
  const roomCount = await Room.countDocuments({ hostelId: id });
  const totalRoomCapacity = await Room.aggregate([
    { $match: { hostelId: hostel._id, status: 'Active' } },
    { $group: { _id: null, total: { $sum: '$capacity' } } },
  ]);
  return {
    ...hostel.toObject(),
    roomCount,
    calculatedCapacity: totalRoomCapacity[0]?.total || 0,
  };
};

export const assignWarden = async (hostelId, wardenData) => {
  const { assignWardenToHostel, createWarden } = await import('./wardenManagementService.js');

  if (wardenData.wardenId) {
    return assignWardenToHostel(hostelId, wardenData.wardenId);
  }

  const warden = await createWarden(wardenData);
  return assignWardenToHostel(hostelId, warden._id);
};

export const createBranchYearMapping = async (hostelId, year, branches) => {
  const { configured } = await academicStructureService.getStatus();
  if (!configured) {
    throw new AppError('Configure the academic structure before hostel branch-year mapping', 400);
  }

  const hostel = await Hostel.findById(hostelId);
  if (!hostel) throw new AppError('Hostel not found', 404);
  if (!hostel.wardenId) {
    throw new AppError('Assign a warden to this hostel before branch-year allocation', 400);
  }

  const studentCount = await User.countDocuments({ role: 'student' });
  if (studentCount === 0) {
    throw new AppError('Add students to the master database before hostel allocation', 400);
  }

  const mappings = [];
  let totalStrength = 0;
  const academicRecords = [];

  for (const branch of branches) {
    const existing = await Mapping.findOne({ year, branch });
    if (existing) {
      throw new AppError(`Mapping already exists for ${year} - ${branch}`, 400);
    }

    const academicRecord = await AcademicStructure.findOne({ year, branch: branch.toUpperCase() });
    if (!academicRecord) {
      throw new AppError(`No academic structure entry for ${year} - ${branch}`, 400);
    }

    academicRecords.push(academicRecord);
    totalStrength += academicRecord.studentStrength;
  }

  const existingMappings = await Mapping.find({ hostelId });
  const alreadyAllocated = existingMappings.reduce((sum, m) => sum + m.studentStrength, 0);
  const remainingCapacity = hostel.capacity - alreadyAllocated;

  if (totalStrength > remainingCapacity) {
    throw new AppError(
      `Total branch strength (${totalStrength}) exceeds remaining hostel capacity (${remainingCapacity} of ${hostel.capacity})`,
      400
    );
  }

  for (const academicRecord of academicRecords) {
    const mapping = await Mapping.create({
      year,
      branch: academicRecord.branch,
      hostelId,
      studentStrength: academicRecord.studentStrength,
    });
    await syncStudentHostels(mapping.year, mapping.branch, hostelId);
    mappings.push(mapping);
  }

  return mappings;
};

const syncStudentHostels = async (year, branch, hostelId) => {
  await User.updateMany(
    { role: 'student', year, branch, isRoomAllocated: false },
    { $set: { hostelId: hostelId || null } }
  );
};

const assertHostelFitsMapping = async (hostelId, strength, excludeMappingId = null) => {
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) throw new AppError('Hostel not found', 404);
  if (!hostel.wardenId) {
    throw new AppError('Assign a warden to the target hostel before mapping', 400);
  }

  const allocated = (await Mapping.find({ hostelId }))
    .filter((m) => String(m._id) !== String(excludeMappingId))
    .reduce((sum, m) => sum + m.studentStrength, 0);

  const remaining = hostel.capacity - allocated;
  if (strength > remaining) {
    throw new AppError(
      `Branch strength (${strength}) exceeds remaining hostel capacity (${remaining} of ${hostel.capacity})`,
      400
    );
  }
  return hostel;
};

export const updateMapping = async (id, { hostelId }) => {
  const mapping = await Mapping.findById(id);
  if (!mapping) throw new AppError('Mapping not found', 404);

  const academicRecord = await AcademicStructure.findOne({
    year: mapping.year,
    branch: mapping.branch,
  });
  const strength = academicRecord?.studentStrength ?? mapping.studentStrength;

  await assertHostelFitsMapping(hostelId, strength, id);

  mapping.hostelId = hostelId;
  mapping.studentStrength = strength;
  await mapping.save();

  await syncStudentHostels(mapping.year, mapping.branch, hostelId);

  return Mapping.findById(id).populate('hostelId', 'name capacity code');
};

export const deleteMapping = async (id) => {
  const mapping = await Mapping.findById(id);
  if (!mapping) throw new AppError('Mapping not found', 404);

  const allocatedStudents = await User.countDocuments({
    role: 'student',
    year: mapping.year,
    branch: mapping.branch,
    isRoomAllocated: true,
  });
  if (allocatedStudents > 0) {
    throw new AppError(
      'Cannot delete — students from this branch-year already have room allocations',
      400
    );
  }

  const { year, branch } = mapping;
  await mapping.deleteOne();
  await syncStudentHostels(year, branch, null);

  return { message: 'Mapping deleted' };
};

export const getMappingsByHostel = async (hostelId) => {
  return Mapping.find({ hostelId }).sort({ year: 1, branch: 1 });
};

export const getAllMappings = async () => {
  return Mapping.find()
    .populate('hostelId', 'name capacity code')
    .sort({ year: 1, branch: 1 });
};

export const getBranchStrengths = async (year) => {
  if (year) {
    const records = await AcademicStructure.find({ year }).sort({ branch: 1 });
    return records.map((r) => ({ branch: r.branch, strength: r.studentStrength, _id: r._id }));
  }
  const records = await AcademicStructure.find().sort({ year: 1, branch: 1 });
  return records.map((r) => ({
    branch: r.branch,
    strength: r.studentStrength,
    year: r.year,
    _id: r._id,
  }));
};

export const getAllocationOverview = async () => {
  const hostels = await Hostel.find().populate('wardenId', 'name email');
  const mappings = await Mapping.find().populate('hostelId', 'name');
  const rooms = await Room.find();
  const students = await User.find({ role: 'student', isRoomAllocated: true });

  return { hostels, mappings, totalRooms: rooms.length, allocatedStudents: students.length };
};
