import React from "react";
import {
  MapPin,
  Phone,
  Mail,
  User,
  Building,
  Globe,
  Shield,
} from "lucide-react";
import { useEmployeeForm } from "@contexts/EmployeeFormContext";
import ErrorDisplay from "@components/ErrorMessage/ErrorDisplay";
import FieldError from "@components/ErrorMessage/FieldError";

const provinceData = {
  Provinces: [
    {
      name: "Central Province",
      districts: ["Kandy", "Matale", "Nuwara Eliya"],
    },
    {
      name: "Eastern Province",
      districts: ["Ampara", "Batticaloa", "Trincomalee"],
    },
    {
      name: "Northern Province",
      districts: ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"],
    },
    {
      name: "North Central Province",
      districts: ["Anuradhapura", "Polonnaruwa"],
    },
    {
      name: "North Western Province",
      districts: ["Kurunegala", "Puttalam"],
    },
    {
      name: "Sabaragamuwa Province",
      districts: ["Kegalle", "Ratnapura"],
    },
    {
      name: "Southern Province",
      districts: ["Galle", "Matara", "Hambantota"],
    },
    {
      name: "Uva Province",
      districts: ["Badulla", "Monaragala"],
    },
    {
      name: "Western Province",
      districts: ["Colombo", "Gampaha", "Kalutara"],
    },
  ],
};

