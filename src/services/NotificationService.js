import axios from "@utils/axios";

const PREFIX = ""; // base already /api from axios baseURL

/**
 * Fetch notifications for current authenticated user
 * @param {number} limit
 * @returns {Promise<Array>} notifications
 */
export async function getNotifications(limit = 20) {
  const { data } = await axios.get(`/notifications`, { params: { limit } });
  return data;
}

/**
 * Get unread notifications count
 * @returns {Promise<number>}
 */
export async function getUnreadCount() {
  const { data } = await axios.get(`/notifications/unread-count`);
  return data.unread_count ?? 0;
}

/**
 * Mark a single notification as read
 * @param {number|string} id
 */
export async function markNotificationRead(id) {
  await axios.post(`/notifications/${id}/read`);
}

/**
 * Mark all unread notifications as read
 */
export async function markAllNotificationsRead() {
  await axios.post(`/notifications/mark-all-read`);
}

export default {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};
