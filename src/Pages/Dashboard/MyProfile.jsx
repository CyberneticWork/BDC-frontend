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
  CheckCircle,
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

    // Listen for employee updates
    const handleEmployeeUpdate = () => {
      loadEmployeeProfile();
    };

    window.addEventListener('employeeUpdated', handleEmployeeUpdate);

    return () => {
      window.removeEventListener('employeeUpdated', handleEmployeeUpdate);
    };
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Profile Picture */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8 rounded-3xl mb-6 shadow-2xl overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
            {/* Profile Picture with Animation */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-white/50 shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                {employee.profile_photo_path ? (
                  <img
                    src={`${apiUrl}/storage/${employee.profile_photo_path}`}
                    alt="Profile photo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-5xl">
                    {employee.name_with_initials?.charAt(0) || "?"}
                  </span>
                )}
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                {employee.full_name}
              </h1>
              <p className="text-xl text-blue-100 mb-2">{employee.title}</p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30">
                  {employee.display_name}
                </span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30">
                  {calculateAge(employee.dob)}
                </span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30">
                  {employee.attendance_employee_no}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Department</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {employee.organization_assignment?.department?.name?.substring(0, 10) || "N/A"}
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Designation</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {employee.organization_assignment?.designation?.name?.substring(0, 10) || "N/A"}
                </p>
              </div>
              <User className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Status</p>
                <p className="text-lg font-bold text-green-600 mt-1">
                  {employee.is_active === 1 ? "Active" : "Inactive"}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Joined</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {new Date(employee.organization_assignment?.date_of_joining).getFullYear() || "N/A"}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 border border-gray-100 hover:shadow-2xl transition-shadow">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 ml-4">Basic Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-blue-700 mb-2">
                Employee No
              </label>
              <p className="text-gray-900 font-bold text-lg">
                {employee.attendance_employee_no}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-purple-700 mb-2">
                Display Name
              </label>
              <p className="text-gray-900 font-bold text-lg">
                {employee.display_name}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-indigo-700 mb-2">
                Gender
              </label>
              <p className="text-gray-900 font-bold text-lg capitalize">
                {employee.gender}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-green-700 mb-2">
                Date of Birth
              </label>
              <p className="text-gray-900 font-bold text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                {formatDate(employee.dob)}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-yellow-700 mb-2">
                Religion
              </label>
              <p className="text-gray-900 font-bold text-lg">
                {employee.religion || "Not specified"}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-indigo-700 mb-2">
                Country of Birth
              </label>
              <p className="text-gray-900 font-bold text-lg">
                {employee.country_of_birth || "Not specified"}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-red-700 mb-2">
                NIC Number
              </label>
              <p className="text-gray-900 font-bold text-lg">{employee.nic}</p>
            </div>
            <div className="group bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-teal-700 mb-2">
                EPF No
              </label>
              <p className="text-gray-900 font-bold text-lg">{employee.epf}</p>
            </div>
            <div className="group bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-orange-700 mb-2">
                Marital Status
              </label>
              <div className="mt-2">
                {getMaritalStatusBadge(employee.marital_status)}
              </div>
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 border border-gray-100 hover:shadow-2xl transition-shadow">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 ml-4">Employment Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-purple-700 mb-2">
                Employment Type
              </label>
              <div className="mt-2">
                {getTypeBadge(employee.employment_type?.name)}
              </div>
            </div>
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-blue-700 mb-2">
                Company
              </label>
              <p className="text-gray-900 font-bold text-lg">
                {employee.organization_assignment?.company?.name}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-green-700 mb-2">
                Department
              </label>
              <p className="text-gray-900 font-bold text-lg">
                {employee.organization_assignment?.department?.name}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-yellow-700 mb-2">
                Designation
              </label>
              <p className="text-gray-900 font-bold text-lg">
                {employee.organization_assignment?.designation?.name}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-indigo-700 mb-2">
                Date of Joining
              </label>
              <p className="text-gray-900 font-bold text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                {formatDate(
                  employee.organization_assignment?.date_of_joining
                )}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-teal-700 mb-2">
                Status
              </label>
              <div className="mt-2">{getStatusBadge(employee.is_active)}</div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 border border-gray-100 hover:shadow-2xl transition-shadow">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
              <Phone className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 ml-4">Contact Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-blue-700 mb-2">
                Email
              </label>
              <p className="text-gray-900 font-bold text-lg flex items-center break-all">
                <Mail className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                {employee.contact_detail?.email || "Not provided"}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-green-700 mb-2">
                Mobile
              </label>
              <p className="text-gray-900 font-bold text-lg flex items-center">
                <Phone className="h-5 w-5 mr-2 text-green-600" />
                {employee.contact_detail?.mobile_line || "Not provided"}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-purple-700 mb-2">
                Land Line
              </label>
              <p className="text-gray-900 font-bold text-lg">
                {employee.contact_detail?.land_line || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 border border-gray-100 hover:shadow-2xl transition-shadow">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 ml-4">Address Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-green-700 mb-2">
                Permanent Address
              </label>
              <p className="text-gray-900 font-bold text-lg">
                {employee.contact_detail?.permanent_address || "Not provided"}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-teal-700 mb-2">
                Temporary Address
              </label>
              <p className="text-gray-900 font-bold text-lg">
                {employee.contact_detail?.temporary_address || "Not provided"}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-blue-700 mb-2">
                Province
              </label>
              <p className="text-gray-900 font-bold text-lg">
                {employee.contact_detail?.province || "Not specified"}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-indigo-700 mb-2">
                District
              </label>
              <p className="text-gray-900 font-bold text-lg">
                {employee.contact_detail?.district || "Not specified"}
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-3xl shadow-xl p-8 mb-6 border-2 border-red-200 hover:shadow-2xl transition-shadow">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-red-800 ml-4">Emergency Contact</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl border-2 border-red-300 hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-red-800 mb-2">
                Name
              </label>
              <p className="text-red-900 font-bold text-lg">
                {employee.contact_detail?.emg_name || "Not specified"}
              </p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl border-2 border-red-300 hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-red-800 mb-2">
                Relationship
              </label>
              <p className="text-red-900 font-bold text-lg">
                {employee.contact_detail?.emg_relationship || "Not specified"}
              </p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl border-2 border-red-300 hover:shadow-lg transition-all transform hover:-translate-y-1">
              <label className="block text-sm font-semibold text-red-800 mb-2">
                Contact Number
              </label>
              <p className="text-red-900 font-bold text-lg">
                {employee.contact_detail?.emg_tel || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Family Information */}
        {(employee.spouse || employee.children?.length > 0) && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl shadow-xl p-8 mb-6 border-2 border-blue-200 hover:shadow-2xl transition-shadow">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-blue-800 ml-4">Family Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {employee.spouse && (
                <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border-2 border-blue-300 hover:shadow-lg transition-all transform hover:-translate-y-1">
                  <div className="flex items-center mb-3">
                    <Heart className="h-5 w-5 text-blue-600 mr-2" />
                    <label className="text-sm font-bold text-blue-800">
                      Spouse Information
                    </label>
                  </div>
                  <p className="text-blue-900 font-bold text-xl mb-2">
                    {employee.spouse.title} {employee.spouse.name}
                  </p>
                  <p className="text-sm text-blue-700 font-semibold">
                    Age: {employee.spouse.age} years
                  </p>
                  <p className="text-sm text-blue-700 font-semibold">
                    DOB: {formatDate(employee.spouse.dob)}
                  </p>
                </div>
              )}
              {employee.children?.length > 0 && (
                <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border-2 border-indigo-300 hover:shadow-lg transition-all transform hover:-translate-y-1">
                  <div className="flex items-center mb-3">
                    <Baby className="h-5 w-5 text-indigo-600 mr-2" />
                    <label className="text-sm font-bold text-indigo-800">
                      Children ({employee.children.length})
                    </label>
                  </div>
                  <div className="space-y-3">
                    {employee.children.map((child, index) => (
                      <div key={child.id} className="bg-indigo-50/50 p-3 rounded-xl">
                        <p className="text-indigo-900 font-bold text-lg">
                          {index + 1}. {child.name}
                        </p>
                        <p className="text-indigo-700 text-sm font-semibold">
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
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl shadow-xl p-8 border-2 border-green-200 hover:shadow-2xl transition-shadow">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-green-800 ml-4">Compensation Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border-2 border-green-300 hover:shadow-lg transition-all transform hover:-translate-y-1">
                <label className="block text-sm font-semibold text-green-800 mb-2">
                  Basic Salary
                </label>
                <p className="text-green-900 font-bold text-2xl">
                  Rs. {employee.compensation.basic_salary?.toLocaleString()}
                </p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border-2 border-green-300 hover:shadow-lg transition-all transform hover:-translate-y-1">
                <label className="block text-sm font-semibold text-green-800 mb-2">
                  Bank Name
                </label>
                <p className="text-green-900 font-bold text-lg">
                  {employee.compensation.bank_name || "Not specified"}
                </p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border-2 border-green-300 hover:shadow-lg transition-all transform hover:-translate-y-1">
                <label className="block text-sm font-semibold text-green-800 mb-2">
                  Account Number
                </label>
                <p className="text-green-900 font-bold text-lg">
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
