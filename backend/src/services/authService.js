import User from '../models/User.js';
import Mapping from '../models/Mapping.js';
import { AppError } from '../utils/asyncHandler.js';
import { generateToken } from '../utils/jwt.js';

export const loginAdmin = async ({ name, email, pin, password }) => {
  const admin = await User.findOne({ email, role: 'admin' });
  if (!admin) throw new AppError('Invalid admin credentials', 401);
  if (admin.name !== name) throw new AppError('Invalid admin credentials', 401);
  if (admin.pin !== pin) throw new AppError('Invalid security PIN', 401);

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid admin credentials', 401);

  const token = generateToken(admin._id, admin.role);
  return { user: admin, token };
};

export const loginStudent = async ({ regNo, rollNo, email, password }) => {
  const student = await User.findOne({ regNo, rollNo, email, role: 'student' });
  if (!student) throw new AppError('Invalid student credentials', 401);

  const isMatch = await student.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid student credentials', 401);

  const mapping = await Mapping.findOne({ year: student.year, branch: student.branch }).populate(
    'hostelId',
    'name capacity occupiedSeats'
  );

  if (mapping?.hostelId) {
    student.hostelId = mapping.hostelId._id;
    await student.save();
  }

  const token = generateToken(student._id, student.role);
  const populated = await User.findById(student._id)
    .populate('hostelId', 'name capacity occupiedSeats')
    .populate('roomId', 'roomNumber capacity')
    .populate('groupId');

  return { user: populated, token, mapping };
};

export const loginWarden = async ({ email, password }) => {
  const warden = await User.findOne({ email, role: 'warden' });
  if (!warden) throw new AppError('Invalid warden credentials', 401);

  const isMatch = await warden.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid warden credentials', 401);

  const token = generateToken(warden._id, warden.role);
  return { user: warden, token };
};

export const getMe = async (userId) => {
  return User.findById(userId)
    .populate('hostelId', 'name capacity occupiedSeats')
    .populate('roomId', 'roomNumber capacity')
    .populate('groupId', 'status documentsSubmitted size roomId');
};

export const updateAdminProfile = async (userId, { name, email, currentPassword, newPassword }) => {
  const admin = await User.findById(userId);
  if (!admin || admin.role !== 'admin') throw new AppError('Admin not found', 404);

  if (email && email.toLowerCase() !== admin.email) {
    const duplicate = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
    if (duplicate) throw new AppError('Email already exists', 400);
    admin.email = email;
  }

  if (name) admin.name = name;

  if (newPassword) {
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);
    admin.password = newPassword;
  }

  await admin.save();
  return admin;
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user || !['student', 'warden'].includes(user.role)) {
    throw new AppError('Not authorized to change password', 403);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);

  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from current password', 400);
  }

  user.password = newPassword;
  user.isFirstLogin = false;
  await user.save();

  const populated = await User.findById(userId)
    .populate('hostelId', 'name capacity occupiedSeats')
    .populate('roomId', 'roomNumber capacity')
    .populate('groupId', 'status documentsSubmitted size roomId');

  return populated || user;
};
