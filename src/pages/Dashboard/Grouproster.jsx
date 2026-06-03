import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  Search,
  Plus,
  Trash2,
  X,
  Eye,
  AlertTriangle,
} from "lucide-react";
import ShiftScheduleService from "@services/ShiftScheduleService";
import RosterService from "@services/RosterService";
import {
  fetchCompanies,
  fetchDepartments,
  fetchSubDepartments,
  employeesBySubDepartment,
  employeesByCompany,
} from "@services/ApiDataService";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import axios from "@utils/axios";
import DatePickerInput from "@components/DatePickerInput";
import moment from "moment";

const RosterManagementSystem = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rosterDate, setRosterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSubDepartment, setSelectedSubDepartment] = useState("");
  const [assignMode, setAssignMode] = useState("designation");
  const [rosterAssignments, setRosterAssignments] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showAllRostersModal, setShowAllRostersModal] = useState(false);
  const [allRosters, setAllRosters] = useState([]);
  const [loadingAllRosters, setLoadingAllRosters] = useState(false);
  const [deletingRoster, setDeletingRoster] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [subDepartments, setSubDepartments] = useState([]);
  const [isLoadingSubDepartments, setIsLoadingSubDepartments] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const [shiftSearchTerm, setShiftSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [rosterSearchParams, setRosterSearchParams] = useState({
    date_from: "",
    date_to: "",
    company_id: "",
    department_id: "",
    employee_id: "",
  });
  const [searchedRosters, setSearchedRosters] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [rosterSearchPerformed, setRosterSearchPerformed] = useState(false);
  const [isCompanyWise, setIsCompanyWise] = useState(false);
  const [selectedRosterIds, setSelectedRosterIds] = useState(new Set());
  const [selectAllRosters, setSelectAllRosters] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    const today = new Date();
    const defaultDateFrom = today.toISOString().split("T")[0];
    const defaultDateTo = new Date(today.setDate(today.getDate() + 30))
      .toISOString()
      .split("T")[0];
    setDateFrom(defaultDateFrom);
    setDateTo(defaultDateTo);
    setRosterDate(defaultDateFrom);
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    await fetchCompaniesData();
    await fetchShiftsData();
  };

  const fetchCompaniesData = async () => {
    setIsLoadingCompanies(true);
    try {
      const data = await fetchCompanies();
      setCompanies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const fetchDepartmentsData = async () => {
    setIsLoadingDepartments(true);
    try {
      const data = await fetchDepartments();
      setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const fetchSubDepartmentsData = async () => {
    setIsLoadingSubDepartments(true);
    try {
      const data = await fetchSubDepartments();
      setSubDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSubDepartments(false);
    }
  };

  const fetchEmployeesData = async () => {
    try {
      setIsLoadingEmployees(true);
      let data = [];
      if (isCompanyWise) {
        data = await employeesByCompany(selectedCompany);
      } else if (selectedSubDepartment) {
        data = await employeesBySubDepartment(selectedSubDepartment);
      } else {
        const filters = {};
        if (selectedCompany) filters.company_id = selectedCompany;
        if (selectedDepartment) filters.department_id = selectedDepartment;
        data = await RosterService.getEmployeesForRoster(filters);
      }

      setEmployees(
        data.map((emp) => {
          let empName = emp.full_name || emp.name_with_initials || emp.first_name;
          if (!empName && emp.first_name && emp.last_name) {
            empName = `${emp.first_name} ${emp.last_name}`;
          }

          return {
            id: emp.id,
            empCode:
              emp.employee_code || emp.attendance_employee_no || `ID:${emp.id}`,
            name: empName || "Unknown Employee",
            department_id: emp.department_id?.toString(),
            sub_department_id: emp.sub_department_id?.toString(),
          };
        })
      );
    } catch (err) {
      console.error(err);
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
      console.error(err);
    } finally {
      setIsLoadingShifts(false);
    }
  };

  useEffect(() => {
    if (selectedCompany) fetchDepartmentsData();
    else setSelectedDepartment("");
  }, [selectedCompany]);
  useEffect(() => {
    if (selectedDepartment) fetchSubDepartmentsData();
    else setSelectedSubDepartment("");
  }, [selectedDepartment]);
  useEffect(() => {
    if (selectedCompany) fetchEmployeesData();
    else setEmployees([]);
  }, [
    selectedCompany,
    selectedDepartment,
    selectedSubDepartment,
    isCompanyWise,
  ]);

  const filteredDepartments = useMemo(
    () =>
      departments.filter((dep) =>
        selectedCompany ? dep.company_id?.toString() === selectedCompany : true
      ),
    [selectedCompany, departments]
  );
  const filteredSubDepartments = useMemo(
    () =>
      subDepartments.filter((sub) =>
        selectedDepartment
          ? sub.department_id?.toString() === selectedDepartment
          : true
      ),
    [selectedDepartment, subDepartments]
  );

  const filteredEmployees = useMemo(() => {
    let filtered = employees;
    if (searchTerm) {
      filtered = filtered.filter(
        (emp) =>
          (emp.name &&
            emp.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (emp.empCode &&
            emp.empCode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return filtered;
  }, [employees, searchTerm]);

  const filteredAndPaginatedShifts = useMemo(() => {
    const filtered = shifts.filter(
      (shift) =>
        shift.scode.toLowerCase().includes(shiftSearchTerm.toLowerCase()) ||
        shift.shiftName.toLowerCase().includes(shiftSearchTerm.toLowerCase())
    );
    const startIndex = (currentPage - 1) * rowsPerPage;
    return {
      shifts: filtered.slice(startIndex, startIndex + rowsPerPage),
      totalShifts: filtered.length,
    };
  }, [shifts, shiftSearchTerm, currentPage]);

  const getCompanyName = (id) =>
    companies.find((c) => c.id.toString() === id)?.name || "";
  const getDepartmentName = (id) =>
    departments.find((d) => d.id.toString() === id)?.name || "";
  const getSubDepartmentName = (id) =>
    subDepartments.find((s) => s.id.toString() === id)?.name || "";

  const toggleShiftSelection = (shift) => {
    setSelectedShifts((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(shift.id)) newSelected.delete(shift.id);
      else newSelected.add(shift.id);
      return newSelected;
    });
  };

  const handleAddShift = () => {
    if (selectedShifts.size === 0) return;
    if (!selectedCompany) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select a company",
      });
      return;
    }

    let employeesToAssign =
      assignMode === "designation"
        ? filteredEmployees.map((e) => e.id)
        : Array.from(selectedEmployees);
    if (employeesToAssign.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Employees",
        text: "Select at least one employee",
      });
      return;
    }

    const shiftsToAssign = shifts.filter((shift) =>
      selectedShifts.has(shift.id)
    );
    const newAssignments = shiftsToAssign.map((shift) => ({
      company: selectedCompany,
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

  const handleRemoveAssignment = (idx) =>
    setRosterAssignments((prev) => prev.filter((_, i) => i !== idx));

  const handleEmployeeSelect = (empId) => {
    if (assignMode !== "employee") return;
    setSelectedEmployees((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(empId)) newSet.delete(empId);
      else newSet.add(empId);
      return newSet;
    });
  };

  const handleSaveRoster = async (isOverwrite = false) => {
    if (rosterAssignments.length === 0) {
      Swal.fire({
        icon: "error",
        title: "No Assignments",
        text: "Please add a shift assignment.",
      });
      return;
    }

    try {
      setIsSaving(true);
      const rosterEntries = [];
      const rosterId = Date.now();

      for (const assignment of rosterAssignments) {
        assignment.employees.forEach((employeeId) => {
          rosterEntries.push({
            roster_id: rosterId,
            shift_code: assignment.shift.id,
            company_id: parseInt(assignment.company),
            department_id:
              assignment.department === "0"
                ? null
                : parseInt(assignment.department),
            sub_department_id:
              assignment.subDepartment === "0"
                ? null
                : parseInt(assignment.subDepartment),
            employee_id: parseInt(employeeId),
            date_from: assignment.dateFrom,
            date_to: assignment.dateTo,
          });
        });
      }

      await axios.post(`/rosters/bulk?overwrite=${isOverwrite}`, rosterEntries);

      Swal.fire({
        icon: "success",
        title: "Assigned!",
        text: "Roster assignments saved successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
      setRosterAssignments([]);
      setSelectedCompany("");
      setSelectedDepartment("");
      setSelectedShifts(new Set());
      setSelectedEmployees(new Set());
    } catch (error) {
      if (error.response && error.response.status === 409) {
        const conflicts = error.response.data.conflicts || [];

        let conflictText = `<div style="text-align: left; font-size: 14px;" class="p-3 bg-orange-50 text-orange-900 border border-orange-200 rounded">`;
        conflictText += `<p class="font-bold mb-2">The following employees already have shifts assigned on these dates:</p><ul class="list-disc pl-5 max-h-40 overflow-y-auto mb-3">`;

        conflicts.slice(0, 8).forEach((c) => {
          conflictText += `<li><b>${c.employee}</b> on <b>${c.date}</b> (${c.shift})</li>`;
        });

        if (conflicts.length > 8)
          conflictText += `<li>... and ${conflicts.length - 8
            } more overlaps.</li>`;

        conflictText += `</ul><p class="font-bold text-gray-800 border-t pt-2 mt-2">Do you want to overwrite these existing shifts?</p></div>`;

        Swal.fire({
          title: "Schedule Conflict!",
          html: conflictText,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Yes, Overwrite them!",
          cancelButtonText: "No, Cancel",
        }).then((result) => {
          if (result.isConfirmed) handleSaveRoster(true);
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Failed to save roster. Please try again.",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewAllRosters = async () => {
    setShowAllRostersModal(true);
    setLoadingAllRosters(true);
    try {
      const data = await RosterService.getAllRosters();
      setAllRosters(normalizeRosterItems(Array.isArray(data) ? data : []));
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load rosters",
      });
      setAllRosters([]);
    } finally {
      setLoadingAllRosters(false);
    }
  };

  const normalizeRosterItems = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
      const rd = item.roster_details || item.roster || {};
      const org = item.organization_details || {};
      const emp = item.employee_details || {};
      const company = org.company || item.company || {};
      const dept = org.department || item.department || {};

      return {
        id: rd.id ?? item.id,
        roster_id: rd.roster_id ?? item.roster_id ?? rd.id ?? item.id,
        shift_code: rd.shift_code ?? item.shift_code ?? "",
        shift_name: rd.shift_name ?? item.shift_name ?? "",
        start_time: rd.start_time ?? item.start_time ?? null,
        end_time: rd.end_time ?? item.end_time ?? null,
        company_name: company.name ?? item.company_name ?? "",
        department_name: dept.name ?? item.department_name ?? "",
        employee_id: emp.id ?? item.employee_id ?? null,
        employee_code: emp.employee_code ?? item.employee_code ?? "-",
        employee_name:
          emp.full_name ?? emp.name ?? item.employee_name ?? "Unknown",
        date_from: rd.date_from ?? item.date_from ?? "",
        date_to: rd.date_to ?? item.date_to ?? "",
      };
    });
  };

  const handleRosterSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setRosterSearchPerformed(true);
    try {
      const cleanParams = {};
      Object.keys(rosterSearchParams).forEach((key) => {
        if (rosterSearchParams[key] && rosterSearchParams[key].trim() !== "")
          cleanParams[key] = rosterSearchParams[key].trim();
      });
      const data = await RosterService.searchRosters(cleanParams);
      const flattenedRosters = normalizeRosterItems(
        Array.isArray(data) ? data : []
      );
      setSearchedRosters(flattenedRosters);
    } catch (error) {
      setSearchedRosters([]);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to search rosters",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const resetRosterSearch = () => {
    setRosterSearchParams({
      date_from: "",
      date_to: "",
      company_id: "",
      department_id: "",
      employee_id: "",
    });
    setSearchedRosters([]);
    setRosterSearchPerformed(false);
  };

  const handleDeleteConfirm = (roster) => {
    setDeletingRoster(roster);
    setShowDeleteConfirm(true);
  };

  const handleDeleteRoster = async () => {
    if (!deletingRoster) return;
    try {
      await RosterService.deleteRoster(deletingRoster.id);
      setAllRosters((prev) =>
        prev.filter((r) => r.id !== deletingRoster.id)
      );
      setSearchedRosters((prev) =>
        prev.filter((r) => r.id !== deletingRoster.id)
      );
      toast.success("Roster deleted successfully");
      setShowDeleteConfirm(false);
      setDeletingRoster(null);
    } catch (error) {
      toast.error("Failed to delete roster");
    }
  };

  const handleSelectAllRosters = () => {
    if (selectAllRosters) {
      setSelectedRosterIds(new Set());
    } else {
      const currentRosters = rosterSearchPerformed
        ? searchedRosters
        : allRosters;
      setSelectedRosterIds(new Set(currentRosters.map((r) => r.id)));
    }
    setSelectAllRosters(!selectAllRosters);
  };

  const handleSelectRoster = (rosterId) => {
    const newSelected = new Set(selectedRosterIds);
    if (newSelected.has(rosterId)) newSelected.delete(rosterId);
    else newSelected.add(rosterId);
    setSelectedRosterIds(newSelected);
  };

  const handleBulkDeleteRosters = async () => {
    if (selectedRosterIds.size === 0) return;
    const result = await Swal.fire({
      title: "Delete Selected?",
      text: `Delete ${selectedRosterIds.size} roster(s)?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete!",
    });
    if (!result.isConfirmed) return;

    setIsBulkDeleting(true);
    try {
      await RosterService.bulkDeleteRosters(Array.from(selectedRosterIds));
      setAllRosters((prev) =>
        prev.filter((r) => !selectedRosterIds.has(r.id))
      );
      setSearchedRosters((prev) =>
        prev.filter((r) => !selectedRosterIds.has(r.id))
      );
      setSelectedRosterIds(new Set());
      setSelectAllRosters(false);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to delete",
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleCloseAllRostersModal = () => {
    setShowAllRostersModal(false);
    setSelectedRosterIds(new Set());
    setSelectAllRosters(false);
  };

  return (
    <div className="bg-gray-100 flex flex-col">
      {/* Top Header */}
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-xl font-bold">Roster Management System</h1>
        <button
          className="bg-white text-blue-700 px-4 py-2 rounded shadow hover:bg-blue-100 font-semibold"
          onClick={handleViewAllRosters}
        >
          View All Rosters
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Filters */}
        <div className="w-80 bg-white border-r border-gray-300 flex flex-col shadow-sm">
          {/* Date Range Section */}
          <div className="p-4 border-b border-gray-300">
            <div className="bg-gradient-to-r from-orange-100 to-orange-50 border border-orange-300 rounded-lg p-4 mb-4 shadow-sm">
              <h3 className="font-semibold text-sm mb-3 text-orange-800 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Roster Date
              </h3>
              <DatePickerInput
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
                <DatePickerInput
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date To
                </label>
                <DatePickerInput
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Company/Department/SubDepartment Dropdowns */}
          <div className="p-4 border-b border-gray-300">
            <h3 className="font-semibold text-sm mb-3 text-gray-800">
              Select Company / Department / Sub Department
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Company
                </label>
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
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Department {!isCompanyWise && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setSelectedSubDepartment("");
                  }}
                  disabled={!selectedCompany || isCompanyWise}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isCompanyWise ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                >
                  <option value="">
                    {isCompanyWise ? "Not Required" : "Select Department"}
                  </option>
                  {filteredDepartments.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sub Department {!isCompanyWise && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={selectedSubDepartment}
                  onChange={(e) => setSelectedSubDepartment(e.target.value)}
                  disabled={!selectedDepartment || isCompanyWise}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isCompanyWise ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                >
                  <option value="">
                    {isCompanyWise ? "Not Required" : "Select Sub Department"}
                  </option>
                  {filteredSubDepartments.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Assign Mode */}
          <div className="p-4 border-b border-gray-300">
            {!isCompanyWise && (
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
                  <label htmlFor="employee" className="text-xs font-medium text-gray-700">
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
                  <label htmlFor="designation" className="text-xs font-medium text-gray-700">
                    Designation Wise
                  </label>
                </div>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="companyWise"
                  checked={isCompanyWise}
                  onChange={() => {
                    if (!isCompanyWise) {
                      setSelectedDepartment("");
                      setSelectedSubDepartment("");
                    }
                    setIsCompanyWise(!isCompanyWise);
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="companyWise" className="text-sm font-medium text-gray-700">
                  Company Wise
                </label>
                {isCompanyWise && selectedCompany && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                    {employees.length} employees
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Middle Panel */}
        <div className="w-[400px] min-w-[400px] max-w-[400px] p-4 border-r border-gray-300 bg-gray-50">
          <div className="flex items-center justify-between mb-2 p-4 border-b border-gray-300 bg-gray-50 sticky top-0 z-10">
            <div>
              <span className="text-xs text-gray-500">Selected: </span>
              <span className="font-semibold text-blue-700">
                {selectedCompany && getCompanyName(selectedCompany)}
                {!isCompanyWise && selectedDepartment && ` > ${getDepartmentName(selectedDepartment)}`}
                {!isCompanyWise && selectedSubDepartment && ` > ${getSubDepartmentName(selectedSubDepartment)}`}
              </span>
            </div>
            {((selectedDepartment && selectedSubDepartment) || (isCompanyWise && selectedCompany)) && filteredEmployees.length > 0 && (
              <button
                className="flex items-center text-blue-600 hover:underline text-xs"
                onClick={() => setShowEmployeeModal(true)}
              >
                <Eye className="w-4 h-4 mr-1" /> View All ({filteredEmployees.length})
              </button>
            )}
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-sm mb-3 text-gray-800">
              {isCompanyWise && selectedCompany ? "Employees" : "Employees"}
            </h3>
            <div className="h-[calc(100vh-280px)] overflow-y-auto">
              {/* Employee search */}
              {((isCompanyWise && selectedCompany) || (selectedDepartment && selectedSubDepartment)) && (
                <div className="mb-3 relative sticky top-0 z-10 bg-gray-50 pb-2">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                {isLoadingEmployees ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="h-6 w-6 mr-2 rounded-full border-2 border-t-blue-500 animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : filteredEmployees.length === 0 && (selectedCompany || selectedDepartment) ? (
                  <div className="p-4 text-center text-gray-500">No employees found</div>
                ) : (
                  filteredEmployees.slice(0, 15).map((emp) => (
                    <div
                      key={emp.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedEmployees.has(emp.id.toString())
                        ? "bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300 shadow-md"
                        : "hover:bg-gray-100 border border-gray-300 bg-white"
                        }`}
                      onClick={() => assignMode === "employee" && handleEmployeeSelect(emp.id.toString())}
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
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-300 bg-gradient-to-r from-orange-50 to-orange-25">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-800">Shift Selection</h3>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{moment(dateFrom).format("yyyy/MM/DD")} - {moment(dateTo).format("yyyy/MM/DD")}</span>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <div className="flex-1 overflow-hidden border border-gray-300 rounded-lg shadow mb-4 flex flex-col">
              <div className="p-4 border-b border-gray-300">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search shifts by code or name..."
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={shiftSearchTerm}
                    onChange={(e) => {
                      setShiftSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold border-r border-blue-500">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold border-r border-blue-500">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold border-r border-blue-500">Start</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold border-r border-blue-500">End</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold">Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndPaginatedShifts.shifts.map((shift, index) => (
                      <tr
                        key={shift.id}
                        className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors duration-150 border-b border-gray-300`}
                      >
                        <td className="px-4 py-3 border-r border-gray-300 font-mono text-blue-600 font-bold">{shift.scode}</td>
                        <td className="px-4 py-3 border-r border-gray-300 font-medium">{shift.shiftName}</td>
                        <td className="px-4 py-3 border-r border-gray-300 text-green-600 font-mono font-semibold">{shift.shiftStart}</td>
                        <td className="px-4 py-3 border-r border-gray-300 text-red-600 font-mono font-semibold">{shift.shiftEnd}</td>
                        <td className="px-4 py-3 text-center border-gray-300">
                          <button
                            onClick={() => toggleShiftSelection(shift)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto ${selectedShifts.has(shift.id) ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
                          >
                            {selectedShifts.has(shift.id) ? "✓" : "+"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-2 px-4 rounded-md text-sm font-semibold shadow-md transition-all duration-200 transform hover:scale-105 mb-4 disabled:opacity-50 disabled:scale-100"
              onClick={handleAddShift}
              disabled={selectedShifts.size === 0 || filteredEmployees.length === 0 || (assignMode === "employee" && selectedEmployees.size === 0)}
            >
              Add to Pending List {selectedShifts.size > 0 && `(${selectedShifts.size} shifts)`}
            </button>

            <div className="h-32 overflow-y-auto border border-gray-300 rounded p-2 mb-3 bg-gray-50">
              <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Pending Assignments</h4>
              {rosterAssignments.length === 0 ? (
                <div className="text-xs text-gray-400">No shifts added yet.</div>
              ) : (
                rosterAssignments.map((a, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white border border-gray-300 p-2 rounded mb-1 text-sm shadow-sm">
                    <div>
                      <span className="font-bold text-blue-700">{a.shift.shiftName}</span> <span className="text-xs text-gray-500">({a.dateFrom} to {a.dateTo})</span>
                      <div className="text-xs text-gray-600">{a.employees.length} employees</div>
                    </div>
                    <button onClick={() => handleRemoveAssignment(idx)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))
              )}
            </div>

            <div className="flex space-x-2 mt-2">
              <button className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-4 rounded-md text-sm font-semibold shadow-md transition-all duration-200" onClick={() => setShowSummaryModal(true)}>
                View Summary
              </button>
              <button
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 px-4 rounded-md text-sm font-semibold shadow-md transition-all duration-200 disabled:opacity-50"
                onClick={() => handleSaveRoster(false)}
                disabled={isSaving || rosterAssignments.length === 0}
              >
                {isSaving ? "Saving..." : "Save Roster to Database"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowSummaryModal(false)}>
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold mb-4">Pending Roster Summary</h2>
            <div className="overflow-x-auto max-h-[70vh] border border-gray-300 rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border-b border-gray-300">Company</th>
                    <th className="px-4 py-2 border-b border-gray-300">Shift</th>
                    <th className="px-4 py-2 border-b border-gray-300">Employees</th>
                    <th className="px-4 py-2 border-b border-gray-300">Date Range</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterAssignments.length === 0 ? (
                    <tr><td colSpan="4" className="text-center p-4 text-gray-500">No pending assignments.</td></tr>
                  ) : (
                    rosterAssignments.map((a, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-2 border-b border-gray-300">{getCompanyName(a.company)}</td>
                        <td className="px-4 py-2 border-b border-gray-300 font-medium text-blue-700">{a.shift.shiftName}</td>
                        <td className="px-4 py-2 border-b border-gray-300 text-center">{a.employees.length}</td>
                        <td className="px-4 py-2 border-b border-gray-300">{a.dateFrom} <br />to<br /> {a.dateTo}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ALL ROSTERS MODAL */}
      {showAllRostersModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-[90%] w-[1200px] p-6 relative h-[90vh] flex flex-col border border-gray-300">
            <button className="absolute top-4 right-4 text-gray-500 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors" onClick={handleCloseAllRostersModal}>
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Manage All Rosters</h2>

            {/* Search Filters */}
            <div className="mb-4 border border-gray-300 rounded-lg p-4 bg-gray-50 shadow-sm">
              <form onSubmit={handleRosterSearch} className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Company</label>
                  <select value={rosterSearchParams.company_id} onChange={(e) => setRosterSearchParams({ ...rosterSearchParams, company_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="">All Companies</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
                  <select value={rosterSearchParams.department_id} onChange={(e) => setRosterSearchParams({ ...rosterSearchParams, department_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Date From</label><DatePickerInput value={rosterSearchParams.date_from} onChange={(e) => setRosterSearchParams({ ...rosterSearchParams, date_from: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm" /></div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Date To</label><DatePickerInput value={rosterSearchParams.date_to} onChange={(e) => setRosterSearchParams({ ...rosterSearchParams, date_to: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm" /></div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Emp No / ID</label><input type="text" placeholder="e.g. EMP003" value={rosterSearchParams.employee_id} onChange={(e) => setRosterSearchParams({ ...rosterSearchParams, employee_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm" /></div>

                <div className="col-span-2 md:col-span-5 flex justify-end space-x-3 mt-2">
                  <button type="button" onClick={resetRosterSearch} className="px-4 py-2 border border-gray-400 rounded text-sm text-gray-700 bg-white hover:bg-gray-100 font-semibold shadow-sm">Reset</button>
                  <button type="submit" disabled={isSearching} className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 shadow-md flex items-center justify-center min-w-[100px]">
                    {isSearching ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Search"}
                  </button>
                </div>
              </form>
            </div>

            {/* Bulk Delete Button */}
            {selectedRosterIds.size > 0 && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center shadow-sm">
                <span className="text-red-700 font-bold">{selectedRosterIds.size} Rosters Selected</span>
                <button onClick={handleBulkDeleteRosters} disabled={isBulkDeleting} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 flex items-center gap-2 font-bold shadow-sm">
                  {isBulkDeleting ? "Deleting..." : <><Trash2 className="w-4 h-4" /> Delete Selected</>}
                </button>
              </div>
            )}

            {/* Roster Table */}
            <div className="flex-1 overflow-y-auto border border-gray-300 rounded-lg shadow-sm">
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-gray-200 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-3 border-b border-r border-gray-300 text-center w-12"><input type="checkbox" checked={selectAllRosters} onChange={handleSelectAllRosters} className="w-4 h-4 text-blue-600 rounded cursor-pointer" /></th>
                    <th className="p-3 border-b border-r border-gray-300 text-left font-bold text-gray-700">Emp No (ID)</th>
                    <th className="p-3 border-b border-r border-gray-300 text-left font-bold text-gray-700">Employee Name</th>
                    <th className="p-3 border-b border-r border-gray-300 text-left font-bold text-gray-700">Shift</th>
                    <th className="p-3 border-b border-r border-gray-300 text-center font-bold text-gray-700">Date From</th>
                    <th className="p-3 border-b border-r border-gray-300 text-center font-bold text-gray-700">Date To</th>
                    <th className="p-3 border-b border-gray-300 text-center font-bold text-gray-700 w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAllRosters ? (
                    <tr><td colSpan="7" className="p-8 text-center text-gray-500 font-medium">Loading rosters...</td></tr>
                  ) : (rosterSearchPerformed ? searchedRosters : allRosters).length === 0 ? (
                    <tr><td colSpan="7" className="p-8 text-center text-gray-500 font-medium">No rosters found.</td></tr>
                  ) : (
                    (rosterSearchPerformed ? searchedRosters : allRosters).map((roster, idx) => (
                      <tr key={roster.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}>
                        <td className="p-3 border-b border-r border-gray-200 text-center">
                          <input type="checkbox" checked={selectedRosterIds.has(roster.id)} onChange={() => handleSelectRoster(roster.id)} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                        </td>
                        <td className="p-3 border-b border-r border-gray-200 font-mono font-bold text-blue-700">
                          {roster.employee_code && roster.employee_code !== "-" ? roster.employee_code : `ID: ${roster.employee_id}`}
                        </td>
                        <td className="p-3 border-b border-r border-gray-200 font-medium text-gray-800">{roster.employee_name || "-"}</td>
                        <td className="p-3 border-b border-r border-gray-200">
                          <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded text-xs font-bold mr-2">{roster.shift_code}</span>
                          <span className="text-gray-600 text-xs font-mono">({roster.start_time} - {roster.end_time})</span>
                        </td>
                        <td className="p-3 border-b border-r border-gray-200 text-center text-green-700 font-medium font-mono">{roster.date_from || "-"}</td>
                        <td className="p-3 border-b border-r border-gray-200 text-center text-red-700 font-medium font-mono">{roster.date_to || "-"}</td>
                        <td className="p-3 border-b border-gray-200 text-center">
                          <button onClick={() => handleDeleteConfirm(roster)} className="text-red-500 hover:text-white hover:bg-red-500 border border-red-200 p-1.5 rounded transition-colors shadow-sm"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end pt-4 border-t border-gray-200">
              <button className="bg-gray-500 text-white px-6 py-2 rounded shadow hover:bg-gray-600 font-bold" onClick={handleCloseAllRostersModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 text-center border border-gray-200">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2 text-gray-800">Delete Roster?</h3>
            <p className="text-gray-600 mb-6 text-sm">Are you sure you want to remove <b>{deletingRoster?.employee_name}</b>'s shift on <b>{deletingRoster?.date_from}</b>?</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-5 py-2 border border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={handleDeleteRoster} className="px-5 py-2 bg-red-600 text-white rounded font-semibold shadow hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterManagementSystem;





/*
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
  AlertTriangle,
} from "lucide-react";
import ShiftScheduleService from "@services/ShiftScheduleService";
import RosterService from "@services/RosterService";
import {
  fetchCompanies,
  fetchDepartments,
  fetchSubDepartments,
  employeesBySubDepartment,
  employeesByCompany,
} from "@services/ApiDataService";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const RosterManagementSystem = () => {
  // State for form inputs
  const [_selectedEmployee, _setSelectedEmployee] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rosterDate, setRosterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [_showAddShift, setShowAddShift] = useState(false);
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
  const [deletingRoster, setDeletingRoster] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
  const [_employeesError, setEmployeesError] = useState(null);

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
    roster_id: "",
  });
  const [searchedRosters, setSearchedRosters] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // New state: whether a search has been performed and a user-visible message
  const [rosterSearchPerformed, setRosterSearchPerformed] = useState(false);
  const [_searchMessage, setSearchMessage] = useState("");

  // Add a new state for companyWise checkbox
  const [isCompanyWise, setIsCompanyWise] = useState(false);

  // Add new state variables for bulk operations
  const [selectedRosterIds, setSelectedRosterIds] = useState(new Set());
  const [selectAllRosters, setSelectAllRosters] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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
        await RosterService.createRoster(rosterEntries);
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
  const _addOrUpdateShift = (shift) => {
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
    } catch {
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

         // ✅ NEW
      shift_name: rd.shift_name ?? item.shift_name ?? "",
      start_time: rd.start_time ?? item.start_time ?? null,
      end_time: rd.end_time ?? item.end_time ?? null,
  
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
        if (rosterSearchParams[key] && rosterSearchParams[key].trim() !== '') {
          cleanParams[key] = rosterSearchParams[key].trim();
        }
      });

      console.log('Search parameters being sent:', cleanParams); // Debug log

      const data = await RosterService.searchRosters(cleanParams);
      console.log('Search response received:', data); // Debug log

      // Normalize nested API structure just like "All Rosters"
      const flattenedRosters = normalizeRosterItems(
        Array.isArray(data) ? data : []
      );

      console.log('Normalized search results:', flattenedRosters); // Debug log

      if (flattenedRosters.length === 0) {
        setSearchedRosters([]);
        setSearchMessage("No roster data matched your search criteria.");
      } else {
        setSearchedRosters(flattenedRosters);
        setSearchMessage(`Found ${flattenedRosters.length} matching roster(s).`);
      }
    } catch (error) {
      console.error('Search error:', error); // Debug log
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
      roster_id: "", // Add this line
    });
    setSearchedRosters([]);
    setRosterSearchPerformed(false);
    setSearchMessage("");
  };

  // Add delete confirmation handler
  const handleDeleteConfirm = (roster) => {
    setDeletingRoster(roster);
    setShowDeleteConfirm(true);
  };

  // Add actual delete handler
  const handleDeleteRoster = async () => {
    if (!deletingRoster) return;

    try {
      await RosterService.deleteRoster(deletingRoster.id);

      // Remove from current list
      setAllRosters((prevRosters) =>
        prevRosters.filter((r) => r.id !== deletingRoster.id)
      );

      // Also remove from searched results if exists
      setSearchedRosters((prevRosters) =>
        prevRosters.filter((r) => r.id !== deletingRoster.id)
      );

      toast.success("Roster deleted successfully");
      setShowDeleteConfirm(false);
      setDeletingRoster(null);
    } catch (error) {
      console.error("Error deleting roster:", error);
      toast.error(error.message || "Failed to delete roster");
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingRoster(null);
  };

  // Add bulk selection handlers
  const handleSelectAllRosters = () => {
    if (selectAllRosters) {
      setSelectedRosterIds(new Set());
    } else {
      const currentRosters = rosterSearchPerformed ? searchedRosters : allRosters;
      const allIds = new Set(currentRosters.map(roster => roster.id));
      setSelectedRosterIds(allIds);
    }
    setSelectAllRosters(!selectAllRosters);
  };

  const handleSelectRoster = (rosterId) => {
    const newSelected = new Set(selectedRosterIds);
    if (newSelected.has(rosterId)) {
      newSelected.delete(rosterId);
    } else {
      newSelected.add(rosterId);
    }
    setSelectedRosterIds(newSelected);
    
    // Update select all state based on current selection
    const currentRosters = rosterSearchPerformed ? searchedRosters : allRosters;
    setSelectAllRosters(newSelected.size === currentRosters.length && currentRosters.length > 0);
  };

  // Add bulk delete handler
  const handleBulkDeleteRosters = async () => {
    if (selectedRosterIds.size === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Selection",
        text: "Please select at least one roster to delete",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Delete Selected Rosters?",
      text: `This will delete ${selectedRosterIds.size} roster record(s). This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete them!",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    setIsBulkDeleting(true);
    try {
      await RosterService.bulkDeleteRosters(Array.from(selectedRosterIds));
      
      // Remove deleted rosters from local state
      setAllRosters(prev => prev.filter(roster => !selectedRosterIds.has(roster.id)));
      setSearchedRosters(prev => prev.filter(roster => !selectedRosterIds.has(roster.id)));
      
      // Clear selection
      setSelectedRosterIds(new Set());
      setSelectAllRosters(false);

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: `Successfully deleted ${selectedRosterIds.size} roster record(s)`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error deleting rosters:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to delete selected rosters",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Reset selections when modal closes
  const handleCloseAllRostersModal = () => {
    setShowAllRostersModal(false);
    setSelectedRosterIds(new Set());
    setSelectAllRosters(false);
  };

  return (
    <div className=" bg-gray-100 flex flex-col">
      
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-xl font-bold">Roster Management System</h1>
        <div className="flex items-center space-x-4">
          
          <button
            className="bg-white text-blue-700 px-4 py-2 rounded shadow hover:bg-blue-100 font-semibold"
            onClick={handleViewAllRosters}
          >
            View All Rosters
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        <div className="w-80 bg-white border-r border-gray-300 flex flex-col shadow-sm">
         
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

          
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-sm mb-3 text-gray-800">
              Select Company / Department / Sub Department
            </h3>
            <div className="space-y-3">
             
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

          
        </div>

     
        <div className="w-[400px] min-w-[400px] max-w-[400px] p-4 border-b border-gray-200 bg-gray-50">
         
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

           
            <div className="h-[calc(100vh-280px)] overflow-y-auto">
            
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
           
            <div className="flex-1 overflow-hidden border border-gray-300 rounded-lg shadow mb-4 flex flex-col">
             
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

    
      {showAllRostersModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full p-6 relative max-h-[90vh] overflow-hidden flex flex-col">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={handleCloseAllRostersModal}
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold mb-4">All Rosters</h2>

          
            <div className="mb-6 border rounded-lg p-4 bg-gray-50">
              <h3 className="text-md font-semibold mb-3">Search Rosters</h3>
              <form onSubmit={handleRosterSearch} className="grid grid-cols-3 gap-4">
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

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Roster ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter roster ID"
                    value={rosterSearchParams.roster_id}
                    onChange={(e) =>
                      setRosterSearchParams({
                        ...rosterSearchParams,
                        roster_id: e.target.value,
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

           
            {selectedRosterIds.size > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-red-800 font-medium">
                      {selectedRosterIds.size} roster(s) selected
                    </span>
                  </div>
                  <button
                    onClick={handleBulkDeleteRosters}
                    disabled={isBulkDeleting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isBulkDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Selected
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

           
            <div className="flex-1 overflow-y-auto">
              {loadingAllRosters ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading rosters...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 border">
                            <input
                              type="checkbox"
                              checked={selectAllRosters}
                              onChange={handleSelectAllRosters}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-4 py-2 border">Roster ID</th>
                          <th className="px-4 py-2 border">Shift Code</th>
                          <th className="px-4 py-2 border">Company</th>
                          <th className="px-4 py-2 border">Department</th>
                          <th className="px-4 py-2 border">Sub Dept</th>
                          <th className="px-4 py-2 border">Employee</th>
                          <th className="px-4 py-2 border">Date From</th>
                          <th className="px-4 py-2 border">Date To</th>
                          <th className="px-4 py-2 border">Start Time</th>
                          <th className="px-4 py-2 border">End Time</th>
                          <th className="px-4 py-2 border">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(rosterSearchPerformed ? searchedRosters : allRosters).map((roster, idx) => (
                          <tr key={roster.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-2 border text-center">
                              <input
                                type="checkbox"
                                checked={selectedRosterIds.has(roster.id)}
                                onChange={() => handleSelectRoster(roster.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-4 py-2 border">{roster.roster_id}</td>
                            <td className="px-4 py-2 border">{roster.shift_code}</td>
                            <td className="px-4 py-2 border">{roster.company_name || "-"}</td>
                            <td className="px-4 py-2 border">{roster.department_name || "-"}</td>
                            <td className="px-4 py-2 border">{roster.sub_department_name || "-"}</td>
                            <td className="px-4 py-2 border">{roster.employee_name || "-"}</td>
                            <td className="px-4 py-2 border">{roster.date_from || "-"}</td>
                            <td className="px-4 py-2 border">{roster.date_to || "-"}</td>
                            <td className="px-4 py-2 border">{roster.start_time || "-"}</td>
<td className="px-4 py-2 border">{roster.end_time || "-"}</td>
                            <td className="px-4 py-2 border text-center">
                              <button
                                onClick={() => handleDeleteConfirm(roster)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                       
                        {rosterSearchPerformed && searchedRosters.length === 0 && (
                          <tr>
                            <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <Search className="w-12 h-12 text-gray-400 mb-2" />
                                <p className="font-medium">No search results found</p>
                                <p className="text-sm mt-2 text-gray-500">
                                  Try adjusting your search criteria
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                        {!rosterSearchPerformed && allRosters.length === 0 && (
                          <tr>
                            <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                              <p className="font-medium">No roster data found.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {searchedRosters.length > 0
                  ? `Showing ${searchedRosters.length} search results`
                  : allRosters.length > 0
                  ? `Showing ${allRosters.length} total rosters`
                  : ""}
                {selectedRosterIds.size > 0 && (
                  <span className="ml-2 text-blue-600 font-medium">
                    • {selectedRosterIds.size} selected
                  </span>
                )}
              </div>
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
                onClick={handleCloseAllRostersModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
              <h3 className="text-lg font-medium">Confirm Delete</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this roster? This action will soft delete the roster and it can be restored later if needed.
            </p>

            {deletingRoster && (
              <div className="bg-gray-50 p-3 rounded mb-4">
                <p><strong>Roster ID:</strong> {deletingRoster.roster_id}</p>
                <p><strong>Company:</strong> {deletingRoster.company_name || '-'}</p>
                <p><strong>Employee:</strong> {deletingRoster.employee_name || '-'}</p>
                <p><strong>Date:</strong> {deletingRoster.date_from} to {deletingRoster.date_to}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoster}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterManagementSystem;
*/