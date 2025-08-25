import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ChevronRight,
  Eye,
} from "lucide-react";
import ShiftScheduleService from "@services/ShiftScheduleService";
import RosterService from "@services/RosterService";
import employeeService from "@services/EmployeeDataService";
import {
  fetchCompanies,
  fetchDepartments,
  fetchSubDepartmentsById,
  fetchSubDepartments,
  employeesBySubDepartment,
  employeesByCompany,
} from "@services/ApiDataService";
import Swal from "sweetalert2";

const RosterManagementSystem = () => {
  // State for form inputs
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rosterDate, setRosterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddShift, setShowAddShift] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSubDepartment, setSelectedSubDepartment] = useState("");
  const [assignMode, setAssignMode] = useState("designation");
  const [rosterAssignments, setRosterAssignments] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false); // Add this state for the summary modal
  const [showAllRostersModal, setShowAllRostersModal] = useState(false);
  const [allRosters, setAllRosters] = useState([]);
  const [loadingAllRosters, setLoadingAllRosters] = useState(false);

  // Data states
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [companiesError, setCompaniesError] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [departmentsError, setDepartmentsError] = useState(null);

  const [subDepartments, setSubDepartments] = useState([]);
  const [isLoadingSubDepartments, setIsLoadingSubDepartments] = useState(false);
  const [subDepartmentsError, setSubDepartmentsError] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);

  const [shifts, setShifts] = useState([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [shiftsError, setShiftsError] = useState(null);

  const [selectedShifts, setSelectedShifts] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const [shiftSearchTerm, setShiftSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // New state variables for roster search
  const [rosterSearchParams, setRosterSearchParams] = useState({
    date_from: "",
    date_to: "",
    company_id: "",
    department_id: "",
    sub_department_id: "",
    employee_id: "",
  });
  const [searchedRosters, setSearchedRosters] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // New state: whether a search has been performed and a user-visible message
  const [rosterSearchPerformed, setRosterSearchPerformed] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");

  // Add a new state for companyWise checkbox
  const [isCompanyWise, setIsCompanyWise] = useState(false);

  // Set default dates on component mount
  useEffect(() => {
    const today = new Date();
    const defaultDateFrom = today.toISOString().split("T")[0];
    const defaultDateTo = new Date(today.setDate(today.getDate() + 30))
      .toISOString()
      .split("T")[0];

    setDateFrom(defaultDateFrom);
    setDateTo(defaultDateTo);
    setRosterDate(defaultDateFrom);
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchCompaniesData();
      await fetchShiftsData();
    };

    fetchInitialData();
  }, []);

  // Data fetching functions
  const fetchCompaniesData = async () => {
    try {
      setIsLoadingCompanies(true);
      const data = await fetchCompanies();
      setCompanies(data);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      setCompaniesError("Failed to load companies");
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const fetchDepartmentsData = async () => {
    try {
      setIsLoadingDepartments(true);
      const data = await fetchDepartments();
      setDepartments(data);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      setDepartmentsError("Failed to load departments");
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const fetchSubDepartmentsData = async () => {
    try {
      setIsLoadingSubDepartments(true);
      const data = await fetchSubDepartments();
      setSubDepartments(data);
    } catch (err) {
      console.error("Failed to fetch sub-departments:", err);
      setSubDepartmentsError("Failed to load sub-departments");
    } finally {
      setIsLoadingSubDepartments(false);
    }
  };

  const fetchEmployeesData = async () => {
    try {
      setIsLoadingEmployees(true);

      if (isCompanyWise) {
        // If company-wise is enabled, fetch ALL employees for the company
        const data = await employeesByCompany(selectedCompany);
        setEmployees(
          data.map((emp) => ({
            id: emp.id,
            name: emp.full_name || `${emp.first_name} ${emp.last_name}`,
            empCode: emp.employee_code,
            department_id: emp.department_id?.toString(),
            sub_department_id: emp.sub_department_id?.toString(),
          }))
        );
      } else if (selectedSubDepartment) {
        // If sub-department is selected, use employeesBySubDepartment
        const data = await employeesBySubDepartment(selectedSubDepartment);
        setEmployees(
          data.map((emp) => ({
            id: emp.id,
            name: emp.full_name,
          }))
        );
      } else {
        // Filter by department if selected, otherwise just by company
        const filters = {};
        if (selectedCompany) filters.company_id = selectedCompany;
        if (selectedDepartment) filters.department_id = selectedDepartment;

        const data = await RosterService.getEmployeesForRoster(filters);
        setEmployees(
          data.map((emp) => ({
            id: emp.id,
            empCode: emp.employee_code,
            name: `${emp.first_name} ${emp.last_name}`,
            department_id: emp.department_id?.toString(),
            sub_department_id: emp.sub_department_id?.toString(),
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      setEmployeesError("Failed to load employees");
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const fetchShiftsData = async () => {
    try {
      setIsLoadingShifts(true);
      const data = await ShiftScheduleService.getAllShifts();
      setShifts(
        data.map((shift) => ({
          id: shift.id,
          scode: shift.shift_code,
          shiftName: shift.shift_name || shift.shift_description,
          shiftStart: shift.start_time.substring(0, 5),
          shiftEnd: shift.end_time.substring(0, 5),
        }))
      );
    } catch (err) {
      console.error("Failed to fetch shifts:", err);
      setShiftsError("Failed to load shifts");
    } finally {
      setIsLoadingShifts(false);
    }
  };

  // Fetch departments when company changes
  useEffect(() => {
    if (selectedCompany) {
      fetchDepartmentsData();
    } else {
      setSelectedDepartment("");
    }
  }, [selectedCompany]);

  // Fetch sub-departments when department changes
  useEffect(() => {
    if (selectedDepartment) {
      fetchSubDepartmentsData();
    } else {
      setSelectedSubDepartment("");
    }
  }, [selectedDepartment]);

  // Fetch employees when organizational selection changes
  useEffect(() => {
    // Only fetch employees if at least a company is selected
    if (selectedCompany) {
      fetchEmployeesData();
    } else {
      setEmployees([]); // Clear employees if no company selected
    }
  }, [
    selectedCompany,
    selectedDepartment,
    selectedSubDepartment,
    isCompanyWise,
  ]);

  // Filter departments by company
  const filteredDepartments = useMemo(() => {
    return departments.filter((dep) =>
      selectedCompany ? dep.company_id?.toString() === selectedCompany : true
    );
  }, [selectedCompany, departments]);

  // Filter sub-departments by department
  const filteredSubDepartments = useMemo(() => {
    return subDepartments.filter((sub) =>
      selectedDepartment
        ? sub.department_id?.toString() === selectedDepartment
        : true
    );
  }, [selectedDepartment, subDepartments]);

  // Filter employees based on selections
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter((emp) => {
        // Check if name exists and includes the search term
        const nameMatch =
          emp.name && emp.name.toLowerCase().includes(searchTerm.toLowerCase());

        // Check if empCode exists before trying to use it
        const codeMatch =
          emp.empCode &&
          emp.empCode.toLowerCase().includes(searchTerm.toLowerCase());

        return nameMatch || codeMatch;
      });
    }

    return filtered;
  }, [employees, searchTerm]);

  // Add this before the return statement
  const filteredAndPaginatedShifts = useMemo(() => {
    // First filter the shifts
    const filtered = shifts.filter(
      (shift) =>
        shift.scode.toLowerCase().includes(shiftSearchTerm.toLowerCase()) ||
        shift.shiftName.toLowerCase().includes(shiftSearchTerm.toLowerCase())
    );

    // Then paginate
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    return {
      shifts: filtered.slice(startIndex, endIndex),
      totalShifts: filtered.length,
      totalPages: Math.ceil(filtered.length / rowsPerPage),
    };
  }, [shifts, shiftSearchTerm, currentPage]);

  // Helper functions to get names
  const getCompanyName = (id) =>
    companies.find((c) => c.id.toString() === id)?.name || "";

  const getDepartmentName = (id) =>
    departments.find((d) => d.id.toString() === id)?.name || "";

  const getSubDepartmentName = (id) =>
    subDepartments.find((s) => s.id.toString() === id)?.name || "";

  // Add this helper function to check if two time ranges overlap
  const doTimeRangesOverlap = (start1, end1, start2, end2) => {
    // Convert time strings to comparable values (minutes since midnight)
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const start1Mins = timeToMinutes(start1);
    const end1Mins = timeToMinutes(end1);
    const start2Mins = timeToMinutes(start2);
    const end2Mins = timeToMinutes(end2);

    return start1Mins < end2Mins && end1Mins > start2Mins;
  };

  // Modify the toggleShiftSelection function
  const toggleShiftSelection = (shift) => {
    setSelectedShifts((prev) => {
      const newSelected = new Set(prev);

      if (newSelected.has(shift.id)) {
        // If shift is already selected, just remove it
        newSelected.delete(shift.id);
      } else {
        // Check for overlaps with already selected shifts
        const hasOverlap = Array.from(newSelected).some((selectedShiftId) => {
          const selectedShift = shifts.find((s) => s.id === selectedShiftId);
          return doTimeRangesOverlap(
            selectedShift.shiftStart,
            selectedShift.shiftEnd,
            shift.shiftStart,
            shift.shiftEnd
          );
        });

        if (hasOverlap) {
          // Show error message
          Swal.fire({
            icon: "warning",
            title: "Cannot Select Shift",
            text: "Cannot select shifts with overlapping time frames",
            confirmButtonColor: "#3085d6",
          });
          return newSelected;
        }

        // If no overlap, add the new shift
        newSelected.add(shift.id);
      }

      return newSelected;
    });
  };

  // Add selected shifts to roster
  const handleAddShift = () => {
    if (selectedShifts.size === 0) return;

    // Check if we have the required fields selected
    if (!selectedCompany) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select a company",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Only validate department and sub-department if not in company-wise mode
    if (!isCompanyWise && (!selectedDepartment || !selectedSubDepartment)) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select department and sub-department",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    let employeesToAssign = [];
    if (assignMode === "designation") {
      employeesToAssign = filteredEmployees.map((e) => e.id);
    } else if (assignMode === "employee") {
      employeesToAssign = Array.from(selectedEmployees);
    }

    if (employeesToAssign.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Employees Selected",
        text: "Please select at least one employee",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const shiftsToAssign = shifts.filter((shift) =>
      selectedShifts.has(shift.id)
    );

    const newAssignments = shiftsToAssign.map((shift) => ({
      company: selectedCompany,
      // Use empty string or "0" for department/subdepartment if in company-wise mode
      department: isCompanyWise ? "0" : selectedDepartment,
      subDepartment: isCompanyWise ? "0" : selectedSubDepartment,
      employees: employeesToAssign,
      shift: shift,
      dateFrom,
      dateTo,
    }));

    setRosterAssignments((prev) => [...prev, ...newAssignments]);
    setSelectedShifts(new Set());
    setSelectedEmployees(new Set());
  };

  // Remove assignment
  const handleRemoveAssignment = (idx) => {
    setRosterAssignments((prev) => prev.filter((_, i) => i !== idx));
  };

  // Handle employee selection
  const handleEmployeeSelect = (empId) => {
    if (assignMode !== "employee") return;
    setSelectedEmployees((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(empId)) {
        newSet.delete(empId);
      } else {
        newSet.add(empId);
      }
      return newSet;
    });
  };

  // Save roster to backend
  const handleSaveRoster = async () => {
    // Show error if no pending assignments
    if (rosterAssignments.length === 0) {
      Swal.fire({
        icon: "error",
        title: "No Pending Assignments",
        text: "Please add at least one shift assignment before processing the roster.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    try {
      setIsSaving(true);

      // Create an array to hold all roster entries
      const rosterEntries = [];

      // Generate a roster_id (you can use timestamp or UUID if needed)
      const rosterId = Date.now(); // or use a UUID generator

      // Iterate through each assignment and create individual records for each employee
      for (const assignment of rosterAssignments) {
        assignment.employees.forEach((employeeId) => {
          // Handle the company-wise case by using null or 0 for department/subdepartment
          rosterEntries.push({
            roster_id: rosterId, // Same ID for all entries in this batch
            shift_code: assignment.shift.id,
            company_id: parseInt(assignment.company),
            // If company-wise or value is "0", send null (or 0, depending on API requirements)
            department_id:
              assignment.department === "0"
                ? null
                : parseInt(assignment.department),
            sub_department_id:
              assignment.subDepartment === "0"
                ? null
                : parseInt(assignment.subDepartment),
            employee_id: parseInt(employeeId),
            is_recurring: false,
            recurrence_pattern: "none",
            notes: `Shift assignment: ${assignment.shift.shiftName}`,
            date_from: assignment.dateFrom,
            date_to: assignment.dateTo,
          });
        });
      }

      console.log("Sending roster entries:", rosterEntries); // Add this for debugging

      // Send all entries in a single API call
      try {
        const response = await RosterService.createRoster(rosterEntries);
        // Success message
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Roster assignments saved successfully",
          timer: 2000,
          showConfirmButton: false,
          position: "top-end",
          toast: true,
        });

        // Reset form after successful save
        setRosterAssignments([]);
        setSelectedCompany("");
        setSelectedDepartment("");
        setSelectedSubDepartment("");
        setSelectedShifts(new Set());
        setSelectedEmployees(new Set());
      } catch (error) {
        console.error("Error response:", error.response?.data); // Log detailed error

        // Show error details from API if available
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to save roster";

        Swal.fire({
          icon: "error",
          title: "Error!",
          text: errorMessage,
          confirmButtonColor: "#3085d6",
        });
      }
    } catch (error) {
      console.error("Error saving roster:", error);

      // Error message
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to save roster",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add or update shift (for modal)
  const addOrUpdateShift = (shift) => {
    if (editingShift) {
      setShifts((prev) =>
        prev.map((s) => (s.id === editingShift.id ? { ...s, ...shift } : s))
      );
    } else {
      setShifts((prev) => [
        ...prev,
        {
          ...shift,
          id: Math.max(...prev.map((s) => s.id), 0) + 1,
          scode: `S${Math.max(
            ...(prev.map((s) => parseInt(s.scode.replace("S", "")), 0) + 1)
          )}`,
        },
      ]);
    }
    setShowAddShift(false);
    setEditingShift(null);
  };

  // Add the handleViewSummary function
  const handleViewSummary = () => {
    if (rosterAssignments.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Assignments",
        text: "No roster assignments to view",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    setShowSummaryModal(true);
  };

  const handleViewAllRosters = async () => {
    setShowAllRostersModal(true);
    setLoadingAllRosters(true);
    try {
      const data = await RosterService.getAllRosters();
      console.log("Roster API response:", data);
      // Normalize to flat rows for the table
      setAllRosters(normalizeRosterItems(Array.isArray(data) ? data : []));
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load rosters",
        confirmButtonColor: "#3085d6",
      });
      setAllRosters([]); // Ensure it's always an array
    } finally {
      setLoadingAllRosters(false);
    }
  };

  // Add: normalize roster API items to a single flat shape (reused by All + Search)
  const normalizeRosterItems = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
      const rd = item.roster_details || item.roster || {};
      const org = item.organization_details || {};
      const emp = item.employee_details || {};
      const company = org.company || item.company || {};
      const dept = org.department || item.department || {};
      const sub =
        org.sub_department || org.subDepartment || item.sub_department || {};

      return {
        id: rd.id ?? item.id,
        roster_id: rd.roster_id ?? item.roster_id ?? rd.id ?? item.id,
        shift_code:
          rd.shift_code ?? item.shift_code ?? rd.shift?.shift_code ?? "",
        company_id: company.id ?? item.company_id ?? null,
        company_name: company.name ?? item.company_name ?? "",
        department_id: dept.id ?? item.department_id ?? null,
        department_name: dept.name ?? item.department_name ?? "",
        sub_department_id: sub.id ?? item.sub_department_id ?? null,
        sub_department_name: sub.name ?? item.sub_department_name ?? "",
        employee_id: emp.id ?? item.employee_id ?? null,
        employee_name: emp.full_name ?? emp.name ?? item.employee_name ?? "",
        date_from: rd.date_from ?? item.date_from ?? "",
        date_to: rd.date_to ?? item.date_to ?? "",
      };
    });
  };

  // Add this to handle roster search
  const handleRosterSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setRosterSearchPerformed(true);
    setSearchMessage(""); // reset any previous message

    try {
      // Clean up empty fields to avoid sending them as empty strings
      const cleanParams = {};
      Object.keys(rosterSearchParams).forEach((key) => {
        if (rosterSearchParams[key]) {
          cleanParams[key] = rosterSearchParams[key];
        }
      });

      const data = await RosterService.searchRosters(cleanParams);

      // Normalize nested API structure just like "All Rosters"
      const flattenedRosters = normalizeRosterItems(
        Array.isArray(data) ? data : []
      );

      if (flattenedRosters.length === 0) {
        setSearchedRosters([]);
        setSearchMessage("No roster data matched your search.");
      } else {
        setSearchedRosters(flattenedRosters);
        setSearchMessage("");
      }
    } catch (err) {
      setSearchedRosters([]);
      setSearchMessage("Search failed. Please try again.");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to search rosters",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Add this to reset search
  const resetRosterSearch = () => {
    setRosterSearchParams({
      date_from: "",
      date_to: "",
      company_id: "",
      department_id: "",
      sub_department_id: "",
      employee_id: "",
    });
    setSearchedRosters([]);
    setRosterSearchPerformed(false);
    setSearchMessage("");
  };

  return (
    <div className=" bg-gray-100 flex flex-col">
      {/* Top Header */}
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-xl font-bold">Roster Management System</h1>
        <div className="flex items-center space-x-4">
          {/* <span className="text-sm bg-blue-700 px-3 py-1 rounded-full">
            Filtering Options
          </span> */}
          <button
            className="bg-white text-blue-700 px-4 py-2 rounded shadow hover:bg-blue-100 font-semibold"
            onClick={handleViewAllRosters}
          >
            View All Rosters
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Filters */}
        <div className="w-80 bg-white border-r border-gray-300 flex flex-col shadow-sm">
          {/* Date Range Section */}
          <div className="p-4 border-b border-gray-200">
            <div className="bg-gradient-to-r from-orange-100 to-orange-50 border border-orange-300 rounded-lg p-4 mb-4 shadow-sm">
              <h3 className="font-semibold text-sm mb-3 text-orange-800 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Roster Date
              </h3>
              <input
                type="date"
                value={rosterDate}
                className="w-full px-3 py-2 border border-orange-300 rounded-md text-sm bg-gray-50 cursor-not-allowed"
                readOnly
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Company/Department/SubDepartment Dropdowns */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-sm mb-3 text-gray-800">
              Select Company / Department / Sub Department
            </h3>
            <div className="space-y-3">
              {/* Company Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Company
                </label>
                {isLoadingCompanies ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 flex items-center justify-center">
                    <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-blue-500 animate-spin"></div>
                    Loading...
                  </div>
                ) : companiesError ? (
                  <div className="w-full px-3 py-2 border border-red-300 bg-red-50 rounded-md text-sm text-red-600">
                    Error loading companies
                  </div>
                ) : (
                  <select
                    value={selectedCompany}
                    onChange={(e) => {
                      setSelectedCompany(e.target.value);
                      setSelectedDepartment("");
                      setSelectedSubDepartment("");
                      setSelectedShifts(new Set());
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {/* Department Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Department
                  {!isCompanyWise && <span className="text-red-500">*</span>}
                </label>
                {isLoadingDepartments ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 flex items-center justify-center">
                    <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-blue-500 animate-spin"></div>
                    Loading...
                  </div>
                ) : departmentsError ? (
                  <div className="w-full px-3 py-2 border border-red-300 bg-red-50 rounded-md text-sm text-red-600">
                    Error loading departments
                  </div>
                ) : (
                  <select
                    value={selectedDepartment}
                    onChange={(e) => {
                      setSelectedDepartment(e.target.value);
                      setSelectedSubDepartment("");
                    }}
                    disabled={!selectedCompany || isCompanyWise} // Add isCompanyWise condition here
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm 
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                      ${
                        isCompanyWise
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : ""
                      }`}
                  >
                    <option value="">
                      {isCompanyWise
                        ? "Not required in company mode"
                        : "Select Department"}
                    </option>
                    {filteredDepartments.map((dep) => (
                      <option key={dep.id} value={dep.id}>
                        {dep.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {/* Sub Department Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sub Department
                  {!isCompanyWise && <span className="text-red-500">*</span>}
                </label>
                {isLoadingSubDepartments ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 flex items-center justify-center">
                    <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-blue-500 animate-spin"></div>
                    Loading...
                  </div>
                ) : subDepartmentsError ? (
                  <div className="w-full px-3 py-2 border border-red-300 bg-red-50 rounded-md text-sm text-red-600">
                    Error loading sub-departments
                  </div>
                ) : (
                  <select
                    value={selectedSubDepartment}
                    onChange={(e) => setSelectedSubDepartment(e.target.value)}
                    disabled={!selectedDepartment || isCompanyWise} // Add isCompanyWise condition here
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm 
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      ${
                        isCompanyWise
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : ""
                      }`}
                  >
                    <option value="">
                      {isCompanyWise
                        ? "Not required in company mode"
                        : "Select Sub Department"}
                    </option>
                    {filteredSubDepartments.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Assign Mode */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="wise"
                  id="employee"
                  checked={assignMode === "employee"}
                  onChange={() => setAssignMode("employee")}
                  className="w-3 h-3 text-blue-600"
                />
                <label
                  htmlFor="employee"
                  className="text-xs font-medium text-gray-700"
                >
                  Employee Wise
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="wise"
                  id="designation"
                  checked={assignMode === "designation"}
                  onChange={() => setAssignMode("designation")}
                  className="w-3 h-3 text-blue-600"
                />
                <label
                  htmlFor="designation"
                  className="text-xs font-medium text-gray-700"
                >
                  Designation Wise
                </label>
              </div>
            </div>

            {/* Add Company Wise checkbox */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="companyWise"
                  checked={isCompanyWise}
                  onChange={() => {
                    // Clear department and sub-department when toggling company-wise mode
                    if (!isCompanyWise) {
                      setSelectedDepartment("");
                      setSelectedSubDepartment("");
                    }
                    setIsCompanyWise(!isCompanyWise);
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label
                  htmlFor="companyWise"
                  className="text-sm font-medium text-gray-700"
                >
                  Company Wise
                </label>
                {isCompanyWise && selectedCompany && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {employees.length} employees
                  </span>
                )}
              </div>
              {isCompanyWise && (
                <div className="mt-1 text-xs bg-blue-50 p-2 rounded-md border border-blue-100">
                  <p className="text-blue-700">
                    <span className="font-semibold">Company-wise mode:</span>{" "}
                    Department and Sub-Department selection not required
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Company Wise Toggle - Removed duplicate section */}
        </div>

        {/* Middle Panel - Show appropriate content based on selection */}
        <div className="w-[400px] min-w-[400px] max-w-[400px] p-4 border-b border-gray-200 bg-gray-50">
          {/* Top: Show current selection as a summary */}
          <div className="flex items-center justify-between mb-2 p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
            <div>
              <span className="text-xs text-gray-500">Selected: </span>
              <span className="font-semibold text-blue-700">
                {selectedCompany && getCompanyName(selectedCompany)}
                {!isCompanyWise &&
                  selectedDepartment &&
                  ` > ${getDepartmentName(selectedDepartment)}`}
                {!isCompanyWise &&
                  selectedSubDepartment &&
                  ` > ${getSubDepartmentName(selectedSubDepartment)}`}
              </span>
              {isCompanyWise && selectedCompany && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Company-wise
                </span>
              )}
            </div>

            {((selectedDepartment && selectedSubDepartment) ||
              (isCompanyWise && selectedCompany)) &&
              filteredEmployees.length > 0 && (
                <button
                  className="flex items-center text-blue-600 hover:underline text-xs"
                  onClick={() => setShowEmployeeModal(true)}
                >
                  <Eye className="w-4 h-4 mr-1" /> View All (
                  {filteredEmployees.length})
                </button>
              )}
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-sm mb-3 text-gray-800">
              {isCompanyWise && selectedCompany
                ? "Employees"
                : selectedCompany && !selectedDepartment
                ? "Departments"
                : selectedCompany &&
                  selectedDepartment &&
                  !selectedSubDepartment
                ? "Sub Departments"
                : "Employees"}
            </h3>

            {/* Fixed height container for scrollable content */}
            <div className="h-[calc(100vh-280px)] overflow-y-auto">
              {/* Company-wise employees */}
              {isCompanyWise && selectedCompany && (
                <div>
                  <div className="mb-3 relative sticky top-0 z-10 bg-white pb-2">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    {isLoadingEmployees ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="h-6 w-6 mr-2 rounded-full border-2 border-t-blue-500 animate-spin"></div>
                        <span>Loading employees...</span>
                      </div>
                    ) : (
                      filteredEmployees.slice(0, 15).map((emp) => (
                        <div
                          key={emp.id}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedEmployees.has(emp.id.toString())
                              ? "bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300 shadow-md"
                              : "hover:bg-gray-50 border border-gray-200"
                          }`}
                          onClick={() =>
                            assignMode === "employee" &&
                            handleEmployeeSelect(emp.id.toString())
                          }
                        >
                          <div className="truncate pr-2">
                            <span className="text-sm font-medium text-gray-700 block truncate">
                              {emp.name}
                            </span>
                            {emp.empCode && (
                              <span className="text-xs text-gray-500 block truncate">
                                ID: {emp.empCode}
                              </span>
                            )}
                          </div>
                          {assignMode === "employee" && (
                            <input
                              type="checkbox"
                              checked={selectedEmployees.has(emp.id.toString())}
                              readOnly
                              className="w-4 h-4 flex-shrink-0 text-blue-600 border-gray-300 rounded"
                              tabIndex={-1}
                            />
                          )}
                        </div>
                      ))
                    )}

                    {filteredEmployees.length > 15 && (
                      <div className="mt-2 text-center sticky bottom-0 pt-2 bg-white">
                        <button
                          className="text-blue-600 text-sm hover:underline"
                          onClick={() => setShowEmployeeModal(true)}
                        >
                          View all {filteredEmployees.length} employees
                        </button>
                      </div>
                    )}

                    {filteredEmployees.length === 0 && !isLoadingEmployees && (
                      <div className="p-4 text-center text-gray-500">
                        No employees found
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Other content sections - keep existing code with similar fixed sizing */}
              {!isCompanyWise && selectedCompany && !selectedDepartment && (
                <div className="space-y-2">
                  {isLoadingDepartments ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="h-6 w-6 mr-2 rounded-full border-2 border-t-blue-500 animate-spin"></div>
                      <span>Loading departments...</span>
                    </div>
                  ) : departmentsError ? (
                    <div className="p-4 text-center text-red-600">
                      {departmentsError}
                    </div>
                  ) : filteredDepartments.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No departments found for this company
                    </div>
                  ) : (
                    filteredDepartments.map((dep) => (
                      <div
                        key={dep.id}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedDepartment === dep.id.toString()
                            ? "bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300 shadow-md"
                            : "hover:bg-gray-50 border border-gray-200"
                        }`}
                        onClick={() => setSelectedDepartment(dep.id.toString())}
                      >
                        <span className="text-sm font-medium text-gray-700">
                          {dep.name}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Keep existing code for sub-departments and normal employee selection */}
              {!isCompanyWise &&
                selectedDepartment &&
                !selectedSubDepartment && (
                  // Your existing code for showing sub-departments
                  <div className="space-y-2">
                    {isLoadingSubDepartments ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="h-6 w-6 mr-2 rounded-full border-2 border-t-blue-500 animate-spin"></div>
                        <span>Loading sub-departments...</span>
                      </div>
                    ) : subDepartmentsError ? (
                      <div className="p-4 text-center text-red-600">
                        {subDepartmentsError}
                      </div>
                    ) : filteredSubDepartments.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No sub-departments found for this department
                      </div>
                    ) : (
                      filteredSubDepartments.map((sub) => (
                        <div
                          key={sub.id}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedSubDepartment === sub.id.toString()
                              ? "bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300 shadow-md"
                              : "hover:bg-gray-50 border border-gray-200"
                          }`}
                          onClick={() =>
                            setSelectedSubDepartment(sub.id.toString())
                          }
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {sub.name}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

              {/* Show employees (normal mode) */}
              {!isCompanyWise &&
                selectedDepartment &&
                selectedSubDepartment && (
                  <div>
                    <div className="space-y-2">
                      {filteredEmployees.slice(0, 3).map((emp) => (
                        <div
                          key={emp.id}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedEmployees.has(emp.id.toString())
                              ? "bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300 shadow-md"
                              : "hover:bg-gray-50 border border-gray-200"
                          }`}
                          onClick={() =>
                            assignMode === "employee" &&
                            handleEmployeeSelect(emp.id.toString())
                          }
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {emp.name}
                          </span>
                          {assignMode === "employee" && (
                            <input
                              type="checkbox"
                              checked={selectedEmployees.has(emp.id.toString())}
                              readOnly
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                              tabIndex={-1}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Employee Modal */}
        {showEmployeeModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                onClick={() => setShowEmployeeModal(false)}
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-bold mb-4">All Employees</h2>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 border">ID</th>
                      <th className="px-3 py-2 border">Full Name</th>
                      <th className="px-3 py-2 border">Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp, idx) => (
                      <tr
                        key={emp.id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-3 py-2 border">{emp.id}</td>
                        <td className="px-3 py-2 border">{emp.name}</td>
                        <td className="px-3 py-2 border text-center">
                          <input
                            type="checkbox"
                            checked={selectedEmployees.has(emp.id.toString())}
                            onChange={() =>
                              handleEmployeeSelect(emp.id.toString())
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
                  onClick={() => setShowEmployeeModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right Panel - Shift Table and Add to Roster */}
        <div className="flex-1 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-25">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-800">
                Shift Selection
              </h3>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">
                {dateFrom} - {dateTo}
              </span>
              <span className="font-semibold text-blue-600 ml-1">
                {selectedCompany && ` | ${getCompanyName(selectedCompany)}`}
                {selectedDepartment &&
                  ` > ${getDepartmentName(selectedDepartment)}`}
                {selectedSubDepartment &&
                  ` > ${getSubDepartmentName(selectedSubDepartment)}`}
              </span>
            </div>
          </div>
          <div className="p-4 flex-1 flex flex-col">
            {/* Shift Table */}
            <div className="flex-1 overflow-hidden border border-gray-300 rounded-lg shadow mb-4 flex flex-col">
              {/* Search bar */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search shifts by code or name..."
                    className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={shiftSearchTerm}
                    onChange={(e) => {
                      setShiftSearchTerm(e.target.value);
                      setCurrentPage(1); // Reset to first page on search
                    }}
                  />
                </div>
              </div>

              {/* Table container with scroll */}
              <div className="flex-1 overflow-y-auto">
                {isLoadingShifts ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading shifts...</p>
                  </div>
                ) : shiftsError ? (
                  <div className="p-8 text-center text-red-500">
                    <p>{shiftsError}</p>
                    <button
                      onClick={fetchShiftsData}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold border-r border-blue-500">
                          S.Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold border-r border-blue-500">
                          Shift Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold border-r border-blue-500">
                          Start Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold border-r border-blue-500">
                          End Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold border-blue-500">
                          Select
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndPaginatedShifts.shifts.map((shift, index) => (
                        <tr
                          key={shift.id}
                          className={`${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50 transition-colors duration-150 border-b border-gray-200 
                          ${
                            selectedShifts.has(shift.id)
                              ? "bg-blue-50 border-l-4 border-blue-500"
                              : ""
                          }`}
                        >
                          <td className="px-4 py-3 border-r border-gray-200">
                            <span className="font-mono text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded">
                              {shift.scode}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200">
                            <span className="font-medium text-gray-700">
                              {shift.shiftName}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 font-mono text-green-600 font-semibold">
                            {shift.shiftStart}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 font-mono text-red-600 font-semibold">
                            {shift.shiftEnd}
                          </td>
                          <td className="px-4 py-3 border-gray-200 text-center">
                            <button
                              onClick={() => toggleShiftSelection(shift)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                selectedShifts.has(shift.id)
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {selectedShifts.has(shift.id) ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            {/* Add to Roster Button */}
            <button
              className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-2 px-4 rounded-md text-sm font-semibold shadow-md transition-all duration-200 transform hover:scale-105"
              onClick={handleAddShift}
              disabled={
                selectedShifts.size === 0 ||
                filteredEmployees.length === 0 ||
                (assignMode === "employee" && selectedEmployees.size === 0)
              }
            >
              Add to Roster{" "}
              {selectedShifts.size > 0 && `(${selectedShifts.size} shifts)`}
            </button>

            {/* Pending Assignments (added) */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Pending Assignments
              </h4>
              {rosterAssignments.length === 0 ? (
                <div className="text-xs text-gray-500">
                  No shifts added yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {rosterAssignments.map((a, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-50 border rounded-md"
                    >
                      <div className="text-sm">
                        <div className="font-medium text-gray-800">
                          {a.shift.shiftName}{" "}
                          <span className="text-xs text-gray-500">
                            ({a.shift.shiftStart} - {a.shift.shiftEnd})
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {getCompanyName(a.company)}
                          {a.department && a.department !== "0" && (
                            <> {` > ${getDepartmentName(a.department)}`} </>
                          )}
                          {a.subDepartment && a.subDepartment !== "0" && (
                            <>
                              {" "}
                              {` > ${getSubDepartmentName(a.subDepartment)}`}
                            </>
                          )}
                          {" · "} {a.employees.length} employees {" · "}{" "}
                          {a.dateFrom} → {a.dateTo}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAssignment(idx)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setRosterAssignments([])}
                      className="text-xs text-gray-600 hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Save Roster Button */}
            <div className="flex space-x-2 mt-2">
              <button
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-4 rounded-md text-sm font-semibold shadow-md transition-all duration-200"
                onClick={handleViewSummary}
              >
                View Summary
              </button>
              <button
                className={`flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 px-4 rounded-md text-sm font-semibold shadow-md transition-all duration-200 ${
                  isSaving ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleSaveRoster}
                disabled={isSaving} // allow click to show error when no assignments
              >
                {isSaving ? (
                  <>
                    <div className="inline-block h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  "Process Roster"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add this modal component just before the closing div of your return statement */}
      {showSummaryModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowSummaryModal(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold mb-4">Roster Summary</h2>
            <div className="overflow-x-auto max-h-[70vh]">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border">Company</th>
                    <th className="px-4 py-2 border">Department</th>
                    <th className="px-4 py-2 border">Sub Department</th>
                    <th className="px-4 py-2 border">Shift</th>
                    <th className="px-4 py-2 border">Employees</th>
                    <th className="px-4 py-2 border">Date Range</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterAssignments.map((assignment, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-4 py-2 border">
                        {getCompanyName(assignment.company)}
                      </td>
                      <td className="px-4 py-2 border">
                        {getDepartmentName(assignment.department)}
                      </td>
                      <td className="px-4 py-2 border">
                        {getSubDepartmentName(assignment.subDepartment)}
                      </td>
                      <td className="px-4 py-2 border">
                        <div className="font-medium">
                          {assignment.shift.shiftName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {assignment.shift.shiftStart} -{" "}
                          {assignment.shift.shiftEnd}
                        </div>
                      </td>
                      <td className="px-4 py-2 border">
                        {assignment.employees.length} employees
                      </td>
                      <td className="px-4 py-2 border">
                        <div>{assignment.dateFrom}</div>
                        <div>{assignment.dateTo}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
                onClick={() => setShowSummaryModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Rosters Modal - Updated with Search */}
      {showAllRostersModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowAllRostersModal(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold mb-4">All Rosters</h2>

            {/* Search Form */}
            <div className="mb-6 border rounded-lg p-4 bg-gray-50">
              <h3 className="text-md font-semibold mb-3">Search Rosters</h3>
              <form
                onSubmit={handleRosterSearch}
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={rosterSearchParams.date_from}
                    onChange={(e) =>
                      setRosterSearchParams({
                        ...rosterSearchParams,
                        date_from: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={rosterSearchParams.date_to}
                    onChange={(e) =>
                      setRosterSearchParams({
                        ...rosterSearchParams,
                        date_to: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Company
                  </label>
                  <select
                    value={rosterSearchParams.company_id}
                    onChange={(e) =>
                      setRosterSearchParams({
                        ...rosterSearchParams,
                        company_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={rosterSearchParams.department_id}
                    onChange={(e) =>
                      setRosterSearchParams({
                        ...rosterSearchParams,
                        department_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dep) => (
                      <option key={dep.id} value={dep.id}>
                        {dep.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Sub Department
                  </label>
                  <select
                    value={rosterSearchParams.sub_department_id}
                    onChange={(e) =>
                      setRosterSearchParams({
                        ...rosterSearchParams,
                        sub_department_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Sub Department</option>
                    {subDepartments.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div> */}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter employee ID"
                    value={rosterSearchParams.employee_id}
                    onChange={(e) =>
                      setRosterSearchParams({
                        ...rosterSearchParams,
                        employee_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-3 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetRosterSearch}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <div className="inline-block h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Searching...
                      </>
                    ) : (
                      "Search"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto max-h-[55vh]">
              {loadingAllRosters ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading rosters...</p>
                </div>
              ) : (
                <>
                  <table className="min-w-full text-sm border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 border">Roster ID</th>
                        <th className="px-4 py-2 border">Shift Code</th>
                        <th className="px-4 py-2 border">Company</th>
                        <th className="px-4 py-2 border">Department</th>
                        <th className="px-4 py-2 border">Sub Dept</th>
                        <th className="px-4 py-2 border">Employee</th>
                        <th className="px-4 py-2 border">Date From</th>
                        <th className="px-4 py-2 border">Date To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(
                        (rosterSearchPerformed
                          ? searchedRosters
                          : allRosters) || []
                      ).map((r, idx) => (
                        <tr
                          key={r.id || idx}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="px-4 py-2 border">{r.roster_id}</td>
                          <td className="px-4 py-2 border">{r.shift_code}</td>
                          <td className="px-4 py-2 border">
                            {r.company_name ||
                              getCompanyName(r.company_id?.toString())}
                          </td>
                          <td className="px-4 py-2 border">
                            {r.department_name ||
                              getDepartmentName(r.department_id?.toString())}
                          </td>
                          <td className="px-4 py-2 border">
                            {r.sub_department_name ||
                              getSubDepartmentName(
                                r.sub_department_id?.toString()
                              )}
                          </td>
                          <td className="px-4 py-2 border">
                            {r.employee_name || r.employee_id}
                          </td>
                          <td className="px-4 py-2 border">{r.date_from}</td>
                          <td className="px-4 py-2 border">{r.date_to}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Show a friendly message when a search was performed but returned no results */}
                  {rosterSearchPerformed && searchedRosters.length === 0 && (
                    <div className="p-6 text-center text-gray-600">
                      <p className="font-medium">
                        {searchMessage ||
                          "No roster data found for the given criteria."}
                      </p>
                      <p className="text-sm mt-2 text-gray-500">
                        Adjust your filters or click Reset to show all rosters.
                      </p>
                    </div>
                  )}
                  {/* If no search performed and no data at all */}
                  {!rosterSearchPerformed && allRosters.length === 0 && (
                    <div className="p-6 text-center text-gray-600">
                      <p className="font-medium">No roster data found.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                {searchedRosters.length > 0
                  ? `Showing ${searchedRosters.length} search results`
                  : allRosters.length > 0
                  ? `Showing ${allRosters.length} total rosters`
                  : ""}
              </div>
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
                onClick={() => setShowAllRostersModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterManagementSystem;
