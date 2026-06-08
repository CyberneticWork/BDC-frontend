import axios from "@utils/axios";

const API_PREFIX = '/loans';

export const createLoan = async (loanData) => {
  try {
    console.log('Sending loan data:', loanData);
    const response = await axios.post('/loans', loanData);
    return response.data;
  } catch (error) {
    console.error('Error creating loan:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchLoans = async () => {
  try {
    const response = await axios.get(API_PREFIX);
    return response.data;
  } catch (error) {
    console.error('Error fetching loans:', error);
    return [];
  }
};

export const fetchEmployeeLoans = async (employeeNo) => {
  try {
    const response = await axios.get(`${API_PREFIX}/by-employee/${employeeNo}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching employee loans:', error);
    return [];
  }
};

export const updateLoan = async (id, loanData) => {
  try {
    const response = await axios.put(`${API_PREFIX}/${id}`, loanData);
    return response.data;
  } catch (error) {
    console.error('Error updating loan:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchEmployeeNameByNo = async (employeeNo) => {
  try {
    const response = await axios.get(`/loans/employee-by-number/${employeeNo}`);
    return response.data || "";
  } catch (error) {
    console.error("Error fetching employee name:", error);
    return "";
  }
};

export const fetchLoanReport = async (employeeNo = null) => {
  try {
    const params = employeeNo ? { employee_no: employeeNo } : {};
    const response = await axios.get(`${API_PREFIX}/report/export`, { params });
    return response.data?.data || [];
  } catch (error) {
    console.error("Error fetching loan report:", error);
    throw error;
  }
};