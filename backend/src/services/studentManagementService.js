import User from '../models/User.js';
import Mapping from '../models/Mapping.js';
import { AppError } from '../utils/asyncHandler.js';
import { BRANCHES, YEARS, GENDERS } from '../utils/constants.js';

const studentSelect = '-password -pin';

export const getStudents = async ({ search, branch, year, page = 1, limit = 20 }) => {
  const query = { role: 'student' };

  if (branch) query.branch = branch;
  if (year) query.year = year;

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { name: regex },
      { regNo: regex },
      { rollNo: regex },
      { email: regex },
    ];
  }

  const skip = (page - 1) * limit;
  const [students, total] = await Promise.all([
    User.find(query)
      .select(studentSelect)
      .populate('hostelId', 'name')
      .populate('roomId', 'roomNumber')
      .sort({ regNo: 1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return { students, total, page, pages: Math.ceil(total / limit) };
};

export const createStudent = async (data) => {
  await validateStudentFields(data);

  const existing = await User.findOne({
    $or: [{ email: data.email }, { regNo: data.regNo }, { rollNo: data.rollNo }],
  });
  if (existing) {
    if (existing.email === data.email.toLowerCase()) throw new AppError('Email already exists', 400);
    if (existing.regNo === data.regNo) throw new AppError('Registration number already exists', 400);
    if (existing.rollNo === data.rollNo) throw new AppError('Roll number already exists', 400);
  }

  const mapping = await Mapping.findOne({ year: data.year, branch: data.branch });

  return User.create({
    name: data.name,
    regNo: data.regNo,
    rollNo: data.rollNo,
    email: data.email,
    branch: data.branch,
    year: data.year,
    gender: data.gender,
    password: data.password || 'student123',
    role: 'student',
    hostelId: mapping?.hostelId,
  });
};

export const updateStudent = async (id, data) => {
  const student = await User.findOne({ _id: id, role: 'student' });
  if (!student) throw new AppError('Student not found', 404);

  if (data.email && data.email.toLowerCase() !== student.email) {
    const dup = await User.findOne({ email: data.email, _id: { $ne: id } });
    if (dup) throw new AppError('Email already exists', 400);
    student.email = data.email;
  }
  if (data.regNo && data.regNo !== student.regNo) {
    const dup = await User.findOne({ regNo: data.regNo, _id: { $ne: id } });
    if (dup) throw new AppError('Registration number already exists', 400);
    student.regNo = data.regNo;
  }
  if (data.rollNo && data.rollNo !== student.rollNo) {
    const dup = await User.findOne({ rollNo: data.rollNo, _id: { $ne: id } });
    if (dup) throw new AppError('Roll number already exists', 400);
    student.rollNo = data.rollNo;
  }

  if (data.name) student.name = data.name;
  if (data.branch) student.branch = data.branch;
  if (data.gender) student.gender = data.gender;
  if (data.password) {
    student.password = data.password;
    student.isFirstLogin = true;
  }

  const yearOrBranchChanged =
    (data.year && data.year !== student.year) || (data.branch && data.branch !== student.branch);

  if (data.year) student.year = data.year;
  if (data.branch) student.branch = data.branch;

  if (yearOrBranchChanged && !student.isRoomAllocated) {
    const mapping = await Mapping.findOne({ year: student.year, branch: student.branch });
    student.hostelId = mapping?.hostelId || undefined;
  }

  await student.save();
  return User.findById(id).select(studentSelect).populate('hostelId', 'name');
};

export const deleteStudent = async (id) => {
  const student = await User.findOne({ _id: id, role: 'student' });
  if (!student) throw new AppError('Student not found', 404);
  if (student.groupId || student.isRoomAllocated) {
    throw new AppError('Cannot delete student with active group or room allocation', 400);
  }
  await student.deleteOne();
  return { message: 'Student deleted successfully' };
};

export const importStudents = async (rows) => {
  const results = { created: 0, failed: [] };

  for (let i = 0; i < rows.length; i++) {
    try {
      await createStudent(rows[i]);
      results.created++;
    } catch (err) {
      results.failed.push({ row: i + 2, regNo: rows[i].regNo, error: err.message });
    }
  }

  return results;
};

const validateStudentFields = (data) => {
  if (!data.name?.trim()) throw new AppError('Full name is required', 400);
  if (!data.regNo?.trim()) throw new AppError('Registration number is required', 400);
  if (!data.rollNo?.trim()) throw new AppError('Roll number is required', 400);
  if (!data.email?.trim()) throw new AppError('College email is required', 400);
  if (!BRANCHES.includes(data.branch)) throw new AppError(`Invalid branch: ${data.branch}`, 400);
  if (!YEARS.includes(data.year)) throw new AppError(`Invalid academic year: ${data.year}`, 400);
  if (!GENDERS.includes(data.gender)) throw new AppError(`Invalid gender: ${data.gender}`, 400);
};
