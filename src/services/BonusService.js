import axios from "@utils/axios";

const getAllBonuses = async () => {
  try {
    const response = await axios.get(`/bonuses`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching bonuses:", error);
    throw error;
  }
};

const createBonus = async (bonusData) => {
  try {
    const response = await axios.post(`/bonuses`, bonusData);
    return response.data.data;
  } catch (error) {
    console.error("Error creating bonus:", error);
    throw error.response?.data?.errors || error.message;
  }
};

const updateBonus = async (id, bonusData) => {
  try {
    const response = await axios.put(`/bonuses/${id}`, bonusData);
    return response.data.data;
  } catch (error) {
    console.error("Error updating bonus:", error);
    throw error.response?.data?.errors || error.message;
  }
};

const deleteBonus = async (id) => {
  try {
    await axios.delete(`/bonuses/${id}`);
  } catch (error) {
    console.error("Error deleting bonus:", error);
    throw error;
  }
};

const getBonusesByCompanyOrDepartment = async (companyId, departmentId) => {
  try {
    const response = await axios.get(`/bonuses/by-company-or-department`, {
      params: { company_id: companyId, department_id: departmentId },
    });
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return []; // ✅ treat as no bonuses
    }
    throw error;
  }
};

const downloadTemplate = async () => {
  try {
    const response = await axios.get(`/bonuses/template/download`, {
      responseType: "blob",
    });
    return response;
  } catch (error) {
    console.error("Error downloading template:", error);
    throw error;
  }
};

const importBonuses = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`/bonuses/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error importing bonuses:", error);
    throw error.response?.data || error.message;
  }
};

export default {
  getAllBonuses,
  createBonus,
  updateBonus,
  deleteBonus,
  getBonusesByCompanyOrDepartment,
  downloadTemplate,
  importBonuses,
};