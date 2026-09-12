import axios from "@utils/axios";
import {
  companiesForCurrentUrl,
  companyListQueryParams,
  ensureBrandedCompany,
} from "../utils/tenantCompanies";

//fetch data from department
export const getDepartments = async (id) => {
  try {
    const response = await axios.get(`/apiData/departments/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
};

export const fetchCompanies = async () => {
  try {
    await ensureBrandedCompany();
    const response = await axios.get(`/apiData/companies`, {
      params: companyListQueryParams(),
    });
    return companiesForCurrentUrl(response.data || []);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
};

// Fetch all deductions
export const fetchDeductions = async () => {
  try {
    const response = await axios.get(`/deductions`);
    return response.data;
  } catch (error) {
    console.error("Error fetching deductions:", error);
    return [];
  }
};

/*
export const fetchDeductionsByCompanyOrDepartment = async () => {
  try {
    const response = await axios.get(`/deduction/by-company-or-department`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching deductions:", error);
    return [];
  }
};
*/


export const fetchDeductionsByCompanyOrDepartment = async () => {
  try {
    const response = await axios.get(`/deduction/by-company-or-department`);
    
    return response.data?.data || response.data || []; 
  } catch (error) {
    console.error("Error fetching deductions:", error);
    return [];
  }
};

// Create a new deduction
export const createDeduction = async (data) => {
  try {
    const response = await axios.post(`/deductions`, data);
    return response.data;
  } catch (error) {
    console.error("Error creating deduction:", error);
    throw error;
  }
};

// Get a single deduction by ID
export const getDeduction = async (id) => {
  try {
    const response = await axios.get(`/deductions/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching deduction:", error);
    return null;
  }
};

// Update a deduction by ID
export const updateDeduction = async (id, data) => {
  try {
    const response = await axios.put(`/deductions/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating deduction:", error);
    throw error;
  }
};

// Delete a deduction by ID
export const deleteDeduction = async (id) => {
  try {
    const response = await axios.delete(`/deductions/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting deduction:", error);
    throw error;
  }
  
};
// Download template
export const downloadTemplate = async () => {
  try {
    const response = await axios.get(`/deductions/template/download`, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error("Error downloading template:", error);
    throw error;
  }
};

// Import deductions
export const importDeductions = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`/deductions/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error importing deductions:", error);
    throw error.response?.data || error.message;
  }
};
