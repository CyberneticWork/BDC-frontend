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

export const fetchLoanReport = async (employeeNo = null, loanId = null) => {
  try {
    const params = {};
    if (employeeNo) params.employee_no = employeeNo;
    if (loanId) params.loan_id = loanId;
    const response = await axios.get(`${API_PREFIX}/report/export`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching loan report:", error);
    throw error;
  }
};

export const requestLoanSkip = async (loanId, installmentNo, reason) => {
  const response = await axios.post(`${API_PREFIX}/${loanId}/skip-request`, {
    installment_no: installmentNo,
    reason,
  });
  return response.data;
};

export const decideLoanSkip = async (loanId, installmentNo, action, approverNote = null) => {
  const response = await axios.post(`${API_PREFIX}/${loanId}/skip-decide`, {
    installment_no: installmentNo,
    action,
    approver_note: approverNote,
  });
  return response.data;
};

export const getMyLoans = () =>
  axios.get("/me/loans").then((r) => r.data);

export const submitLoanRequest = (payload) =>
  axios.post("/me/loans", payload).then((r) => r.data);

export const listHrLoans = (params = {}) =>
  axios.get("/hr/loans", { params }).then((r) => r.data);

export const reviewLoanRequest = (id, payload) =>
  axios.post(`/hr/loans/${id}/review`, payload).then((r) => r.data);