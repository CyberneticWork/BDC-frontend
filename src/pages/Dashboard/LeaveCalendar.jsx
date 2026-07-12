import React, { useState, useEffect } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  CheckCircle,
  Users,
  FileText,
  Trash2,
  Edit3,
  Search,
  Building2,
  Layers,
  Loader2,
} from "lucide-react";
import {
  fetchLeaveCalendar,
  createLeaveEntry,
  updateLeaveEntry,
  deleteLeaveEntry,
} from "@services/LeaveCalendar";
import { getAllLeaves } from "@services/LeaveMaster";
import { fetchCompanies, fetchDepartmentsById } from "@services/ApiDataService";
import Swal from "sweetalert2";

const LeaveCalendar = ({ employeeProfile }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [description, setDescription] = useState("");
  const [leaveType, setLeaveType] = useState("Annual");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customLeaveType, setCustomLeaveType] = useState("");

  // New state for company and department filters
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-select company and department for logged-in employee
  useEffect(() => {
    if (employeeProfile?.organization_assignment) {
      const companyId = employeeProfile.organization_assignment.company?.id;
      const departmentId = employeeProfile.organization_assignment.department?.id;
      
      if (companyId) {
        setSelectedCompany(companyId.toString());
        
        // Load departments for the company
        if (departmentId) {
          fetchDepartmentsById(companyId)
            .then(depts => {
              setDepartments(depts);
              setSelectedDepartment(departmentId.toString());
            })
            .catch(err => console.error('Error loading departments:', err));
        }
      }
    }
  }, [employeeProfile]);

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Fetch companies and leave data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Only fetch companies initially
        const companiesData = await fetchCompanies();
        setCompanies(companiesData);
      } catch (error) {
        console.error("Error loading companies:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load companies. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Fetch departments when company is selected
  useEffect(() => {
    const loadDepartments = async () => {
      if (selectedCompany) {
        try {
          const departmentsData = await fetchDepartmentsById(selectedCompany);
          setDepartments(departmentsData);
          setSelectedDepartment(""); // Reset department selection
        } catch (error) {
          console.error("Error loading departments:", error);
        }
      } else {
        setDepartments([]);
        setSelectedDepartment("");
      }
    };

    loadDepartments();
  }, [selectedCompany]);

  // Load leave data function
  const loadLeaveData = async () => {
    if (selectedCompany) {
        setIsLoading(true);
        try {
          // Fetch both calendar events and employee leave requests
          const [leaveData, employeeLeaves] = await Promise.all([
            fetchLeaveCalendar(),
            getAllLeaves()
          ]);

          // Filter calendar leaves based on selection
          const filteredLeaves = leaveData.filter((leave) => {
            if (selectedDepartment) {
              return (
                leave.company_id == selectedCompany &&
                (leave.department_id == null ||
                  leave.department_id == selectedDepartment)
              );
            } else {
              return (
                leave.company_id == selectedCompany &&
                leave.department_id == null
              );
            }
          });

          // Transform calendar leave data
          const formattedLeaveData = filteredLeaves.map((leave) => {
            const dateRange = generateDateRange(
              leave.start_date,
              leave.end_date || leave.start_date
            );
            return {
              id: leave.id,
              dates: dateRange,
              startDate: leave.start_date,
              endDate: leave.end_date || leave.start_date,
              description: leave.reason || "",
              type: leave.leave_type,
              status: "Approved",
              duration: dateRange.length,
              company_id: leave.company_id,
              department_id: leave.department_id,
              isCalendarEvent: true,
            };
          });

          // Transform approved employee leave requests
          const approvedEmployeeLeaves = employeeLeaves
            .filter(leave => 
              (leave.status === 'approved' || leave.status === 'hr-approved' || leave.status === 'Approved')
            )
            .map((leave) => {
              let dateRange = [];
              if (leave.leave_date) {
                dateRange = [leave.leave_date];
              } else if (leave.leave_from && leave.leave_to) {
                dateRange = generateDateRange(leave.leave_from, leave.leave_to);
              }
              
              return {
                id: `emp-${leave.id}`,
                dates: dateRange,
                startDate: leave.leave_date || leave.leave_from,
                endDate: leave.leave_date || leave.leave_to,
                description: leave.reason || "Employee Leave",
                type: leave.leave_type || "Leave",
                status: "Approved",
                duration: leave.leave_duration || dateRange.length,
                employeeName: leave.employee?.name_with_initials || "Employee",
                isEmployeeLeave: true,
              };
            });

          // Combine both calendar events and employee leaves
          setLeaveRequests([...formattedLeaveData, ...approvedEmployeeLeaves]);
        } catch (error) {
          console.error("Error loading leave data:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to load leave calendar data. Please try again later.",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setLeaveRequests([]);
      }
  };

  // Load data when company/department changes and set up auto-refresh
  useEffect(() => {
    if (selectedCompany) {
      loadLeaveData();
      
      const intervalId = setInterval(() => {
        loadLeaveData();
      }, 30000);
      
      // Listen for leave submission events
      const handleLeaveSubmitted = () => {
        loadLeaveData();
      };
      
      window.addEventListener('leaveSubmitted', handleLeaveSubmitted);
      
      return () => {
        clearInterval(intervalId);
        window.removeEventListener('leaveSubmitted', handleLeaveSubmitted);
      };
    } else {
      setLeaveRequests([]);
    }
  }, [selectedCompany, selectedDepartment]);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const leaveTypes = [
    {
      value: "Annual",
      color: "bg-blue-500",
      lightColor: "bg-blue-100",
      textColor: "text-blue-800",
    },
    {
      value: "Event",
      color: "bg-red-500",
      lightColor: "bg-red-100",
      textColor: "text-red-800",
    },
    {
      value: "Personal",
      color: "bg-green-500",
      lightColor: "bg-green-100",
      textColor: "text-green-800",
    },
    {
      value: "Emergency",
      color: "bg-orange-500",
      lightColor: "bg-orange-100",
      textColor: "text-orange-800",
    },
    {
      value: "Maternity",
      color: "bg-purple-500",
      lightColor: "bg-purple-100",
      textColor: "text-purple-800",
    },

    {
      value: "Poya Day",
      color: "bg-orange-500",
      lightColor: "bg-orange-100",
      textColor: "text-orange-800",
    },

    {
      value: "Mercantile Holiday",
      color: "bg-green-500",
      lightColor: "bg-green-100",
      textColor: "text-green-800",
    },

     {
      value: "Saterday Holiday",
      color: "bg-yellow-500",
      lightColor: "bg-yellow-100",
      textColor: "text-yellow-800",
    },

    {
      value: "Sunday Holiday",
      color: "bg-pink-500",
      lightColor: "bg-pink-100",
      textColor: "text-pink-800",
    },


    {
      value: "Other",
      color: "bg-gray-500",
      lightColor: "bg-gray-100",
      textColor: "text-gray-800",
    },
    
  ];

  const getEmployeeLeaveColor = () => ({
    color: "bg-gradient-to-br from-teal-500 to-cyan-600",
    lightColor: "bg-teal-50",
    textColor: "text-teal-800",
    borderColor: "border-teal-300",
  });

  // Get number of days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  // Check if a date is selected

  const getSelectedLeave = (day) => {
    if (!day) return null;
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

    return leaveRequests.find(
      (req) => req.dates && req.dates.includes(dateString)
    );
  };

  // Generate date range
  const generateDateRange = (start, end) => {
    const dates = [];
    const startDate = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T00:00:00");

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
      dates.push(dateString);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  // Handle day click
  const handleDayClick = (day) => {
    if (!day) return;

    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

    // Check if selected date is in the past
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      Swal.fire({
        title: "Invalid Date",
        text: "You cannot select past dates for leave requests",
        icon: "warning",
      });
      return;
    }

    const existingLeave = leaveRequests.find(
      (req) => req.dates && req.dates.includes(dateString)
    );

    if (existingLeave) {
      // Show confirmation before removing
      Swal.fire({
        title: "Remove Leave Request?",
        text: "Do you want to remove this leave request?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, remove it",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          deleteLeaveEntry(existingLeave.id)
            .then(() => {
              // Remove all dates from this leave request
              setLeaveRequests((prev) =>
                prev.filter((req) => req.id !== existingLeave.id)
              );

              Swal.fire({
                title: "Deleted!",
                text: "Leave request has been removed.",
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
              });
              
              // Immediately refresh leave data
              loadLeaveData();
            })
            .catch(() => {
              Swal.fire({
                title: "Error",
                text: "Failed to delete leave request.",
                icon: "error",
              });
            });
        }
      });
    } else {
      // Only require company selection
      if (!selectedCompany) {
        Swal.fire({
          title: "Company Required",
          text: "Please select a company before adding a leave request",
          icon: "warning",
        });
        return;
      }

      // Show modal to add new leave request
      setStartDate(dateString);
      setEndDate(dateString);
      setDescription("");
      setLeaveType("Annual");
      setShowDescriptionModal(true);
    }
  };

  // Handle month change
  const handleMonthChange = (e) => {
    setCurrentMonth(parseInt(e.target.value));
  };

  // Handle year change
  const handleYearChange = (direction) => {
    setCurrentYear((prev) => prev + direction);
  };

  // Add leave request
  const addLeaveRequest = async () => {
    if (startDate && description.trim()) {
      // Validate date range
      if (endDate && new Date(startDate) > new Date(endDate)) {
        Swal.fire({
          title: "Date Error",
          text: "End date cannot be before start date!",
          icon: "error",
        });
        return;
      }

      // Validate custom leave type if "Other" is selected
      if (leaveType === "Other" && !customLeaveType.trim()) {
        Swal.fire({
          title: "Input Required",
          text: "Please enter a custom leave type!",
          icon: "warning",
        });
        return;
      }

      const finalLeaveType =
        leaveType === "Other" ? customLeaveType.trim() : leaveType;
      const dateRange = generateDateRange(startDate, endDate || startDate);

      // Check for overlapping dates
      const hasOverlap = dateRange.some((date) =>
        leaveRequests.some((req) => req.dates && req.dates.includes(date))
      );

      if (hasOverlap) {
        Swal.fire({
          title: "Date Conflict",
          text: "Some dates in this range already have leave requests!",
          icon: "warning",
        });
        return;
      }

      try {
        setIsLoading(true);
        // Create data object to send to API
        const leaveData = {
          company_id: parseInt(selectedCompany),
          leave_type: finalLeaveType,
          reason: description.trim(),
          start_date: startDate,
          end_date: endDate && endDate !== startDate ? endDate : null,
        };

        // Only add department_id if selected
        if (selectedDepartment) {
          leaveData.department_id = parseInt(selectedDepartment);
        }

        // Send to API
        const response = await createLeaveEntry(leaveData);

        // Add to local state
        const newRequest = {
          id: response.id,
          dates: dateRange,
          startDate,
          endDate: endDate || startDate,
          description: description.trim(),
          type: finalLeaveType,
          status: "Approved", // Set as approved since it's saved to database
          duration: dateRange.length,
          company_id: parseInt(selectedCompany),
          department_id: selectedDepartment
            ? parseInt(selectedDepartment)
            : null,
        };

        setLeaveRequests((prev) => [...prev, newRequest]);

        // Reset form
        setDescription("");
        setLeaveType("Annual");
        setCustomLeaveType("");
        setStartDate("");
        setEndDate("");
        setShowDescriptionModal(false);

        Swal.fire({
          title: "Success!",
          text: "Leave request has been added.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        
        // Immediately refresh leave data
        await loadLeaveData();
      } catch (error) {
        console.error("Error saving leave request:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to save leave request. Please try again.",
          icon: "error",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Cancel leave request
  const cancelLeaveRequest = () => {
    setDescription("");
    setLeaveType("Annual");
    setCustomLeaveType("");
    setStartDate("");
    setEndDate("");
    setShowDescriptionModal(false);
  };

  // Process leave requests (for demo purposes, not needed with API)
  const processLeaveRequests = async () => {
    if (leaveRequests.length === 0) {
      Swal.fire({
        title: "No Requests",
        text: "No leave requests to process!",
        icon: "info",
      });
      return;
    }

    const pendingRequests = leaveRequests.filter(
      (req) => req.status === "Pending"
    );

    if (pendingRequests.length === 0) {
      Swal.fire({
        title: "No Pending Requests",
        text: "No pending leave requests to process!",
        icon: "info",
      });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: "Process Requests?",
      text: `Process ${pendingRequests.length} pending leave request(s)?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, process them",
      cancelButtonText: "Cancel",
    });

    if (isConfirmed) {
      setIsLoading(true);
      try {
        // Process each pending request
        const updatePromises = pendingRequests.map((req) =>
          updateLeaveEntry(req.id, { status: "Approved" })
        );

        await Promise.all(updatePromises);

        setLeaveRequests((prev) =>
          prev.map((req) =>
            req.status === "Pending" ? { ...req, status: "Approved" } : req
          )
        );

        Swal.fire({
          title: "Success!",
          text: `${pendingRequests.length} leave request(s) approved successfully!`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error processing leave requests:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to process some leave requests. Please try again.",
          icon: "error",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format date range for display
  const formatDateRange = (startDate, endDate) => {
    if (startDate === endDate) {
      return formatDate(startDate);
    }
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Get leave type config
  const getLeaveTypeConfig = (type) => {
    return leaveTypes.find((lt) => lt.value === type) || leaveTypes[0];
  };

  // Filter leave requests - show only calendar events (not employee leaves)
  const filteredLeaveRequests = leaveRequests.filter((req) => {
    // Only show calendar events in the list
    if (req.isEmployeeLeave) return false;
    
    const matchesSearch =
      req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDateRange(req.startDate, req.endDate)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // All leave requests for stats (including employee leaves)
  const allLeaveRequests = leaveRequests;

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                Leave Calendar
              </h1>
              <p className="text-blue-100 mt-2">
                Manage and track employee leave requests
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleYearChange(-1)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-lg font-semibold text-white min-w-[80px] text-center">
                {currentYear}
              </span>
              <button
                onClick={() => handleYearChange(1)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Company and Department filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <div className="relative">
              <Building2
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.company_label || company.display_name || company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <div className="relative">
              <Layers
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={!selectedCompany}
                className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  !selectedCompany ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              >
                <option value="">Select Department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-blue-100 rounded-full">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">How to use:</h3>
              <p className="text-blue-800 text-sm">
                Select a company to create company-wide leaves or select both
                company and department for department-specific leaves. Click on
                any calendar day to add a leave request. You can specify date
                ranges for multi-day leave. Click on existing leave days to
                remove them.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Requests
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {allLeaveRequests.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {
                    allLeaveRequests.filter(
                      (req) => req.status === "Approved"
                    ).length
                  }
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {
                    allLeaveRequests.filter(
                      (req) => req.status === "Pending"
                    ).length
                  }
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-purple-600">
                  {
                    allLeaveRequests.filter((req) => {
                      return (
                        req.dates &&
                        req.dates.some((date) => {
                          const reqDate = new Date(date + "T00:00:00");
                          return (
                            reqDate.getMonth() === currentMonth &&
                            reqDate.getFullYear() === currentYear
                          );
                        })
                      );
                    }).length
                  }
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {/* Month Selector */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Month
                </label>
                <select
                  value={currentMonth}
                  onChange={handleMonthChange}
                  className="px-4 py-3 border border-gray-200 rounded-xl bg-white text-lg min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="p-3 text-center font-semibold text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((day, index) => {
                  const selectedLeave = getSelectedLeave(day);
                  const leaveConfig = selectedLeave
                    ? selectedLeave.isEmployeeLeave
                      ? getEmployeeLeaveColor()
                      : getLeaveTypeConfig(selectedLeave.type)
                    : null;

                  return (
                    <div
                      key={index}
                      onClick={() => handleDayClick(day)}
                      className={`
                        h-20 p-3 border rounded-xl cursor-pointer transition-all duration-200 relative
                        ${
                          day
                            ? "hover:shadow-lg hover:scale-[1.02]"
                            : "cursor-default"
                        }
                        ${
                          selectedLeave
                            ? selectedLeave.isEmployeeLeave
                              ? `${leaveConfig.color} text-white hover:brightness-90 border-teal-400 shadow-md`
                              : `${leaveConfig.color} text-white hover:brightness-75 border-gray-300`
                            : "bg-white hover:bg-gray-50 hover:border-gray-300 border-gray-200"
                        }
                        ${!day ? "bg-gray-50 border-gray-100" : ""}
                      `}
                    >
                      {selectedLeave && !selectedLeave.isEmployeeLeave && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
                      )}
                      {day && (
                        <div className="flex flex-col h-full">
                          <span
                            className={`text-lg font-semibold ${
                              selectedLeave ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {day}
                          </span>
                          {selectedLeave && (
                            <div className="mt-1">
                              {selectedLeave.isEmployeeLeave && (
                                <span className="text-xs opacity-95 block truncate font-medium">
                                  👤 {selectedLeave.employeeName}
                                </span>
                              )}
                              <span className="text-xs opacity-90 block truncate">
                                {selectedLeave.type}
                              </span>
                              {!selectedLeave.isEmployeeLeave && (
                                <span className="text-xs opacity-75 block truncate">
                                  {selectedLeave.duration}d
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Leave Details Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Leave Requests
                </h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {filteredLeaveRequests.length}
                </span>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Leave Requests List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredLeaveRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">
                      No leave requests
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {selectedCompany && selectedDepartment
                        ? "Click on calendar days to add requests"
                        : "Select a company and department"}
                    </p>
                  </div>
                ) : (
                  filteredLeaveRequests.map((request) => {
                    const leaveConfig = request.isEmployeeLeave
                      ? getEmployeeLeaveColor()
                      : getLeaveTypeConfig(request.type);
                    const company = companies.find(
                      (c) => c.id == request.company_id
                    );
                    const department = departments.find(
                      (d) => d.id == request.department_id
                    );

                    return (
                      <div
                        key={request.id}
                        className={`p-4 border rounded-xl transition-all ${
                          request.isEmployeeLeave
                            ? "border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 hover:shadow-md"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${leaveConfig.lightColor} ${leaveConfig.textColor}`}
                            >
                              {request.type}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                request.status === "Approved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {request.status}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {request.duration} day
                              {request.duration > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        {request.isEmployeeLeave ? (
                          <div className="flex items-center gap-2 mb-2 p-2 bg-white/60 rounded-lg border border-teal-200">
                            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {request.employeeName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-teal-900">
                                {request.employeeName}
                              </p>
                              <p className="text-xs text-teal-600">Employee Leave</p>
                            </div>
                          </div>
                        ) : (
                          company && department && (
                            <div className="text-xs text-gray-500 mb-1">
                              <span>
                                {company.name} • {department.name}
                              </span>
                            </div>
                          )
                        )}

                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {formatDateRange(request.startDate, request.endDate)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {request.description}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Process Button - Only show if there are pending requests */}
              {filteredLeaveRequests.filter((req) => req.status === "Pending")
                .length > 0 && (
                <button
                  onClick={processLeaveRequests}
                  disabled={isLoading}
                  className={`
                    w-full mt-6 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg
                    bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl transform hover:-translate-y-0.5
                    ${isLoading ? "opacity-70 cursor-not-allowed" : ""}
                  `}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      Process Pending (
                      {
                        filteredLeaveRequests.filter(
                          (req) => req.status === "Pending"
                        ).length
                      }
                      )
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Add Leave Request
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Select date range for your leave
                </p>
              </div>
              <button
                onClick={cancelLeaveRequest}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Company and Department display */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Company</label>
                    <p className="font-medium text-gray-800">
                      {companies.find((c) => c.id == selectedCompany)?.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Department</label>
                    <p className="font-medium text-gray-800">
                      {departments.find((d) => d.id == selectedDepartment)
                        ?.name || (
                        <span className="text-gray-400 italic">
                          Company-wide
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={getCurrentDate()}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      if (selectedDate < today) {
                        Swal.fire({
                          title: "Invalid Date",
                          text: "You cannot select past dates for leave requests",
                          icon: "warning",
                        });
                        return;
                      }
                      setStartDate(e.target.value);
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || getCurrentDate()}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      if (selectedDate < today) {
                        Swal.fire({
                          title: "Invalid Date",
                          text: "You cannot select past dates for leave requests",
                          icon: "warning",
                        });
                        return;
                      }
                      setEndDate(e.target.value);
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {startDate && endDate && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-blue-800 text-sm">
                    <strong>Duration:</strong>{" "}
                    {generateDateRange(startDate, endDate).length} day
                    {generateDateRange(startDate, endDate).length > 1
                      ? "s"
                      : ""}
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    {formatDateRange(startDate, endDate)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => {
                    setLeaveType(e.target.value);
                    if (e.target.value !== "Other") {
                      setCustomLeaveType("");
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {leaveTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.value}
                    </option>
                  ))}
                </select>

                {leaveType === "Other" && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={customLeaveType}
                      onChange={(e) => setCustomLeaveType(e.target.value)}
                      placeholder="Enter leave type..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Leave *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter reason for leave..."
                  className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  rows="4"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={cancelLeaveRequest}
                className="px-6 py-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={addLeaveRequest}
                disabled={!startDate || !description.trim() || isLoading}
                className={`
                  px-6 py-3 rounded-xl font-medium transition-all shadow-lg
                  ${
                    startDate && description.trim() && !isLoading
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-0.5"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                  }
                `}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Saving...
                  </div>
                ) : (
                  "Add Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-4"></div>
            <p className="text-gray-600 font-medium text-sm sm:text-base">
              Loading calendar data...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveCalendar;
