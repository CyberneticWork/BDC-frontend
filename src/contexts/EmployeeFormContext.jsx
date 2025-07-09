import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const EmployeeFormContext = createContext();

const initialState = {
  personal: {
    title: "",
    attendanceEmpNo: "",
    epfNo: "",
    nicNumber: "",
    dob: "",
    gender: "",
    religion: "",
    countryOfBirth: "",
    profilePicture: null,
    employmentStatus: "",
    nameWithInitial: "",
    fullName: "",
    displayName: "",
    maritalStatus: "",
    relationshipType: "",
    spouseName: "",
    spouseAge: "",
    spouseDob: "",
    spouseNic: "",
    children: [{ name: "", age: "", dob: "", nic: "" }],
  },
  address: {
    permanentAddress: "",
    temporaryAddress: "",
    email: "",
    landLine: "",
    mobileLine: "",
    gnDivision: "",
    policeStation: "",
    district: "",
    province: "",
    electoralDivision: "",
    emergencyContact: {
      relationship: "",
      contactName: "",
      contactAddress: "",
      contactTel: "",
    },
  },
  compensation: {
    basicSalary: "",
    incrementValue: "",
    incrementEffectiveFrom: "2025-06-20",
    bankName: "1/1/1900",
    branchName: "1/1/1900",
    bankCode: "",
    branchCode: "",
    bankAccountNo: "",
    comments: "",
    secondaryEmp: false,
    primaryEmploymentBasic: false,
    enableEpfEtf: false,
    otActive: false,
    earlyDeduction: false,
    incrementActive: false,
    nopayActive: false,
    morningOt: false,
    eveningOt: false,
    budgetaryReliefAllowance2015: false,
    budgetaryReliefAllowance2016: false,
  },
  organization: {
    company: "",
    department: "",
    subDepartment: "",
    currentSupervisor: "",
    dateOfJoined: "",
    designation: "",
    probationPeriod: false,
    trainingPeriod: false,
    contractPeriod: false,
    probationFrom: "",
    probationTo: "",
    trainingFrom: "",
    trainingTo: "",
    contractFrom: "",
    contractTo: "",
    confirmationDate: "",
    resignationDate: "",
    resignationLetter: null,
    resignationApproved: false,
    currentStatus: "Active",
    dayOff: "",
  },
  documents: [],
};

export const EmployeeFormProvider = ({ children }) => {
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);

  // Load data from localStorage on initial render
  useEffect(() => {
    const loadData = () => {
      try {
        const savedData = localStorage.getItem("employeeFormData");
        if (savedData) {
          setFormData(JSON.parse(savedData));
        }
      } catch (error) {
        console.error("Error loading form data:", error);
      }
    };
    loadData();
  }, []);

  // Save to localStorage whenever formData changes
  useEffect(() => {
    localStorage.setItem("employeeFormData", JSON.stringify(formData));
  }, [formData]);

  const updateFormData = useCallback((section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
  }, []);

  const addDocuments = useCallback((files) => {
    const newDocs = Array.from(files).map((file) => ({
      file,
      type: "",
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      status: "pending",
    }));

    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...newDocs],
    }));
  }, []);

  const removeDocument = useCallback((index) => {
    const docToRemove = formData.documents[index];
    if (docToRemove.preview) {
      URL.revokeObjectURL(docToRemove.preview);
    }
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  }, [formData.documents]);

  const clearForm = useCallback(() => {
    // Clean up object URLs
    formData.documents.forEach((doc) => {
      if (doc.preview) URL.revokeObjectURL(doc.preview);
    });
    setFormData(initialState);
    localStorage.removeItem("employeeFormData");
  }, [formData.documents]);

  return (
    <EmployeeFormContext.Provider
      value={{
        formData,
        updateFormData,
        addDocuments,
        removeDocument,
        clearForm,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </EmployeeFormContext.Provider>
  );
};

export const useEmployeeForm = () => {
  const context = useContext(EmployeeFormContext);
  if (!context) {
    throw new Error("useEmployeeForm must be used within an EmployeeFormProvider");
  }
  return context;
};