const AddressDetails = ({ onNext, onPrevious, activeCategory }) => {
  const { formData, updateFormData, errors, clearFieldError } =
    useEmployeeForm();

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Clear error for this field when user makes changes
    if (errors.address?.[name]) {
      clearFieldError("address", name);
    }

    // If province is changed, reset the district
    if (name === "province") {
      updateFormData("address", {
        [name]: value,
        district: "", // Reset district when province changes
      });
    } else {
      updateFormData("address", { [name]: value });
    }
  };

  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target;

    // Clear error for this nested field - this should work
    if (errors.address?.emergencyContact?.[name]) {
      clearFieldError("address", `emergencyContact.${name}`);
    }

    updateFormData("address", {
      emergencyContact: {
        ...formData.address.emergencyContact,
        [name]: value,
      },
    });
  };

  // Get districts based on selected province
  const getDistrictsForProvince = () => {
    if (!formData.address.province) return [];

    const selectedProvince = provinceData.Provinces.find(
      (province) => province.name === formData.address.province
    );

    return selectedProvince ? selectedProvince.districts : [];
  };

  return (
    <div
      id="address"
      className="bg-white rounded-2xl shadow-xl overflow-hidden"
    >
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-xl">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Address And Contact Details
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Personal Address */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Personal Information
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Permanent Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="permanentAddress"
                    value={formData.address.permanentAddress}
                    onChange={handleChange}
                    rows="3"
                    className={`w-full border ${
                      errors.address?.permanentAddress
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none`}
                    placeholder="Enter permanent address"
                  />
                  <FieldError error={errors.address?.permanentAddress} />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Temporary Address
                  </label>
                  <textarea
                    name="temporaryAddress"
                    value={formData.address.temporaryAddress}
                    onChange={handleChange}
                    rows="3"
                    className={`w-full border ${
                      errors.address?.temporaryAddress
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none`}
                    placeholder="Enter temporary address"
                  />
                  <FieldError error={errors.address?.temporaryAddress} />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-600" />
                Contact Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      name="email"
                      type="email"
                      value={formData.address.email}
                      onChange={handleChange}
                      className={`w-full border ${
                        errors.address?.email
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      placeholder="Enter email address"
                    />
                  </div>
                  <FieldError error={errors.address?.email} />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Land Line
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      name="landLine"
                      value={formData.address.landLine}
                      onChange={(e) => {
                        // Allow only numbers and limit to 10 digits
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        handleChange({
                          target: {
                            name: "landLine",
                            value: value,
                          },
                        });
                      }}
                      className={`w-full border ${
                        errors.address?.landLine
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      placeholder="Enter land line number"
                    />
                  </div>
                  <FieldError error={errors.address?.landLine} />
                  {formData.address.landLine &&
                    formData.address.landLine.length !== 10 && (
                      <p className="text-red-500 text-xs mt-1">
                        Land line must be 10 digits
                      </p>
                    )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Mobile Line <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      name="mobileLine"
                      value={formData.address.mobileLine}
                      onChange={(e) => {
                        // Allow only numbers and limit to 10 digits
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        handleChange({
                          target: {
                            name: "mobileLine",
                            value: value,
                          },
                        });
                      }}
                      className={`w-full border ${
                        errors.address?.mobileLine
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <FieldError error={errors.address?.mobileLine} />
                  {formData.address.mobileLine &&
                    formData.address.mobileLine.length !== 10 && (
                      <p className="text-red-500 text-xs mt-1">
                        Mobile number must be 10 digits
                      </p>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Location & Emergency */}
          <div className="space-y-6">
            {/* Location Details */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-600" />
                Location Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="province"
                    value={formData.address.province}
                    onChange={handleChange}
                    className={`w-full border ${
                      errors.address?.province
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white`}
                  >
                    <option value="">Select Province</option>
                    {provinceData.Provinces.map((province, index) => (
                      <option key={index} value={province.name}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                  <FieldError error={errors.address?.province} />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Electoral Division
                  </label>
                  <input
                    name="electoralDivision"
                    value={formData.address.electoralDivision}
                    onChange={handleChange}
                    className={`w-full border ${
                      errors.address?.electoralDivision
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="Enter electoral division"
                  />
                  <FieldError error={errors.address?.electoralDivision} />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    GN Division
                  </label>
                  <input
                    name="gnDivision"
                    value={formData.address.gnDivision}
                    onChange={handleChange}
                    className={`w-full border ${
                      errors.address?.gnDivision
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="Enter GN division"
                  />
                  <FieldError error={errors.address?.gnDivision} />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Police Station
                  </label>
                  <input
                    name="policeStation"
                    value={formData.address.policeStation}
                    onChange={handleChange}
                    className={`w-full border ${
                      errors.address?.policeStation
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="Enter police station"
                  />
                  <FieldError error={errors.address?.policeStation} />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="district"
                    value={formData.address.district}
                    onChange={handleChange}
                    disabled={!formData.address.province}
                    className={`w-full border ${
                      errors.address?.district
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white ${
                      !formData.address.province
                        ? "opacity-70 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <option value="">Select District</option>
                    {getDistrictsForProvince().map((district, index) => (
                      <option key={index} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                  <FieldError error={errors.address?.district} />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Emergency Contact
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="relationship"
                    value={formData.address.emergencyContact.relationship}
                    onChange={handleEmergencyContactChange}
                    className={`w-full border ${
                      errors.address?.emergencyContact?.relationship
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white`}
                  >
                    <option value="">Select Relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                  </select>
                  <FieldError
                    error={errors.address?.emergencyContact?.relationship}
                    
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="contactName"
                    value={formData.address.emergencyContact.contactName}
                    onChange={handleEmergencyContactChange}
                    className={`w-full border ${
                      errors.address?.emergencyContact?.contactName
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="Enter contact name"
                  />
                  <FieldError
                    error={errors.address?.emergencyContact?.contactName}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="contactAddress"
                    value={formData.address.emergencyContact.contactAddress}
                    onChange={handleEmergencyContactChange}
                    rows="2"
                    className={`w-full border ${
                      errors.address?.emergencyContact?.contactAddress
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none`}
                    placeholder="Enter contact address"
                  />
                  <FieldError
                    error={errors.address?.emergencyContact?.contactAddress}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Tel <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      name="contactTel"
                      value={formData.address.emergencyContact.contactTel}
                      onChange={(e) => {
                        // Allow only numbers and limit to 10 digits
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        handleEmergencyContactChange({
                          target: {
                            name: "contactTel",
                            value: value,
                          },
                        });
                      }}
                      className={`w-full border ${
                        errors.address?.emergencyContact?.contactTel
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      placeholder="Enter contact telephone"
                    />
                  </div>
                  <FieldError
                    error={errors.address?.emergencyContact?.contactTel}
                  />
                  {formData.address.emergencyContact.contactTel &&
                    formData.address.emergencyContact.contactTel.length !==
                      10 && (
                      <p className="text-red-500 text-xs mt-1">
                        Contact number must be 10 digits
                      </p>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={onPrevious}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressDetails;
