import User from '../models/User.js';
import Hostel from '../models/Hostel.js';
import { AppError } from '../utils/asyncHandler.js';

const wardenSelect = '-password';

export const getWardens = async ({ search, assigned }) => {
  const query = { role: 'warden' };

  if (assigned === 'true') query.hostelId = { $ne: null };
  if (assigned === 'false') query.hostelId = null;

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ name: regex }, { email: regex }, { employeeId: regex }, { mobile: regex }];
  }

  return User.find(query)
    .select(wardenSelect)
    .populate('hostelId', 'name')
    .sort({ name: 1 });
};

export const getAvailableWardens = async () => {
  return User.find({ role: 'warden', hostelId: null })
    .select(wardenSelect)
    .sort({ name: 1 });
};

export const createWarden = async (data) => {
  await validateWardenFields(data);

  const existing = await User.findOne({
    $or: [{ email: data.email }, { employeeId: data.employeeId }],
  });
  if (existing) {
    if (existing.email === data.email.toLowerCase()) throw new AppError('Email already exists', 400);
    if (existing.employeeId === data.employeeId) throw new AppError('Employee ID already exists', 400);
  }

  return User.create({
    name: data.name,
    employeeId: data.employeeId,
    email: data.email,
    mobile: data.mobile,
    pin: data.pin,
    password: data.password,
    role: 'warden',
  });
};

export const updateWarden = async (id, data) => {
  const warden = await User.findOne({ _id: id, role: 'warden' });
  if (!warden) throw new AppError('Warden not found', 404);

  if (data.email && data.email.toLowerCase() !== warden.email) {
    const dup = await User.findOne({ email: data.email, _id: { $ne: id } });
    if (dup) throw new AppError('Email already exists', 400);
    warden.email = data.email;
  }
  if (data.employeeId && data.employeeId !== warden.employeeId) {
    const dup = await User.findOne({ employeeId: data.employeeId, _id: { $ne: id } });
    if (dup) throw new AppError('Employee ID already exists', 400);
    warden.employeeId = data.employeeId;
  }

  if (data.name) warden.name = data.name;
  if (data.mobile) warden.mobile = data.mobile;
  if (data.pin) warden.pin = data.pin;
  if (data.password) {
    warden.password = data.password;
    warden.isFirstLogin = true;
  }

  await warden.save();
  return User.findById(id).select(wardenSelect).populate('hostelId', 'name');
};

export const deleteWarden = async (id) => {
  const warden = await User.findOne({ _id: id, role: 'warden' });
  if (!warden) throw new AppError('Warden not found', 404);
  if (warden.hostelId) {
    throw new AppError('Cannot delete warden assigned to a hostel. Unassign first.', 400);
  }
  await warden.deleteOne();
  return { message: 'Warden deleted successfully' };
};

export const assignWardenToHostel = async (hostelId, wardenId) => {
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) throw new AppError('Hostel not found', 404);

  const warden = await User.findOne({ _id: wardenId, role: 'warden' });
  if (!warden) throw new AppError('Warden not found', 404);

  if (warden.hostelId && warden.hostelId.toString() !== hostelId.toString()) {
    throw new AppError('Warden is already assigned to another hostel', 400);
  }

  if (hostel.wardenId && hostel.wardenId.toString() !== wardenId.toString()) {
    const oldWarden = await User.findById(hostel.wardenId);
    if (oldWarden) {
      oldWarden.hostelId = undefined;
      await oldWarden.save();
    }
  }

  warden.hostelId = hostelId;
  await warden.save();

  hostel.wardenId = warden._id;
  await hostel.save();

  return {
    hostel: await Hostel.findById(hostelId).populate('wardenId', 'name email employeeId mobile'),
    warden: await User.findById(wardenId).select(wardenSelect).populate('hostelId', 'name'),
  };
};

export const unassignWardenFromHostel = async (hostelId) => {
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) throw new AppError('Hostel not found', 404);
  if (!hostel.wardenId) throw new AppError('No warden assigned to this hostel', 400);

  const warden = await User.findById(hostel.wardenId);
  if (warden) {
    warden.hostelId = undefined;
    await warden.save();
  }

  hostel.wardenId = undefined;
  await hostel.save();

  return { message: 'Warden unassigned successfully' };
};

const validateWardenFields = (data) => {
  if (!data.name?.trim()) throw new AppError('Full name is required', 400);
  if (!data.employeeId?.trim()) throw new AppError('Employee ID is required', 400);
  if (!data.email?.trim()) throw new AppError('College email is required', 400);
  if (!data.mobile?.trim()) throw new AppError('Mobile number is required', 400);
  if (!data.pin?.trim()) throw new AppError('Security PIN is required', 400);
  if (!data.password || data.password.length < 6) throw new AppError('Password must be at least 6 characters', 400);
};
