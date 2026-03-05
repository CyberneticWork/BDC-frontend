import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Loader2,
  Heart,
  Baby,
  Shield,
  Clock,
  DollarSign,
} from "lucide-react";
import employeeService from "@services/EmployeeDataService";
import { getUser, setUser } from "../../services/UserService";
import config from "../../config";
import axios from "../../utils/axios";

const apiUrl = config.apiBaseUrl;

const MyProfile = () => {
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEmployeeProfile();
  }, []);

  const loadEmployeeProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = getUser();
      console.log('🔍 User from localStorage:', user);
      
      // If no employee_id in localStorage, fetch fresh user data from API
      if (!user || !user.employee_id) {
        try {
          const { data: freshUser } = await axios.get('/user');
          console.log('🔍 Fresh user from API:', freshUser);
          if (freshUser && freshUser.employee_id) {
            setUser(freshUser);
            const employeeData = await employeeService.fetchEmployeeById(freshUser.employee_id);
            console.log('✅ Employee data loaded:', employeeData);
            setEmployee(employeeData);
            return;
          }
        } catch (apiError) {
          console.error('❌ Error fetching fresh user data:', apiError);
        }
        setError("No employee profile linked to your account. Please contact HR.");
        return;
      }

      console.log('🔍 Fetching employee by ID:', user.employee_id);
      const employeeData = await employeeService.fetchEmployeeById(user.employee_id);
      console.log('✅ Employee data loaded:', employeeData);
      setEmployee(employeeData);
    } catch (e) {
      console.error("❌ Error loading profile:", e);
      setError("Failed to load your profile");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClass =
      status === 1
        ? "bg-green-100 text-green-800 border-green-200"
        : "bg-red-100 text-red-800 border-red-200";
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${statusClass}`}
      >
        {status === 1 ? "Active" : "Inactive"}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeClass =
      type === "PERMANENT"
        ? "bg-blue-100 text-blue-800 border-blue-200"
        : type === "Training"
        ? "bg-orange-100 text-orange-800 border-orange-200"
        : "bg-purple-100 text-purple-800 border-purple-200";
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${typeClass}`}
      >
        {type}
      </span>
    );
  };

  const getMaritalStatusBadge = (status) => {
    const statusClass =
      status === "married"
        ? "bg-pink-100 text-pink-800 border-pink-200"
        : "bg-gray-100 text-gray-800 border-gray-200";
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${statusClass}`}
      >
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "Not specified"}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateAge = (dob) => {
    if (!dob) return "Not specified";
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return `${age} years old`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">
            Loading Your Profile
          </h2>
          <p className="text-gray-600 mt-2">
            Please wait while we fetch your information...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
            <h3 className="font-bold mb-2">Error Loading Profile</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">No employee data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-2xl mb-6 shadow-lg">
          <div className="flex items-center space-x-6">
            <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              {employee.profile_photo_path ? (
                <img
                  src={`${apiUrl}/storage/${employee.profile_photo_path}`}
                  alt="Profile photo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-3xl">
                  {employee.name_with_initials?.charAt(0) || "?"}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{employee.full_name}</h1>
              <p className="text-blue-100 text-lg">{employee.title}</p>
              <p className="text-blue-200">
                {employee.display_name} • {calculateAge(employee.dob)}
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Employee No
              </label>
              <p className="text-gray-900 font-semibold">
                {employee.attendance_employee_no}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Display Name
              </label>
              <p className="text-gray-900 font-semibold">
                {employee.display_name}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Gender
              </label>
              <p className="text-gray-900 font-semibold capitalize">
                {employee.gender}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Date of Birth
              </label>
              <p className="text-gray-900 font-semibold flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                {formatDate(employee.dob)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Religion
              </label>
              <p className="text-gray-900 font-semibold">
                {employee.religion || "Not specified"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Country of Birth
              </label>
              <p className="text-gray-900 font-semibold">
                {employee.country_of_birth || "Not specified"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                NIC Number
              </label>
              <p className="text-gray-900 font-semibold">{employee.nic}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                EPF No
              </label>
              <p className="text-gray-900 font-semibold">{employee.epf}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Marital Status
              </label>
              <div className="mt-2">
                {getMaritalStatusBadge(employee.marital_status)}
              </div>
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-purple-600" />
            Employment Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Employment Type
              </label>
              <div className="mt-2">
                {getTypeBadge(employee.employment_type?.name)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Company
              </label>
              <p className="text-gray-900 font-semibold">
                {employee.organization_assignment?.company?.name}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Department
              </label>
              <p className="text-gray-900 font-semibold">
                {employee.organization_assignment?.department?.name}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Designation
              </label>
              <p className="text-gray-900 font-semibold">
                {employee.organization_assignment?.designation?.name}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Date of Joining
              </label>
              <p className="text-gray-900 font-semibold flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                {formatDate(
                  employee.organization_assignment?.date_of_joining
                )}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Status
              </label>
              <div className="mt-2">{getStatusBadge(employee.is_active)}</div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Phone className="h-5 w-5 mr-2 text-blue-600" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email
              </label>
              <p className="text-gray-900 font-semibold flex items-center">
                <Mail className="h-4 w-4 mr-1 text-gray-500" />
                {employee.contact_detail?.email || "Not provided"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Mobile
              </label>
              <p className="text-gray-900 font-semibold flex items-center">
                <Phone className="h-4 w-4 mr-1 text-gray-500" />
                {employee.contact_detail?.mobile_line || "Not provided"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Land Line
              </label>
              <p className="text-gray-900 font-semibold">
                {employee.contact_detail?.land_line || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-green-600" />
            Address Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Permanent Address
              </label>
              <p className="text-gray-900 font-semibold">
                {employee.contact_detail?.permanent_address || "Not provided"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Temporary Address
              </label>
              <p className="text-gray-900 font-semibold">
                {employee.contact_detail?.temporary_address || "Not provided"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Province
              </label>
              <p className="text-gray-900 font-semibold">
                {employee.contact_detail?.province || "Not specified"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                District
              </label>
              <p className="text-gray-900 font-semibold">
                {employee.contact_detail?.district || "Not specified"}
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-red-600" />
            Emergency Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <label className="block text-sm font-medium text-red-800 mb-1">
                Name
              </label>
              <p className="text-red-900 font-semibold">
                {employee.contact_detail?.emg_name || "Not specified"}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <label className="block text-sm font-medium text-red-800 mb-1">
                Relationship
              </label>
              <p className="text-red-900 font-semibold">
                {employee.contact_detail?.emg_relationship || "Not specified"}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <label className="block text-sm font-medium text-red-800 mb-1">
                Contact Number
              </label>
              <p className="text-red-900 font-semibold">
                {employee.contact_detail?.emg_tel || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Family Information */}
        {(employee.spouse || employee.children?.length > 0) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Heart className="h-5 w-5 mr-2 text-pink-600" />
              Family Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {employee.spouse && (
                <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                  <label className="block text-sm font-medium text-pink-800 mb-2">
                    Spouse Information
                  </label>
                  <p className="text-pink-700 font-semibold">
                    {employee.spouse.title} {employee.spouse.name}
                  </p>
                  <p className="text-sm text-pink-600">
                    Age: {employee.spouse.age} years
                  </p>
                  <p className="text-sm text-pink-600">
                    DOB: {formatDate(employee.spouse.dob)}
                  </p>
                </div>
              )}
              {employee.children?.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                    <Baby className="h-4 w-4 mr-1" />
                    Children ({employee.children.length})
                  </label>
                  <div className="space-y-2">
                    {employee.children.map((child, index) => (
                      <div key={child.id} className="text-sm">
                        <p className="text-blue-700 font-semibold">
                          {index + 1}. {child.name}
                        </p>
                        <p className="text-blue-600">
                          Age: {child.age} years • DOB: {formatDate(child.dob)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compensation Information */}
        {employee.compensation && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Compensation Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <label className="block text-sm font-medium text-green-800 mb-1">
                  Basic Salary
                </label>
                <p className="text-green-900 font-semibold">
                  Rs. {employee.compensation.basic_salary}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <label className="block text-sm font-medium text-green-800 mb-1">
                  Bank Name
                </label>
                <p className="text-green-900 font-semibold">
                  {employee.compensation.bank_name || "Not specified"}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <label className="block text-sm font-medium text-green-800 mb-1">
                  Account Number
                </label>
                <p className="text-green-900 font-semibold">
                  {employee.compensation.bank_account_no || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
