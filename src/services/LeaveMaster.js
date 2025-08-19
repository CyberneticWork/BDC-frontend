import axios from "@utils/axios";

//fetch data from leave-master
export const getAllLeaves = async () => {
  try {
    const response = await axios.get(`/leave-masters`);
    return response.data;
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return [];
  }
};

// save the leave master
export const createLeave = async (data) => {
  try {
    const response = await axios.post(`/leave-masters`, data);
    return response.data;
  } catch (error) {
    console.error("Error creating leave:", error);
    throw error;
  }
};

// Create leave request with force_continue flag
export const createLeaveWithOverride = async (data) => {
  try {
    // Clone the data and add force_continue flag
    const overrideData = {
      ...data,
      force_continue: true,
    };

    const response = await axios.post(`/leave-masters`, overrideData);
    return response.data;
  } catch (error) {
    console.error("Error creating leave with override:", error);
    throw error;
  }
};

//update the leave master
export const updateLeave = async (id, data) => {
  try {
    const response = await axios.put(`/leave-masters/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating leave:", error);
    throw error;
  }
};

// Update leave status and send email notification
export const updateLeaveStatus = async (id, statusData) => {
  try {
    const response = await axios.put(`/leave-masters/${id}/status`, statusData);
    return response.data;
  } catch (error) {
    console.error("Error updating leave status:", error);
    throw error;
  }
};

//get leave by ID
export const getLeaveById = async (id) => {
  try {
    const response = await axios.get(`/leave-masters/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching leave:", error);
    return null;
  }
};

//delete leave by ID
export const deleteLeave = async (id) => {
  try {
    const response = await axios.delete(`/leave-masters/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting leave:", error);
    throw error;
  }
};

export const getLeaveCountsByEmployee = async (employeeId) => {
  try {
    const response = await axios.get(`/Leave-Master/${employeeId}/counts`);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching leave counts:",
      error.response?.data || error
    );
    throw error;
  }
};

// Get pending leave records
export const getPendingLeaves = async () => {
  try {
    const response = await axios.get(`/Leave-Master/status/pending`);
    return response.data;
  } catch (error) {
    console.error("Error fetching pending leaves:", error);
    return [];
  }
};

// Get approved leave records
export const getApprovedLeaves = async () => {
  try {
    const response = await axios.get(`/Leave-Master/status/approved`);
    return response.data;
  } catch (error) {
    console.error("Error fetching approved leaves:", error);
    return [];
  }
};

// Get HR approved leave records
export const getHRApprovedLeaves = async () => {
  try {
    const response = await axios.get(`/Leave-Master/status/hr-approved`);
    return response.data;
  } catch (error) {
    console.error("Error fetching HR approved leaves:", error);
    return [];
  }
};

// Get rejected leave records
export const getRejectedLeaves = async () => {
  try {
    const response = await axios.get(`/Leave-Master/status/rejected`);
    return response.data;
  } catch (error) {
    console.error("Error fetching rejected leaves:", error);
    return [];
  }
};

// Get leaves by employee ID
export const getLeavesByEmployee = async (employeeId) => {
  try {
    const response = await axios.get(`/leave-masters/${employeeId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching employee leaves:", error);
    return [];
  }
};

// export const getLeaveCountsByEmployee = async (employeeId) => {
//     try {
//       const response = await axios.get(`/leave-masters/${employeeId}/counts`);
//       return response.data;
//     } catch (error) {
//       console.error(
//         "Error fetching leave counts:",
//         error.response?.data || error
//       );
//       throw error;
//     }
//   };
