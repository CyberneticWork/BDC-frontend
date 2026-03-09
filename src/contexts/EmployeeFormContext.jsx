import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import config from "@src/config";

const EmployeeFormContext = createContext();
//
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
    password: "",
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

    otActiveSpecial: false,

    earlyDeduction: false,
    incrementActive: false,
    nopayActive: false,
    morningOt: false,
    ot_morning_rate: "0",
    ot_night_rate: "0",
    eveningOt: false,

    morningOtSpecial: false,
    ot_morning_rate_special: "0",
    ot_night_rate_special: "0",
    eveningOtSpecial: false,

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

  const loadEmployeeData = useCallback((employeeData) => {
    console.log('Loading employee data:', employeeData);
    console.log('Children data:', employeeData.children);
    
    setFormData({
      personal: {
        id: employeeData.id || "",
        title: employeeData.title || "",
        attendanceEmpNo: employeeData.attendance_employee_no || "",
        epfNo: employeeData.epf || "",
        nicNumber: employeeData.nic || "",
        dob: employeeData.dob || "",
        gender: employeeData.gender ? (employeeData.gender.charAt(0).toUpperCase() + employeeData.gender.slice(1)) : "",
        religion: employeeData.religion || "",
        countryOfBirth: employeeData.country_of_birth || "",
        profilePicture: null,
        profilePicturePreview: employeeData.profile_photo_path && !employeeData.profile_photo_path.includes('fakepath') && !employeeData.profile_photo_path.startsWith('C:') && !employeeData.profile_photo_path.startsWith('c:')
          ? (employeeData.profile_photo_path.startsWith('http') ? employeeData.profile_photo_path : `${config.apiBaseUrl}/storage/${employeeData.profile_photo_path}`)
          : null,
        employmentStatus: employeeData.employment_type_id || "",
        nameWithInitial: employeeData.name_with_initials || "",
        fullName: employeeData.full_name || "",
        displayName: employeeData.display_name || "",
        maritalStatus: employeeData.marital_status ? (employeeData.marital_status.charAt(0).toUpperCase() + employeeData.marital_status.slice(1)) : "",
        relationshipType: employeeData.spouse?.type || "",
        spouseTitle: employeeData.spouse?.title || "",
        spouseName: employeeData.spouse?.name || "",
        spouseAge: employeeData.spouse?.age?.toString() || "",
        spouseDob: employeeData.spouse?.dob || "",
        spouseNic: employeeData.spouse?.nic || "",
        children: employeeData.children?.length > 0 
          ? employeeData.children.map(child => ({
              name: child.name || "",
              age: child.age?.toString() || "",
              dob: child.dob || "",
              nic: child.nic || ""
            }))
          : [{ name: "", age: "", dob: "", nic: "" }],
      },
      address: {
        permanentAddress: employeeData.contact_detail?.permanent_address || "",
        temporaryAddress: employeeData.contact_detail?.temporary_address || "",
        email: employeeData.contact_detail?.email || "",
        password: "",
        landLine: employeeData.contact_detail?.land_line || "",
        mobileLine: employeeData.contact_detail?.mobile_line || "",
        gnDivision: employeeData.contact_detail?.gn_division || "",
        policeStation: employeeData.contact_detail?.police_station || "",
        district: employeeData.contact_detail?.district || "",
        province: employeeData.contact_detail?.province || "",
        electoralDivision: employeeData.contact_detail?.electoral_division || "",
        emergencyContact: {
          relationship: employeeData.contact_detail?.emg_relationship || "",
          contactName: employeeData.contact_detail?.emg_name || "",
          contactAddress: employeeData.contact_detail?.emg_address || "",
          contactTel: employeeData.contact_detail?.emg_tel || "",
        },
      },
      compensation: {
        basicSalary: employeeData.compensation?.basic_salary || "",
        incrementValue: employeeData.compensation?.increment_value || "",
        incrementEffectiveFrom: employeeData.compensation?.increment_effected_date || "",
        bankName: employeeData.compensation?.bank_name || "",
        branchName: employeeData.compensation?.branch_name || "",
        bankCode: employeeData.compensation?.bank_code || "",
        branchCode: employeeData.compensation?.branch_code || "",
        bankAccountNo: employeeData.compensation?.bank_account_no || "",
        comments: employeeData.compensation?.comments || "",
        secondaryEmp: employeeData.compensation?.secondary_emp || false,
        primaryEmploymentBasic: employeeData.compensation?.primary_emp_basic || false,
        enableEpfEtf: employeeData.compensation?.enable_epf_etf || false,
        otActive: employeeData.compensation?.ot_active || false,
        otActiveSpecial: false,
        earlyDeduction: employeeData.compensation?.early_deduction || false,
        incrementActive: employeeData.compensation?.increment_active || false,
        nopayActive: employeeData.compensation?.active_nopay || false,
        morningOt: employeeData.compensation?.ot_morning || false,
        ot_morning_rate: employeeData.compensation?.ot_morning_rate || "0",
        ot_night_rate: employeeData.compensation?.ot_night_rate || "0",
        eveningOt: employeeData.compensation?.ot_evening || false,
        morningOtSpecial: employeeData.compensation?.ot_morning_special || false,
        ot_morning_rate_special: "0",
        ot_night_rate_special: "0",
        eveningOtSpecial: employeeData.compensation?.ot_evening_special || false,
        budgetaryReliefAllowance2015: employeeData.compensation?.br1 || false,
        budgetaryReliefAllowance2016: employeeData.compensation?.br2 || false,
        stamp: employeeData.compensation?.stamp || false,
      },
      organization: {
        company: employeeData.organization_assignment?.company_id || "",
        department: employeeData.organization_assignment?.department_id || "",
        subDepartment: employeeData.organization_assignment?.sub_department_id || "",
        companyName: employeeData.organization_assignment?.company?.name || "",
        departmentName: employeeData.organization_assignment?.department?.name || "",
        subDepartmentName: employeeData.organization_assignment?.sub_department?.name || "",
        currentSupervisor: employeeData.organization_assignment?.current_supervisor || "",
        dateOfJoined: employeeData.organization_assignment?.date_of_joining || "",
        designation: employeeData.organization_assignment?.designation_id || "",
        designationName: employeeData.organization_assignment?.designation?.name || "",
        probationPeriod: employeeData.organization_assignment?.probationary_period || false,
        trainingPeriod: employeeData.organization_assignment?.training_period || false,
        contractPeriod: employeeData.organization_assignment?.contract_period || false,
        probationFrom: employeeData.organization_assignment?.probationary_period_from || "",
        probationTo: employeeData.organization_assignment?.probationary_period_to || "",
        trainingFrom: employeeData.organization_assignment?.training_period_from || "",
        trainingTo: employeeData.organization_assignment?.training_period_to || "",
        contractFrom: employeeData.organization_assignment?.contract_period_from || "",
        contractTo: employeeData.organization_assignment?.contract_period_to || "",
        confirmationDate: employeeData.organization_assignment?.confirmation_date || "",
        resignationDate: employeeData.organization_assignment?.date_of_resigning || "",
        resignationLetter: null,
        resignationApproved: false,
        currentStatus: employeeData.organization_assignment?.is_active ? 1 : 0,
        dayOff: employeeData.organization_assignment?.day_off || "",
      },
      documents: [],
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
        loadEmployeeData,
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
