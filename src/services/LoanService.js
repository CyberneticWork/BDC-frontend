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

export const fetchEmployeeNameByNo = async (employeeNo) => {
  try {
    const response = await axios.get(`/loans/employee-by-number/${employeeNo}`);
    return response.data || "";
  } catch (error) {
    console.error("Error fetching employee name:", error);
    return "";
  }
};