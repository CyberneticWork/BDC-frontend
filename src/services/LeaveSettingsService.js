import axios from "@utils/axios";

// Available leave types
export const LEAVE_TYPES = [
  { type: "annual", name: "Annual Leave" },
  { type: "casual", name: "Casual Leave" },
  { type: "sick", name: "Sick Leave" },
  { type: "maternity", name: "Maternity Leave" },
  { type: "paternity", name: "Paternity Leave" },
  { type: "bereavement", name: "Bereavement Leave" },
  { type: "unpaid", name: "Unpaid Leave" },
  { type: "other", name: "Other Leave" },
];

// Month names for quarter selection
export const MONTHS = [
  { value: 1, name: "January", short: "Jan" },
  { value: 2, name: "February", short: "Feb" },
  { value: 3, name: "March", short: "Mar" },
  { value: 4, name: "April", short: "Apr" },
  { value: 5, name: "May", short: "May" },
  { value: 6, name: "June", short: "Jun" },
  { value: 7, name: "July", short: "Jul" },
  { value: 8, name: "August", short: "Aug" },
  { value: 9, name: "September", short: "Sep" },
  { value: 10, name: "October", short: "Oct" },
  { value: 11, name: "November", short: "Nov" },
  { value: 12, name: "December", short: "Dec" },
];

// Helper to get month name from value
export const getMonthName = (monthValue) => {
  const month = MONTHS.find((m) => m.value === monthValue);
  return month ? month.name : "";
};

// Helper to get month range string
export const getMonthRangeString = (startMonth, endMonth) => {
  const start = MONTHS.find((m) => m.value === startMonth);
  const end = MONTHS.find((m) => m.value === endMonth);
  if (start && end) {
    return `${start.short} - ${end.short}`;
  }
  return "";
};

// Calculate total leave days for a quarter
export const calculateQuarterTotalDays = (quarter) => {
  const leaveTypes = quarter.leave_types || [];
  if (!Array.isArray(leaveTypes)) return 0;
  return leaveTypes.reduce((sum, lt) => sum + (lt.days || 0), 0);
};

// Calculate total leave days for all quarters
export const calculateTotalLeaveDays = (quarters) => {
  if (!quarters || !Array.isArray(quarters)) return 0;
  return quarters.reduce((sum, q) => sum + calculateQuarterTotalDays(q), 0);
};

// Normalize backend response to frontend format
export const normalizeSettingFromBackend = (setting) => {
  if (!setting) return setting;

  return {
    ...setting,
    quarters: (setting.quarters || []).map((q) => ({
      id: q.id,
      quarter_number: q.quarter_number,
      name: q.name,
      start_month: q.start_month,
      end_month: q.end_month,
      leave_days: q.leave_days,
      leave_types: (q.leave_types || []).map((lt) => ({
        id: lt.id,
        type: lt.type_key ?? lt.type,
        name: lt.name,
        days: lt.days,
      })),
    })),
  };
};

// Normalize frontend form data for backend
export const normalizeSettingForBackend = (formData) => {
  if (!formData) return formData;

  const payload = { ...formData };

  if (payload.quarters && Array.isArray(payload.quarters)) {
    payload.quarters = payload.quarters.map((q) => ({
      id: q.id || undefined,
      quarter_number: q.quarter_number,
      name: q.name,
      start_month: q.start_month,
      end_month: q.end_month,
      leave_days: q.leave_days,
      leave_types: (q.leave_types || []).map((lt) => ({
        id: lt.id || undefined,
        type: lt.type,
        name: lt.name,
        days: lt.days,
      })),
    }));
  }

  return payload;
};

// Fetch all leave settings
export const getAllLeaveSettings = async () => {
  try {
    const response = await axios.get("/leave-settings");
    const data = response.data?.data || [];
    return {
      ...response.data,
      data: data.map(normalizeSettingFromBackend),
    };
  } catch (error) {
    console.error("Error fetching leave settings:", error);
    throw error;
  }
};

// Get leave settings by ID
export const getLeaveSettingsById = async (id) => {
  try {
    const response = await axios.get(`/leave-settings/${id}`);
    return {
      ...response.data,
      data: normalizeSettingFromBackend(response.data?.data),
    };
  } catch (error) {
    console.error("Error fetching leave settings:", error);
    throw error;
  }
};

// Get leave settings by employee type
export const getLeaveSettingsByType = async (employeeType) => {
  try {
    const response = await axios.get(`/leave-settings/type/${employeeType}`);
    return {
      ...response.data,
      data: normalizeSettingFromBackend(response.data?.data),
    };
  } catch (error) {
    console.error("Error fetching leave settings by type:", error);
    throw error;
  }
};

// Create new leave settings
export const createLeaveSettings = async (data) => {
  try {
    const payload = normalizeSettingForBackend(data);
    const response = await axios.post("/leave-settings", payload);
    return {
      ...response.data,
      data: normalizeSettingFromBackend(response.data?.data),
    };
  } catch (error) {
    console.error("Error creating leave settings:", error);
    throw error;
  }
};

// Update leave settings
export const updateLeaveSettings = async (id, data) => {
  try {
    const payload = normalizeSettingForBackend(data);
    const response = await axios.put(`/leave-settings/${id}`, payload);
    return {
      ...response.data,
      data: normalizeSettingFromBackend(response.data?.data),
    };
  } catch (error) {
    console.error("Error updating leave settings:", error);
    throw error;
  }
};

// Delete leave settings
export const deleteLeaveSettings = async (id) => {
  try {
    const response = await axios.delete(`/leave-settings/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting leave settings:", error);
    throw error;
  }
};

// Get active leave settings summary
export const getActiveLeaveSettings = async () => {
  try {
    const response = await axios.get("/leave-settings/active/summary");
    return response.data;
  } catch (error) {
    console.error("Error fetching active leave settings:", error);
    throw error;
  }
};

export default {
  LEAVE_TYPES,
  MONTHS,
  getMonthName,
  getMonthRangeString,
  calculateQuarterTotalDays,
  calculateTotalLeaveDays,
  normalizeSettingFromBackend,
  normalizeSettingForBackend,
  getAllLeaveSettings,
  getLeaveSettingsById,
  getLeaveSettingsByType,
  createLeaveSettings,
  updateLeaveSettings,
  deleteLeaveSettings,
  getActiveLeaveSettings,
};
