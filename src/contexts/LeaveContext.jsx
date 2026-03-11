import React, { createContext, useContext, useState, useCallback } from "react";

const LeaveContext = createContext();

export const useLeave = () => {
  const context = useContext(LeaveContext);
  if (!context) {
    throw new Error("useLeave must be used within LeaveProvider");
  }
  return context;
};

const initialLeaveState = {
  employee_id: "",
  employee_name: "",
  employee_no: "",
  department: "",
  leave_type: "",
  from_date: "",
  to_date: "",
  reason: "",
  contact_during_leave: "",
  status: "pending",
};

export const LeaveProvider = ({ children }) => {
  const [leaveData, setLeaveData] = useState(initialLeaveState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateLeaveData = useCallback((data) => {
    setLeaveData((prev) => ({ ...prev, ...data }));
  }, []);

  const loadEmployeeToLeaveForm = useCallback((employee) => {
    setLeaveData({
      ...initialLeaveState,
      employee_id: employee.id || "",
      employee_name: employee.name_with_initials || employee.full_name || "",
      employee_no: employee.attendance_employee_no || "",
      department: employee.organization_assignment?.department?.name || "",
      contact_during_leave: employee.mobile_no || "",
    });
  }, []);

  const resetLeaveForm = useCallback(() => {
    setLeaveData(initialLeaveState);
  }, []);

  const value = {
    leaveData,
    updateLeaveData,
    loadEmployeeToLeaveForm,
    resetLeaveForm,
    isSubmitting,
    setIsSubmitting,
  };

  return <LeaveContext.Provider value={value}>{children}</LeaveContext.Provider>;
};
