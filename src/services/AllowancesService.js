import axios from "@utils/axios";

const getAllAllowances = async () => {
  try {
    const response = await axios.get(`/allowances`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching allowances:", error);
    throw error;
  }
};

const createAllowance = async (allowanceData) => {
  try {
    const response = await axios.post(`/allowances`, allowanceData);
    return response.data.data;
  } catch (error) {
    console.error("Error creating allowance:", error);
    throw error.response?.data?.errors || error.message;
  }
};

const updateAllowance = async (id, allowanceData) => {
  try {
    const response = await axios.put(`/allowances/${id}`, allowanceData);
    return response.data.data;
  } catch (error) {
    console.error("Error updating allowance:", error);
    throw error.response?.data?.errors || error.message;
  }
};

const deleteAllowance = async (id) => {
  try {
    await axios.delete(`/allowances/${id}`);
  } catch (error) {
    console.error("Error deleting allowance:", error);
    throw error;
  }
};

/*
const getAllowancesByCompanyOrDepartment = async (companyId, departmentId) => {
  try {
    const response = await axios.get(`/allowance/by-company-or-department`, {
      params: {
        companyId,
        departmentId,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching allowances by company or department:", error);
    throw error;
  }
};
*/


const getAllowancesByCompanyOrDepartment = async (companyId, departmentId) => {
  try {
    const response = await axios.get(`/allowances/by-company-or-department`, {
      params: { company_id: companyId, department_id: departmentId },
    });
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return []; // ✅ treat as no allowances
    }
    throw error;
  }
};


const downloadTemplate = async () => {
  try {
    const response = await axios.get(`/allowances/template/download`, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error("Error downloading template:", error);
    throw error;
  }
};

const importAllowances = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`/allowances/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error importing allowances:", error);
    throw error.response?.data || error.message;
  }
};

export default {
  getAllAllowances,
  createAllowance,
  updateAllowance,
  deleteAllowance,
  getAllowancesByCompanyOrDepartment,
  downloadTemplate,
  importAllowances
};