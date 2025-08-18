import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const EmployeeFormContext = createContext();

const initialState = {
  personal: {
    id: "",
    title: "",
    attendanceEmpNo: "",
    epfNo: "",
    nicNumber: "",
    dob: "",
    gender: "",
    religion: "",
    countryOfBirth: "",
    profilePicture: null,
    profilePicturePreview: null,
    employmentStatus: "",
    nameWithInitial: "",
    fullName: "",
    displayName: "",
    maritalStatus: "",
    relationshipType: "",
    spouseTitle: "",
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
    incrementEffectiveFrom: "",
    bankName: "",
    branchName: "",
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
    ot_morning_rate: "0",
    ot_night_rate: "0",
    eveningOt: false,
    budgetaryReliefAllowance2015: false,
    budgetaryReliefAllowance2016: false,
    stamp: false,
  },
  organization: {
    company: "",
    department: "",
    subDepartment: "",
    companyName: "",
    departmentName: "",
    subDepartmentName: "",
    currentSupervisor: "",
    dateOfJoined: "",
    designation: "",
    designationName: "",
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
    currentStatus: 1,
    dayOff: "",
  },
  documents: [],
};

export const EmployeeFormProvider = ({ children }) => {
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data from localStorage on initial render
  useEffect(() => {
    const loadData = () => {
      try {
        const savedData = localStorage.getItem("employeeFormData");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          const documentsWithPreview =
            parsedData.documents?.map((doc) => ({
              ...doc,
              preview: null,
            })) || [];

          setFormData({
            ...parsedData,
            documents: documentsWithPreview,
            personal: {
              ...parsedData.personal,
              profilePicture: null,
            },
          });
        }
      } catch (error) {
        console.error("Error loading form data:", error);
      }
    };
    loadData();
  }, []);

  // Save to localStorage whenever formData changes
  useEffect(() => {
    const saveData = () => {
      try {
        const dataToSave = {
          ...formData,
          personal: {
            ...formData.personal,
            profilePicture: formData.personal.profilePicturePreview,
          },
          documents: formData.documents.map((doc) => ({
            ...doc,
            file: null,
            type: doc.type,
            name: doc.name,
            size: doc.size,
            status: doc.status,
          })),
        };

        localStorage.setItem("employeeFormData", JSON.stringify(dataToSave));
      } catch (error) {
        console.error("Error saving form data:", error);
      }
    };

    saveData();
  }, [formData]);

  const updateFormData = useCallback((section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
  }, []);

  const addDocuments = useCallback((files) => {
    const newDocs = Array.from(files).map((file) => ({
      file,
      type: "",
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      status: "pending",
    }));

    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...newDocs],
    }));
  }, []);

  const updateDocumentType = useCallback((index, type) => {
    setFormData((prev) => {
      const updatedDocs = [...prev.documents];
      updatedDocs[index] = { ...updatedDocs[index], type };
      return { ...prev, documents: updatedDocs };
    });
  }, []);

  const removeDocument = useCallback((index) => {
    setFormData((prev) => {
      const docToRemove = prev.documents[index];
      if (docToRemove?.preview) {
        URL.revokeObjectURL(docToRemove.preview);
      }
      return {
        ...prev,
        documents: prev.documents.filter((_, i) => i !== index),
      };
    });
  }, []);

  const clearForm = useCallback(() => {
    formData.documents.forEach((doc) => {
      if (doc?.preview) URL.revokeObjectURL(doc.preview);
    });
    setFormData(initialState);
    setErrors({});
    localStorage.removeItem("employeeFormData");
  }, [formData.documents]);

  const setFormErrors = useCallback((newErrors) => {
    setErrors(newErrors);
  }, []);

  const clearSectionErrors = useCallback((section) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[section];
      return newErrors;
    });
  }, []);

  const clearFieldError = useCallback((section, field) => {
    setErrors((prev) => {
      if (!prev[section]) return prev;

      const newErrors = { ...prev };
      delete newErrors[section][field];

      if (Object.keys(newErrors[section]).length === 0) {
        delete newErrors[section];
      }

      return newErrors;
    });
  }, []);

  return (
    <EmployeeFormContext.Provider
      value={{
        formData,
        updateFormData,
        setFormData,
        addDocuments,
        removeDocument,
        clearForm,
        isLoading,
        setIsLoading,
        errors,
        setFormErrors,
        clearSectionErrors,
        clearFieldError,
        isSubmitting,
        setIsSubmitting,
        updateDocumentType,
      }}
    >
      {children}
    </EmployeeFormContext.Provider>
  );
};

export const useEmployeeForm = () => {
  const context = useContext(EmployeeFormContext);
  if (!context) {
    throw new Error(
      "useEmployeeForm must be used within an EmployeeFormProvider"
    );
  }
  return context;
};
