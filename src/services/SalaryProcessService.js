import axios from "@utils/axios";

export const getSalaryData = async (month, year, company_id, department_id) => {
  try {
    const response = await axios.get(
      `/salaryCal/employees?month=${month}&year=${year}&company_id=${company_id}&department_id=${department_id}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching salary data:", error);
    throw error;
  }
};

export const UpdateAllowances = async (allowances) => {
  try {
    const response = await axios.post("/salary/process/allowances", allowances);
    return response.data;
  } catch (error) {
    console.error("Error fetching salary data:", error);
    throw error;
  }
};

export const saveSalaryData = async (data) => {
  // console.log(JSON.stringify({data}))
  try {
    const response = await axios.post("/salary/process/save", { data });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSlaryStatus = async (status) => {
  try {
    const response = await axios.get(`/salary/update/status?status=${status}`);
    return response.data;
  } catch (error) {
    console.error("Error updating salary status:", error);
    throw error;
  }
};
export const getProcessedSalaries = async () => {
  try {
    const response = await axios.get("/salary/processed");
    return response.data;
  } catch (error) {
    console.error("Error fetching processed salaries:", error);
    throw error;
  }
};
export const markPayslipsAsIssued = async (employeeIds) => {
  try {
    const response = await axios.post("/salary/process/mark-issued", {
      employee_ids: employeeIds,
    });
    return response.data;
  } catch (error) {
    console.error("Error marking payslips as issued:", error);
    throw error;
  }
};

export const fetchExcelData = async (payload) => {
  try {
    const response = await axios.post(
      "/salary/process/fetchExcelData",
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error marking payslips as issued:", error);
    throw error;
  }
};

export const importExcelData = async (file) => {
  const fileType = file.name.toLowerCase().includes("allowance")
    ? "allowances"
    : file.name.toLowerCase().includes("deduction")
    ? "deductions"
    : "allowances"; // default

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", fileType);

  const response = await axios.post(
    "/salary/process/importExcelData",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
