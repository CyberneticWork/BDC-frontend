import React from 'react';
import { User, MapPin, CreditCard, Building, Phone, Heart, Check, Edit } from 'lucide-react';
import { useEmployeeForm } from '@contexts/EmployeeFormContext';

const EmployeeConfirmationModal = ({ onPrevious, onSubmit }) => {
  const { formData } = useEmployeeForm();

  const formatDate = (dateString) => {
    if (!dateString || dateString === "1/1/1900") return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatBoolean = (value) => {
    return value ? 'Yes' : 'No';
  };

  const formatEmploymentStatus = (status) => {
    const statusMap = {
      'probationPeriod': 'Probation Period',
      'trainingPeriod': 'Training Period',
      'contractPeriod': 'Contract Period',
      'Active': 'Active',
      'Inactive': 'Inactive'
    };
    return statusMap[status] || status;
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Employee Information</h1>
                <p className="text-blue-100 mt-1">Complete employee profile and details</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-100 p-2 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Title</label>
                  <p className="text-gray-800 font-medium mt-1">{formData.personal.title || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Attendance Employee No</label>
                  <p className="text-gray-800 font-medium mt-1">{formData.personal.attendanceEmpNo || 'Not specified'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">EPF No</label>
                  <p className="text-gray-800 mt-1">{formData.personal.epfNo || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">NIC Number</label>
                  <p className="text-gray-800 mt-1">{formData.personal.nicNumber || 'Not specified'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                  <p className="text-gray-800 mt-1">{formatDate(formData.personal.dob)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Gender</label>
                  <p className="text-gray-800 mt-1">{formData.personal.gender || 'Not specified'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Religion</label>
                  <p className="text-gray-800 mt-1">{formData.personal.religion || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Country of Birth</label>
                  <p className="text-gray-800 mt-1">{formData.personal.countryOfBirth || 'Not specified'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name with Initial</label>
                  <p className="text-gray-800 mt-1">{formData.personal.nameWithInitial || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-gray-800 mt-1">{formData.personal.fullName || 'Not specified'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Marital Status</label>
                  <p className="text-gray-800 mt-1">{formData.personal.maritalStatus || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Employment Status</label>
                  <p className="text-gray-800 mt-1">{formatEmploymentStatus(formData.personal.employmentStatus) || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Family Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-red-100 p-2 rounded-lg">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Family Information</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Spouse Name</label>
                  <p className="text-gray-800 mt-1">{formData.personal.spouseName || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Spouse NIC</label>
                  <p className="text-gray-800 mt-1">{formData.personal.spouseNic || 'Not specified'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Spouse Age</label>
                  <p className="text-gray-800 mt-1">{formData.personal.spouseAge || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Spouse Date of Birth</label>
                  <p className="text-gray-800 mt-1">{formatDate(formData.personal.spouseDob)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Children</label>
                {formData.personal.children && formData.personal.children.length > 0 && formData.personal.children[0].name ? (
                  <div className="mt-2 space-y-2">
                    {formData.personal.children.map((child, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium text-gray-800">{child.name || 'No name specified'}</p>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <p className="text-sm text-gray-600">Age: {child.age || 'Not specified'}</p>
                          <p className="text-sm text-gray-600">DOB: {formatDate(child.dob)}</p>
                          <p className="text-sm text-gray-600">NIC: {child.nic || 'Not specified'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mt-1">No children specified</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-green-100 p-2 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Contact Information</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Mobile Number</label>
                  <p className="text-gray-800 mt-1">{formData.address.mobileLine || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Landline</label>
                  <p className="text-gray-800 mt-1">{formData.address.landLine || 'Not specified'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email Address</label>
                <p className="text-gray-800 mt-1">{formData.address.email || 'Not specified'}</p>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-medium text-gray-700 mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-gray-800 mt-1">{formData.address.emergencyContact.contactName || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Relationship</label>
                    <p className="text-gray-800 mt-1">{formData.address.emergencyContact.relationship || 'Not specified'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Contact Number</label>
                    <p className="text-gray-800 mt-1">{formData.address.emergencyContact.contactTel || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <p className="text-gray-800 mt-1">{formData.address.emergencyContact.contactAddress || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-purple-100 p-2 rounded-lg">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Address Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Permanent Address</label>
                <p className="text-gray-800 mt-1">{formData.address.permanentAddress || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Temporary Address</label>
                <p className="text-gray-800 mt-1">{formData.address.temporaryAddress || 'Not specified'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">GN Division</label>
                  <p className="text-gray-800 mt-1">{formData.address.gnDivision || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Police Station</label>
                  <p className="text-gray-800 mt-1">{formData.address.policeStation || 'Not specified'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">District</label>
                  <p className="text-gray-800 mt-1">{formData.address.district || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Province</label>
                  <p className="text-gray-800 mt-1">{formData.address.province || 'Not specified'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Electoral Division</label>
                  <p className="text-gray-800 mt-1">{formData.address.electoralDivision || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Building className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Employment Information</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Company</label>
                  <p className="text-gray-800 mt-1">{formData.organization.company || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Department</label>
                  <p className="text-gray-800 mt-1">{formData.organization.department || 'Not specified'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Sub Department</label>
                  <p className="text-gray-800 mt-1">{formData.organization.subDepartment || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Designation</label>
                  <p className="text-gray-800 mt-1">{formData.organization.designation || 'Not specified'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Supervisor</label>
                  <p className="text-gray-800 mt-1">{formData.organization.currentSupervisor || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date of Joined</label>
                  <p className="text-gray-800 mt-1">{formatDate(formData.organization.dateOfJoined)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Day Off</label>
                  <p className="text-gray-800 mt-1">{formData.organization.dayOff || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Status</label>
                  <p className="text-gray-800 mt-1">{formatEmploymentStatus(formData.organization.currentStatus)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Probation Period</label>
                  <p className="text-gray-800 mt-1">{formatBoolean(formData.organization.probationPeriod)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Training Period</label>
                  <p className="text-gray-800 mt-1">{formatBoolean(formData.organization.trainingPeriod)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Contract Period</label>
                  <p className="text-gray-800 mt-1">{formatBoolean(formData.organization.contractPeriod)}</p>
                </div>
              </div>
              {formData.organization.probationPeriod && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Probation From</label>
                    <p className="text-gray-800 mt-1">{formatDate(formData.organization.probationFrom)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Probation To</label>
                    <p className="text-gray-800 mt-1">{formatDate(formData.organization.probationTo)}</p>
                  </div>
                </div>
              )}
              {formData.organization.trainingPeriod && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Training From</label>
                    <p className="text-gray-800 mt-1">{formatDate(formData.organization.trainingFrom)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Training To</label>
                    <p className="text-gray-800 mt-1">{formatDate(formData.organization.trainingTo)}</p>
                  </div>
                </div>
              )}
              {formData.organization.contractPeriod && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Contract From</label>
                    <p className="text-gray-800 mt-1">{formatDate(formData.organization.contractFrom)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Contract To</label>
                    <p className="text-gray-800 mt-1">{formatDate(formData.organization.contractTo)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compensation & Bank Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <CreditCard className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Compensation & Bank Information</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Basic Salary</label>
                  <p className="text-gray-800 mt-1">{formData.compensation.basicSalary ? `Rs. ${formData.compensation.basicSalary}` : 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Increment Value</label>
                  <p className="text-gray-800 mt-1">{formData.compensation.incrementValue ? `Rs. ${formData.compensation.incrementValue}` : 'Not specified'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Increment Effective From</label>
                  <p className="text-gray-800 mt-1">{formatDate(formData.compensation.incrementEffectiveFrom)}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-md font-medium text-gray-700 mb-3">Bank Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Bank Name</label>
                    <p className="text-gray-800 mt-1">{formData.compensation.bankName || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Branch Name</label>
                    <p className="text-gray-800 mt-1">{formData.compensation.branchName || 'Not specified'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Bank Code</label>
                    <p className="text-gray-800 mt-1">{formData.compensation.bankCode || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Branch Code</label>
                    <p className="text-gray-800 mt-1">{formData.compensation.branchCode || 'Not specified'}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-sm font-medium text-gray-600">Account Number</label>
                  <p className="text-gray-800 mt-1">{formData.compensation.bankAccountNo || 'Not specified'}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-md font-medium text-gray-700 mb-3">Additional Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Enable EPF/ETF</label>
                    <p className="text-gray-800 mt-1">{formatBoolean(formData.compensation.enableEpfEtf)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">OT Active</label>
                    <p className="text-gray-800 mt-1">{formatBoolean(formData.compensation.otActive)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Primary Employment Basic</label>
                    <p className="text-gray-800 mt-1">{formatBoolean(formData.compensation.primaryEmploymentBasic)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Secondary Employee</label>
                    <p className="text-gray-800 mt-1">{formatBoolean(formData.compensation.secondaryEmp)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={onPrevious}
            className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg transition duration-200 flex items-center space-x-2"
          >
            <Edit className="w-5 h-5" />
            <span>Edit Information</span>
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition duration-200 flex items-center space-x-2"
          >
            <Check className="w-5 h-5" />
            <span>Confirm & Submit</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeConfirmationModal;