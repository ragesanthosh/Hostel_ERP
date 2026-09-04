import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/authService.js';

export const loginAdmin = asyncHandler(async (req, res) => {
  const result = await authService.loginAdmin(req.body);
  res.json({ success: true, ...result });
});

export const loginStudent = asyncHandler(async (req, res) => {
  const result = await authService.loginStudent(req.body);
  res.json({ success: true, ...result });
});

export const loginWarden = asyncHandler(async (req, res) => {
  const result = await authService.loginWarden(req.body);
  res.json({ success: true, ...result });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  res.json({ success: true, user });
});

export const updateAdminProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateAdminProfile(req.user._id, req.body);
  res.json({ success: true, user, message: 'Profile updated successfully' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await authService.changePassword(req.user._id, req.body);
  res.json({ success: true, user, message: 'Password changed successfully' });
});
