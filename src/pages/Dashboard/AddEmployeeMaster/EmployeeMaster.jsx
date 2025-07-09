import React, { useState } from 'react';
import EmpPersonalDetails from '@dashboard/AddEmployeeMaster/EmpPersonalDetails';
import AddressDetails from '@dashboard/AddEmployeeMaster/AddressDetails';
import OrganizationDetails from '@dashboard/AddEmployeeMaster/OrganizationDetails';
import CompensationManagement from '@dashboard/AddEmployeeMaster/CompensationManagement';
import Employeedocument from '@dashboard/AddEmployeeMaster/Employeedocument';
import EmployeeConfirmationModal from './EmployeeConfirmationModal';
import { EmployeeFormProvider } from '@contexts/EmployeeFormContext';

const steps = [
  'personal',
  'address',
  'compensation',
  'organization',
  'employeedocument',
  'confirmation'
];

const EmployeeMaster = () => {
  const [activeCategory, setActiveCategory] = useState('personal');
  const currentStepIndex = steps.indexOf(activeCategory);

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

  const handleSubmit = (allEmployeeData) => {
    console.log("Submitting all employee data:", JSON.stringify(allEmployeeData, null, 2));
    alert('Employee submitted!');
    // Here you would typically send data to backend
  };

  return (
    <EmployeeFormProvider>
      <div>
        <div className="flex gap-2 px-4 py-2 border-b border-gray-200 bg-white">
          {steps.map((step) => (
            <button
              key={step}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeCategory === step
                  ? 'bg-indigo-600 text-white'
                  : 'text-indigo-700 hover:bg-indigo-100'
              }`}
              onClick={() => setActiveCategory(step)}
            >
              {step.charAt(0).toUpperCase() + step.slice(1)}
            </button>
          ))}
        </div>
        <div className="p-4">
          <div className="p-4">
            {activeCategory === 'personal' && (
              <EmpPersonalDetails
                onNext={goNext}
                activeCategory={activeCategory}
              />
            )}
            {activeCategory === 'address' && (
              <AddressDetails
                onNext={goNext}
                onPrevious={goPrevious}
                activeCategory={activeCategory}
              />
            )}
            {activeCategory === 'compensation' && (
              <CompensationManagement
                onNext={goNext}
                onPrevious={goPrevious}
                activeCategory={activeCategory}
              />
            )}
            {activeCategory === 'organization' && (
              <OrganizationDetails
                onNext={goNext}
                onPrevious={goPrevious}
                activeCategory={activeCategory}
              />
            )}
            {activeCategory === 'employeedocument' && (
              <Employeedocument
                onPrevious={goPrevious}
                onSubmit={handleSubmit}
                activeCategory={activeCategory}
              />
            )}
            {activeCategory === 'confirmation' && (
              <EmployeeConfirmationModal
                onPrevious={goPrevious}
                onSubmit={handleSubmit}
                activeCategory={activeCategory}
              />
            )}
          </div>
        </div>
      </div>
    </EmployeeFormProvider>
  );
};

export default EmployeeMaster;