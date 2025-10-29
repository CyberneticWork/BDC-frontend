// services/AccountingService.js
import axios from "@utils/axios";

// Get all accounts
export const getAccountList = async () => {
  try {
    const response = await axios.get('/accounts');
    return response.data;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error;
  }
};

// Add new account
export const addAccount = async (data) => {
  try {
    // Include user_id for the backend (you might want to get this from auth context)
    const accountData = {
      ...data,
      user_id: 1 // Replace with actual user ID from your auth system
    };
    
    const response = await axios.post('/accounts', accountData);
    return response.data;
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
};

// Update account
export const updateAccount = async (id, data) => {
  try {
    const response = await axios.put(`/accounts/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating account:", error);
    throw error;
  }
};

// Delete account
export const deleteAccount = async (id) => {
  try {
    const response = await axios.delete(`/accounts/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
};

// These would need corresponding backend endpoints
export const addAccountCategory = async (data) => {
  try {
    // You'll need to create this endpoint in your backend
    const response = await axios.post('/account-categories', data);
    return response.data;
  } catch (error) {
    console.error("Error creating account category:", error);
    throw error;
  }
};

// export const addAccountGroup = async (data) => {
//   try {
//     // You'll need to create this endpoint in your backend
//     const response = await axios.post('/account-groups', {accountGroup :data});
//     return response.data;
//   } catch (error) {
//     console.error("Error creating account group:", error);
//     throw error;
//   }
// };

export const getAccountCategories = () => {
  // For now, return empty array or implement if you have backend endpoint
  return [];
};

// services/AccountingService.js
// export const getAccountGroups = async () => {
//   try {
//     const response = await axios.get("/account-groups");
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching account groups:", error);
//     throw error;
//   }
// };


