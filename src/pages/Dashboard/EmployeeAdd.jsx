import React, { useState, useEffect } from "react";

const MultiStepForm = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1 - Basic Details
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    // Step 2 - Additional Details
    address: "",
    city: "",
    zipCode: "",
    country: "",
    // Step 3 - Preferences
    newsletter: false,
    notifications: false,
    comments: "",
  });

  // Check if localStorage is available
  const isLocalStorageAvailable = () => {
    try {
      const test = "__localStorage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  };

  // Load saved data on component mount - this runs ONCE when component mounts
  useEffect(() => {
    console.log("🔄 Component mounted, checking for saved data...");

    if (isLocalStorageAvailable()) {
      try {
        const savedData = localStorage.getItem("multiStepFormData");
        const savedStep = localStorage.getItem("multiStepFormStep");
        const savedModalState = localStorage.getItem("multiStepFormModalOpen");

        console.log("📦 Raw saved data:", {
          savedData,
          savedStep,
          savedModalState,
        });

        if (savedData && savedData !== "null") {
          const parsedData = JSON.parse(savedData);
          console.log("✅ Parsed form data:", parsedData);
          setFormData(parsedData);
        }

        if (savedStep && savedStep !== "null") {
          const stepNumber = parseInt(savedStep);
          console.log("✅ Restored step:", stepNumber);
          setCurrentStep(stepNumber);
        }

        if (savedModalState === "true") {
          console.log("✅ Restoring modal open state");
          setIsModalOpen(true);
        }
      } catch (error) {
        console.error("❌ Error loading data from localStorage:", error);
      }
    } else {
      console.warn("⚠️ localStorage is not available in this environment");
    }

    setIsLoaded(true);
    console.log("✅ Component loaded");
  }, []); // Empty dependency array - runs only once

  // Save data whenever formData, currentStep, or modal state changes - but NOT on initial load
  useEffect(() => {
    // Don't save during initial load
    if (!isLoaded) return;

    if (isLocalStorageAvailable()) {
      try {
        console.log("💾 Saving data to localStorage...", {
          formData,
          currentStep,
          isModalOpen,
        });
        localStorage.setItem("multiStepFormData", JSON.stringify(formData));
        localStorage.setItem("multiStepFormStep", currentStep.toString());
        localStorage.setItem("multiStepFormModalOpen", isModalOpen.toString());
        console.log("✅ Data saved successfully");
      } catch (error) {
        console.error("❌ Error saving data to localStorage:", error);
      }
    }
  }, [formData, currentStep, isModalOpen, isLoaded]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log("📝 Input changed:", {
      name,
      value: type === "checkbox" ? checked : value,
    });
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      console.log("➡️ Moving to next step:", currentStep + 1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      console.log("⬅️ Moving to previous step:", currentStep - 1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log("📤 Form submitted:", formData);
    alert("Form submitted successfully! Check console for submitted data.");

    // Reset form
    const initialFormData = {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      zipCode: "",
      country: "",
      newsletter: false,
      notifications: false,
      comments: "",
    };

    setFormData(initialFormData);
    setCurrentStep(1);
    setIsModalOpen(false);

    // Clear saved data from localStorage
    if (isLocalStorageAvailable()) {
      try {
        localStorage.removeItem("multiStepFormData");
        localStorage.removeItem("multiStepFormStep");
        localStorage.removeItem("multiStepFormModalOpen");
        console.log("🗑️ Form data cleared from localStorage");
      } catch (error) {
        console.error("❌ Error clearing localStorage:", error);
      }
    }
  };

  const closeModal = () => {
    console.log("❌ Closing modal");
    setIsModalOpen(false);
  };

  const openModal = () => {
    console.log("✅ Opening modal");
    setIsModalOpen(true);
  };

  // Add a manual test function
  const testLocalStorage = () => {
    if (isLocalStorageAvailable()) {
      const testData = { test: "Hello World", timestamp: Date.now() };
      localStorage.setItem("test-key", JSON.stringify(testData));
      const retrieved = JSON.parse(localStorage.getItem("test-key"));
      console.log("🧪 localStorage test:", retrieved);
      alert("localStorage test successful! Check console.");
      localStorage.removeItem("test-key");
    } else {
      alert("localStorage is not available!");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Address Information
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a country</option>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="JP">Japan</option>
                <option value="IN">India</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Preferences & Comments
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Subscribe to newsletter
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notifications"
                  checked={formData.notifications}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Enable email notifications
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Comments
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional information you'd like to share..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 px-4 py-2 border-b border-gray-200 bg-white">
      {/* Trigger Buttons */}
      <div className="text-center space-x-4">
        <button
          onClick={openModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-lg transition-colors duration-200"
        >
          Open Multi-Step Form
        </button>
        <button
          onClick={testLocalStorage}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg shadow-lg transition-colors duration-200"
        >
          Test localStorage
        </button>

        {/* <button
          onClick={clearLocalStorage}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg shadow-lg transition-colors duration-200"
        >
          Clear localStorage
        </button> */}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Registration Form
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Step {currentStep} of 3
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round((currentStep / 3) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6">
              {renderStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className={`px-4 py-2 rounded-md font-medium ${
                    currentStep === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  } transition-colors duration-200`}
                >
                  Previous
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors duration-200"
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
        <h4 className="font-semibold text-sm mb-2">Debug Information:</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>
            <strong>Loaded:</strong> {isLoaded ? "✅ Yes" : "❌ No"}
          </div>
          <div>
            <strong>Current Step:</strong> {currentStep}
          </div>
          <div>
            <strong>Modal Open:</strong> {isModalOpen ? "Yes" : "No"}
          </div>
          <div>
            <strong>localStorage:</strong>
            <span
              className={
                isLocalStorageAvailable() ? "text-green-600" : "text-red-600"
              }
            >
              {isLocalStorageAvailable()
                ? " ✅ Available"
                : " ❌ Not Available"}
            </span>
          </div>
          <div>
            <strong>Has Data:</strong>{" "}
            {Object.values(formData).some((v) => v !== "" && v !== false)
              ? "✅ Yes"
              : "❌ No"}
          </div>
        </div>
        <details className="text-xs mt-2">
          <summary className="cursor-pointer text-gray-700 font-medium">
            Raw localStorage
          </summary>
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
            <div>
              <strong>Data:</strong>{" "}
              {localStorage.getItem("multiStepFormData") || "null"}
            </div>
            <div>
              <strong>Step:</strong>{" "}
              {localStorage.getItem("multiStepFormStep") || "null"}
            </div>
            <div>
              <strong>Modal:</strong>{" "}
              {localStorage.getItem("multiStepFormModalOpen") || "null"}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default MultiStepForm;
