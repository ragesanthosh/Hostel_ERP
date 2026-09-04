import Notification from '../models/Notification.js';

export const createNotification = async ({ userId, type, title, message, relatedId }) => {
  return Notification.create({ userId, type, title, message, relatedId });
};

export const createBulkNotifications = async (notifications) => {
  return Notification.insertMany(notifications);
};
