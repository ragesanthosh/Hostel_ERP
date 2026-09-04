import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../utils/asyncHandler.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized, no token', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('hostelId', 'name capacity')
      .populate('roomId', 'roomNumber capacity');

    if (!user) {
      return next(new AppError('User not found', 401));
    }

    req.user = user;
    next();
  } catch {
    return next(new AppError('Not authorized, token failed', 401));
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Role '${req.user.role}' is not authorized`, 403));
    }
    next();
  };
};

export const wardenHostelAccess = async (req, res, next) => {
  if (req.user.role !== 'warden') {
    return next(new AppError('Only wardens can access this resource', 403));
  }

  const Hostel = (await import('../models/Hostel.js')).default;
  const hostel = await Hostel.findOne({ wardenId: req.user._id });

  if (!hostel) {
    return next(new AppError('No hostel assigned to this warden', 403));
  }

  req.wardenHostel = hostel;
  next();
};
