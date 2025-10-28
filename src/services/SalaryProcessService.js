import axios from "@utils/axios";

// Supports both legacy positional signature and new object-based signature
// Legacy: getSalaryData(month, year, company_id, department_id, kpi_type?)
// New: getSalaryData({ month, year, company_id, department_id, kpi_type })
export const getSalaryData = async (
  arg1,
  year,
  company_id,
  department_id,
  kpi_type
) => {
  try {
    // Normalize parameters
    let params;
    if (typeof arg1 === "object" && arg1 !== null) {
      params = arg1;
    } else {
      params = { month: arg1, year, company_id, department_id, kpi_type };
    }

    const searchParams = new URLSearchParams();
    // Required/base params
    if (params.month !== undefined && params.month !== "")
      searchParams.append("month", params.month);
    if (params.year !== undefined && params.year !== "")
      searchParams.append("year", params.year);
    if (params.company_id !== undefined && params.company_id !== "")
      searchParams.append("company_id", params.company_id);
    // Optional params - append only when provided and non-empty
    if (params.department_id) searchParams.append("department_id", params.department_id);
    if (params.kpi_type) searchParams.append("kpi_type", params.kpi_type);

    const response = await axios.get(`/salaryCal/employees?${searchParams.toString()}`);
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
