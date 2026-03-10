import React, { useState, useEffect } from "react";
import EmpPersonalDetails from "@dashboard/AddEmployeeMaster/EmpPersonalDetails";
import AddressDetails from "@dashboard/AddEmployeeMaster/AddressDetails";
import OrganizationDetails from "@dashboard/AddEmployeeMaster/OrganizationDetails";
import CompensationManagement from "@dashboard/AddEmployeeMaster/CompensationManagement";
import Employeedocument from "@dashboard/AddEmployeeMaster/Employeedocument";
import EmployeeConfirmationModal from "./EmployeeConfirmationModal";
import {
  EmployeeFormProvider,
  useEmployeeForm,
} from "@contexts/EmployeeFormContext";
import employeeService from "@services/EmployeeDataService";
import Swal from "sweetalert2";

const steps = [
  "personal",
  "address",
  "compensation",
  "organization",
  "documents",
  "confirmation",
];

const EmployeeMasterWrapper = () => {
  return (
    <EmployeeFormProvider>
      <EmployeeMaster />
    </EmployeeFormProvider>
  );
};

const EmployeeMaster = () => {
  const [activeCategory, setActiveCategory] = useState("personal");
  const currentStepIndex = steps.indexOf(activeCategory);
  const { setFormErrors, setIsSubmitting, clearForm, loadEmployeeData } =
    useEmployeeForm();

  // Load employee data if editing
  useEffect(() => {
    const editEmployeeId = localStorage.getItem('editEmployeeId');
    if (editEmployeeId) {
      const fetchEmployee = async () => {
        try {
          const employeeData = await employeeService.fetchEmployeeById(editEmployeeId);
          loadEmployeeData(employeeData);
          localStorage.removeItem('editEmployeeId');
        } catch (error) {
          console.error('Error loading employee:', error);
        }
      };
      fetchEmployee();
    }
  }, [loadEmployeeData]);

  const goNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setActiveCategory(steps[currentStepIndex + 1]);
    }
  };

  const goPrevious = () => {
    if (currentStepIndex > 0) {
      setActiveCategory(steps[currentStepIndex - 1]);
    }
  };

  const handleSubmit = async (allEmployeeData) => {
    setIsSubmitting(true);

    try {
      let response;
      if (allEmployeeData.personal?.id) {
        response = await employeeService.updateEmployee(
          allEmployeeData.personal.id,
          allEmployeeData
        );
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Employee updated successfully!",
        });
        window.dispatchEvent(new CustomEvent('employeeUpdated', {
          detail: { employeeId: allEmployeeData.personal.id }
        }));
        clearForm();
        setActiveCategory("personal");
      } else {
        response = await employeeService.submitEmployee(allEmployeeData);
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Employee submitted successfully!",
        });
        if (response?.data?.id) {
          window.dispatchEvent(new CustomEvent('employeeUpdated', {
            detail: { employeeId: response.data.id }
          }));
        }
        clearForm();
        setActiveCategory("personal");
      }
      return response;
    } catch (error) {
      console.error("Update error:", error);
      console.error("Full error response:", error.response?.data);
      console.error("Validation errors:", error.response?.data?.errors);
      console.error("Error message:", error.response?.data?.message);
      console.error("Error status:", error.response?.status);
      
      if (error.response?.data?.errors) {
        const formattedErrors = {};

        Object.entries(error.response.data.errors).forEach(
          ([fieldPath, messages]) => {
            const pathParts = fieldPath.split(".");
            let currentLevel = formattedErrors;

            pathParts.forEach((part, index) => {
              if (index === pathParts.length - 1) {
                currentLevel[part] = Array.isArray(messages) ? messages[0] : messages;
              } else {
                currentLevel[part] = currentLevel[part] || {};
                currentLevel = currentLevel[part];
              }
            });
          }
        );

        setFormErrors(formattedErrors);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Please fix the errors in the form!",
        });
      } else {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || "Error updating employee. Please try again.!";
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: errorMsg,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg mb-6 mx-4 mt-4">
        <h1 className="text-3xl font-bold mb-2">Employee Master</h1>
        <p className="text-blue-100">Complete employee information management system</p>
      </div>
      <div className="flex gap-2 px-4 py-2 border-b border-gray-200 bg-white items-center justify-between">
        <div className="flex gap-2">
          {steps.map((step) => (
            <button
              key={step}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeCategory === step
                  ? "bg-indigo-600 text-white"
                  : "text-indigo-700 hover:bg-indigo-100"
              }`}
              onClick={() => setActiveCategory(step)}
            >
              {step.charAt(0).toUpperCase() + step.slice(1)}
            </button>
          ))}
        </div>
        <h1 className="text-xl font-bold text-gray-800">Edit Employee</h1>
      </div>
      <div className="p-4">
        <div className="p-4">
          {activeCategory === "personal" && (
            <EmpPersonalDetails
              onNext={goNext}
              activeCategory={activeCategory}
            />
          )}
          {activeCategory === "address" && (
            <AddressDetails
              onNext={goNext}
              onPrevious={goPrevious}
              activeCategory={activeCategory}
            />
          )}
          {activeCategory === "compensation" && (
            <CompensationManagement
              onNext={goNext}
              onPrevious={goPrevious}
              activeCategory={activeCategory}
            />
          )}
          {activeCategory === "organization" && (
            <OrganizationDetails
              onNext={goNext}
              onPrevious={goPrevious}
              activeCategory={activeCategory}
            />
          )}
          {activeCategory === "documents" && (
            <Employeedocument
              onNext={goNext}
              onPrevious={goPrevious}
              onSubmit={handleSubmit}
              activeCategory={activeCategory}
            />
          )}
          {activeCategory === "confirmation" && (
            <EmployeeConfirmationModal
              onPrevious={goPrevious}
              onSubmit={handleSubmit}
              activeCategory={activeCategory}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeMasterWrapper;
