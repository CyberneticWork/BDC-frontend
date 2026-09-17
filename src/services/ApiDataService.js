import axios from "@utils/axios";
import {
  companiesForCurrentUrl,
  companyListQueryParams,
  ensureBrandedCompany,
} from "../utils/tenantCompanies";

const API_PREFIX = "/apiData";

const normalizeCompany = (company) => {
  const rawName = company?.name || company?.company_name || "";
  const code = company?.company_code || company?.companyCode || company?.code || "";
  const displayName = code && rawName ? `${code} - ${rawName}` : code || rawName || "Unnamed company";

  return {
    ...company,
    company_code: code,
    company_label: displayName,
    display_name: displayName,
  };
};

export const fetchCompanies = async (options = {}) => {
  try {
    if (!options.all) {
      await ensureBrandedCompany();
    }
    const response = await axios.get(options.all ? "/companies" : `${API_PREFIX}/companies`, {
      params: options.all ? { all: 1 } : companyListQueryParams(),
    });
    const rows = (response.data || []).map(normalizeCompany);
    if (options.all) {
      return rows;
    }
    return companiesForCurrentUrl(rows);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
};

export const fetchDepartments = async () => {
  try {
    await ensureBrandedCompany();
    const response = await axios.get(`${API_PREFIX}/departments`, {
      params: companyListQueryParams(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
};

export const fetchDepartmentsById = async (id) => {
  try {
    const response = await axios.get(`${API_PREFIX}/departments/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
};

export const fetchSubDepartments = async () => {
  try {
    await ensureBrandedCompany();
    const response = await axios.get(`${API_PREFIX}/subDepartments`, {
      params: companyListQueryParams(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching sub-departments:", error);
    return [];
  }
};

export const fetchSubDepartmentsById = async (id) => {
  try {
    const response = await axios.get(`${API_PREFIX}/subDepartments/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching sub-departments:", error);
    return [];
  }
};

export const fetchDesignations = async () => {
  try {
    const response = await axios.get(`${API_PREFIX}/designations`);
    return response.data;
  } catch (error) {
    console.error("Error fetching Designations:", error);
    return [];
  }
};

export const createCompany = async (data) => {
  try {
    const response = await axios.post(`/companies`, data);
    return response.data;
  } catch (error) {
    console.error("Error adding companies:", error);
    throw error; // Throw error so frontend can handle validation errors
  }
};

export const updateCompany = async (id, data) => {
  try {
    const response = await axios.put(`/companies/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating company:", error);
    throw error;
  }
};

export const activateCompanyPortal = async (id) => {
  const response = await axios.post(`/companies/${id}/activate-portal`);
  return response.data;
};

export const uploadCompanyLogo = async (id, file, extra = {}) => {
  const form = new FormData();
  if (file) form.append("logo", file);
  if (extra.logo_url) form.append("logo_url", extra.logo_url);
  const response = await axios.post(`/companies/${id}/logo`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteCompany = async (id) => {
  try {
    await axios.delete(`/companies/${id}`);
  } catch (error) {
    console.error("Error deleting company:", error);
    throw error;
  }
};

export const createDepartment = async (data) => {
  const response = await axios.post(`/departments`, data);
  return response.data;
};

export const updateDepartment = async (id, data) => {
  const response = await axios.put(`/departments/${id}`, data);
  return response.data;
};

export const deleteDepartment = async (id) => {
  await axios.delete(`/departments/${id}`);
};

export const createSubDepartment = async (data) => {
  try {
    const response = await axios.post(`/subdepartments`, data);
    return response.data;
  } catch (error) {
    console.error("Error creating sub-department:", error);
    throw error;
  }
};

export const updateSubDepartment = async (id, data) => {
  try {
    const response = await axios.put(`/subdepartments/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating sub-department:", error);
    throw error;
  }
};

export const deleteSubDepartment = async (id) => {
  try {
    await axios.delete(`/subdepartments/${id}`);
  } catch (error) {
    console.error("Error deleting sub-department:", error);
    throw error;
  }
};

export const fetchTimeCards = async (params = {}) => {
  try {
    const response = await axios.get("/time-cards", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching time cards:", error);
    return [];
  }
};
export const employeesBySubDepartment = async (id) => {
  try {
    const response = await axios.get(
      `${API_PREFIX}/subDepartments/${id}/employees`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching employees by sub-department:", error);
    return [];
  }
};

export const addTimeCard = async (data) => {
  try {
    const response = await axios.post("/time-cards", data);
    console.log("Time card added successfully:", response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const employeesByCompany = async (id) => {
  try {
    const response = await axios.get(`${API_PREFIX}/companies/${id}/employees`);
    return response.data;
  } catch (error) {
    console.error("Error fetching employees by company:", error);
    return [];
  }
};

export const addNewDesignation = async (data) => {
  try {
    const response = await axios.post(`${API_PREFIX}/addNewDesignation`, {name :data});
    return response.data;
  } catch (error) {
    console.error("Error adding addNewDesignation:", error);
    throw error;
  }
};
