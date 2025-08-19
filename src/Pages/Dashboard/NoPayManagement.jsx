import React, { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  Download,
  Trash2,
  Filter,
  Printer,
  Building,
  Clock,
  User,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import axios from "@utils/axios";
import { format, parseISO } from "date-fns";
import Swal from "sweetalert2";
import NoPayService from "@services/NoPayService";

const NoPayManagement = () => {
  // State management
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [noPayRecords, setNoPayRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);

  // List of months
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate years (current year and 5 previous years)
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  // Fetch companies
  const fetchCompanies = async () => {
    try {
      const response = await axios.get("/apiData/companies");
      setCompanies(Array.isArray(response.data) ? response.data : response.data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  // Fetch no pay records with pagination
  const fetchNoPayRecords = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: recordsPerPage
      };

      if (month) params.month = months.indexOf(month) + 1;
      if (year) params.year = year;
      if (searchTerm) params.search = searchTerm;

      if (selectedCompany !== "" && selectedCompany !== null && selectedCompany !== undefined) {
        const companyId = Number(selectedCompany);
        if (!Number.isNaN(companyId)) params.company_id = companyId;
      }

      const response = await NoPayService.getAllRecords(params);
      const items = response.data || response;
      setNoPayRecords(items);
      setTotalRecords(response.total ?? (Array.isArray(items) ? items.length : 0));
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch no-pay records',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/employees?status=Active");
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // Fetch stats
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalDays: 0,
    affectedEmployees: 0,
  });

  const fetchStats = async () => {
    try {
      const params = {};
      if (month) params.month = months.indexOf(month) + 1;
      if (year) params.year = year;

      if (selectedCompany !== "" && selectedCompany !== null && selectedCompany !== undefined) {
        const companyId = Number(selectedCompany);
        if (!Number.isNaN(companyId)) params.company_id = companyId;
      }

      const data = await NoPayService.getStats(params);
      setStats({
        totalRecords: data.total_records ?? 0,
        totalDays: data.total_days ?? 0,
        affectedEmployees: data.affected_employees ?? 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCompanies();
    fetchNoPayRecords();
    fetchEmployees();
  }, [month, year, currentPage, recordsPerPage, selectedCompany]);

  // Fetch stats when filters change
  useEffect(() => {
    fetchStats();
  }, [month, year, noPayRecords, selectedCompany]);

  // Handle record selection
  const handleSelectRecord = (id) => {
    setSelectedRecords(prev =>
      prev.includes(id)
        ? prev.filter(recordId => recordId !== id)
        : [...prev, id]
    );
  };

  // Handle select all records
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(noPayRecords.map(record => record.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (status) => {
    if (selectedRecords.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No records selected',
        text: 'Please select at least one record to update',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Update Status?',
      text: `This will update ${selectedRecords.length} records to ${status}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const response = await NoPayService.bulkUpdateStatus(selectedRecords, status);
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: response.message,
          confirmButtonColor: '#3b82f6',
        });

        fetchNoPayRecords();
        fetchStats();
        setSelectedRecords([]);
        setSelectAll(false);
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update records',
          confirmButtonColor: '#3b82f6',
        });
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRecords.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No records selected',
        text: 'Please select at least one record to delete',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Delete Records?',
      text: `This will permanently delete ${selectedRecords.length} records`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete("/no-pay-records/bulk-delete", {
          data: { ids: selectedRecords }
        });

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: response.data.message,
          confirmButtonColor: '#3b82f6',
        });

        fetchNoPayRecords();
        fetchStats();
        setSelectedRecords([]);
        setSelectAll(false);
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete records',
          confirmButtonColor: '#3b82f6',
        });
      }
    }
  };

  // Handle record removal with SweetAlert
  const handleRemoveRecord = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/no-pay-records/${id}`);
        setNoPayRecords(noPayRecords.filter((record) => record.id !== id));

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Record has been deleted.',
          confirmButtonColor: '#3b82f6',
        });

        fetchStats();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete record',
          confirmButtonColor: '#3b82f6',
        });
      }
    }
  };

  // Handle generate NoPay records with SweetAlert
  const handleGenerateNoPay = async () => {
    setIsGenerating(true);
    try {
      const result = await Swal.fire({
        title: 'Generate No-Pay Records?',
        text: `This will generate records for ${format(new Date(selectedDate), 'MMMM d, yyyy')}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Generate',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        const payload = { date: selectedDate };

        if (month) payload.month = months.indexOf(month) + 1;
        if (year) payload.year = year;

        if (selectedCompany !== "" && selectedCompany !== null && selectedCompany !== undefined) {
          const companyId = Number(selectedCompany);
          if (!Number.isNaN(companyId)) payload.company_id = companyId;
        }

        const response = await axios.post("/no-pay-records/generate", payload);

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: response.data.message,
          confirmButtonColor: '#3b82f6',
        });

        fetchNoPayRecords();
        fetchStats();
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to generate no-pay records',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle print
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "height=600,width=800");
    const currentDate = new Date().toLocaleString();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>No Pay Days Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .report-header { text-align: center; margin-bottom: 20px; }
            .report-header h1 { margin-bottom: 5px; }
            .report-meta { font-size: 14px; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .report-footer { margin-top: 30px; font-size: 12px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="report-header">
            <h1>No Pay Days Report</h1>
            <p>Generated on: ${currentDate}</p>
          </div>
          
          <div class="report-meta">
            ${month ? `<strong>Month:</strong> ${month} ${year} | ` : ""}
            ${selectedCompany ? `<strong>Company ID:</strong> ${selectedCompany} | ` : ""}
            <strong>Total Records:</strong> ${noPayRecords.length}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Emp No</th>
                <th>Name</th>
                <th>No Pay Count</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${noPayRecords
                .map(
                  (record) => `
                <tr>
                  <td>${format(parseISO(record.date), "MMM dd, yyyy")}</td>
                  <td>${record.employee?.attendance_employee_no || "N/A"}</td>
                  <td>${record.employee?.full_name || "N/A"}</td>
                  <td>${record.no_pay_count}</td>
                  <td>${record.description}</td>
                  <td>${record.status}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="report-footer">
            <p>HR System - Cybernetic Software Solutions</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Filter records based on search term
  const filteredRecords = noPayRecords.filter((record) => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    const empNo = record.employee?.attendance_employee_no?.toString() || "";
    const empName = record.employee?.full_name?.toString() || "";
    const description = record.description?.toString() || "";
    
    return (
      empNo.toLowerCase().includes(searchTermLower) ||
      empName.toLowerCase().includes(searchTermLower) ||
      description.toLowerCase().includes(searchTermLower)
    );
  });

  // Pagination logic
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 py-4 sm:py-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-gray-900 px-4 sm:px-8 py-6 sm:py-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center">
              NoPay Management
            </h1>
            <p className="text-slate-300 text-center mt-2 text-sm sm:text-base">
              Manage employee no pay records and absences
            </p>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Bulk Actions */}
            {selectedRecords.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="text-blue-800 font-medium">
                  {selectedRecords.length} record(s) selected
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleBulkStatusUpdate('Approved')}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Approve Selected
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('Rejected')}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject Selected
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Company
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => {
                    setSelectedCompany(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white shadow-sm"
                >
                  <option value="">All Companies</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Month
                </label>
                <select
                  value={month}
                  onChange={(e) => {
                    setMonth(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white shadow-sm"
                >
                  <option value="">All Months</option>
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => {
                    setYear(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white shadow-sm"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Date for Generation
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white shadow-sm"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={handleGenerateNoPay}
                  disabled={isGenerating}
                  className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5" />
                  )}
                  Generate Records
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative flex-grow mb-6">
              <input
                type="text"
                placeholder="Search by employee number, name or description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-3 pl-10 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
              <Search className="absolute left-3 top-3.5 text-gray-400" />
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-6">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-2">Loading records...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectAll}
                              onChange={handleSelectAll}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Emp No
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            No Pay Count
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredRecords.length > 0 ? (
                          filteredRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedRecords.includes(record.id)}
                                  onChange={() => handleSelectRecord(record.id)}
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {format(parseISO(record.date), "MMM dd, yyyy")}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {record.employee?.attendance_employee_no || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {record.employee?.full_name || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {record.no_pay_count}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate">
                                {record.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  value={record.status}
                                  onChange={async (e) => {
                                    try {
                                      await NoPayService.updateStatus(record.id, e.target.value);
                                      fetchNoPayRecords();
                                      fetchStats();
                                    } catch (error) {
                                      Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        text: 'Failed to update status',
                                        confirmButtonColor: '#3b82f6',
                                      });
                                    }
                                  }}
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    record.status === 'Approved' 
                                      ? 'bg-green-100 text-green-800' 
                                      : record.status === 'Rejected' 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  <option value="Pending" className="bg-yellow-100">Pending</option>
                                  <option value="Approved" className="bg-green-100">Approved</option>
                                  <option value="Rejected" className="bg-red-100">Rejected</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center flex justify-center gap-2">
                                <button
                                  onClick={() => handleRemoveRecord(record.id)}
                                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors"
                                  title="Delete record"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="8"
                              className="px-6 py-16 text-center text-gray-500"
                            >
                              No records found. Adjust your filters or add new records.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalRecords > recordsPerPage && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * recordsPerPage + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * recordsPerPage, totalRecords)}
                        </span>{' '}
                        of <span className="font-medium">{totalRecords}</span> records
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded-md flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                          <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`px-3 py-1 rounded-md ${currentPage === number 
                              ? 'bg-blue-500 text-white' 
                              : 'border border-gray-300 hover:bg-gray-50'}`}
                          >
                            {number}
                          </button>
                        ))}
                        <button
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border border-gray-300 rounded-md flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <button
                onClick={handlePrint}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-medium rounded-lg hover:from-teal-700 hover:to-teal-800 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Print
              </button>
              <button
                onClick={() => {
                  fetchNoPayRecords();
                  fetchStats();
                }}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium rounded-lg hover:from-gray-700 hover:to-gray-800 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total No Pay Records
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalRecords}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total No Pay Days
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalDays}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Affected Employees
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.affectedEmployees}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoPayManagement;