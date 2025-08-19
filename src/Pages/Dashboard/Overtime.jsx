import React, { useState, useEffect } from "react";
import { Clock, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchTimeCards, approveOt } from "@services/OverTimeService";
import { fetchCompanies } from "@services/ApiDataService";

// Pagination component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);

  if (currentPage <= 3) {
    end = Math.min(5, totalPages);
  }

  if (currentPage >= totalPages - 2) {
    start = Math.max(1, totalPages - 4);
  }

  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex justify-center items-center gap-1 mt-4 mb-4">
      <button
        className={`px-3 py-1 rounded-lg font-medium transition-all duration-150 ${
          currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
        }`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {start > 1 && (
        <>
          <button
            className="px-3 py-1 rounded-lg font-medium bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {start > 2 && <span className="px-2 text-gray-400">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          className={`px-3 py-1 rounded-lg font-medium transition-all duration-150 ${
            page === currentPage
              ? "bg-blue-600 text-white shadow"
              : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
          }`}
          onClick={() => onPageChange(page)}
          disabled={page === currentPage}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
          <button
            className="px-3 py-1 rounded-lg font-medium bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        className={`px-3 py-1 rounded-lg font-medium transition-all duration-150 ${
          currentPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
        }`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

const Overtime = () => {
  const [timeData, setTimeData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(9);

  // Filters: company dropdown + date picker
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Helper: convert decimal hours (e.g. 2.17) to "2h 10m"
  const formatDecimalHours = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    const num = parseFloat(val);
    if (isNaN(num)) return "-";
    const sign = num < 0 ? "-" : "";
    const abs = Math.abs(num);
    const hours = Math.floor(abs);
    const minutes = Math.round((abs - hours) * 60);
    // Normalize rounding e.g. 1h 60m => 2h 0m
    const adjHours = hours + Math.floor(minutes / 60);
    const adjMinutes = minutes % 60;
    return `${sign}${adjHours}h ${String(adjMinutes).padStart(2, "0")}m`;
  };

  // small helper to compute total OT when backend doesn't provide it
  const computeTotalOt = (row) => {
    const a = parseFloat(row.morning_ot || 0) || 0;
    const b = parseFloat(row.evening_ot || row.afternoon_ot || 0) || 0;
    const total = a + b;
    return formatDecimalHours(total);
  };

  useEffect(() => {
    // Fetch initial data
    fetchOvertimeData();
    // fetch companies for dropdown
    (async () => {
      try {
        const comps = await fetchCompanies();
        setCompanies(Array.isArray(comps) ? comps : []);
      } catch (err) {
        console.error("Failed to load companies:", err);
      }
    })();
  }, []);

  // apply filters whenever raw data or filters change
  useEffect(() => {
    const applyFilters = () => {
      // debug logs to inspect available company fields
      console.log("Selected company:", selectedCompany);
      console.log(
        "Sample record company data:",
        timeData && timeData.length > 0 ? timeData[0].company_id : undefined,
        timeData && timeData.length > 0 ? timeData[0].company_name : undefined
      );

      let data = [...timeData];
      if (selectedCompany) {
        data = data.filter(
          (r) =>
            r.company_id?.toString() === selectedCompany?.toString() ||
            r.company_name === selectedCompany // support name matches if API returns name
        );
      }
      if (selectedDate) {
        data = data.filter((r) => (r.date || "").slice(0, 10) === selectedDate);
      }
      setFilteredData(data);
    };
    applyFilters();
  }, [timeData, selectedCompany, selectedDate]);

  // Reset to first page when filtered data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData.length]);

  // Fetch data
  const fetchOvertimeData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTimeCards();
      console.log("Overtime API response:", data); // Debug what's coming back

      if (Array.isArray(data)) {
        setTimeData(data);
        setFilteredData(data);
      } else if (data && Array.isArray(data.data)) {
        // Some APIs wrap the response in a data property
        setTimeData(data.data);
        setFilteredData(data.data);
      } else {
        console.error("Unexpected data format:", data);
        setError("Data received in unexpected format");
        setTimeData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load overtime data");
      setTimeData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id, sts) => {
    try {
      await approveOt(id, sts);
      fetchOvertimeData();
    } catch (error) {
      console.error("Error approving overtime:", error);
    }
  };

  // Compact dropdown + confirmation handler (optimistic UI)
  const handleStatusChange = async (id, newStatus) => {
    // optimistic update (no confirmation)
    setTimeData((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));

    try {
      await handleApprove(id, newStatus);
    } catch (err) {
      console.error("Failed to change status:", err);
      // revert / refresh on error
      fetchOvertimeData();
    }
  };

  // Calculate pagination values
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // handlers for filters
  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
  };
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Clear filters and reset table view
  const handleClearFilters = () => {
    setSelectedCompany("");
    setSelectedDate("");
    setFilteredData(timeData);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-800 to-blue-600 bg-clip-text text-transparent">
                  Overtime Management System
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage and approve employee overtime hours efficiently
                </p>
              </div>

              {/* Filters on the right side: company dropdown + date */}
              <div className="flex items-center gap-3 ml-4">
                <select
                  value={selectedCompany}
                  onChange={handleCompanyChange}
                  className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white"
                  aria-label="Filter by company"
                >
                  <option value="">All Companies</option>
                  {companies.map((c) => (
                    <option key={c.id || c} value={c.id ?? c.name}>
                      {c.name ?? c}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white"
                  aria-label="Filter by date"
                />

                {/* Clear filters button */}
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                  aria-label="Clear filters"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Main Content - Always show table */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        EMP No
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Shift start
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        IN Time
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Shift End
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        OUT Time
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Working Hours
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Morning OT
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Evening OT
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Total OT
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Special OT
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Morning OT Rate
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Night OT Rate
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Approve OT
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-100">
                    {currentRows.length === 0 ? (
                      <tr>
                        <td colSpan="15" className="px-6 py-8 text-center">
                          <div className="flex flex-col items-center space-y-2">
                            <Search className="h-8 w-8 text-gray-300" />
                            <span className="text-sm text-gray-500">
                              No matching records found
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentRows.map((row) => (
                        <tr
                          key={row.id}
                          className={`transition-all duration-200 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {row.employee_no || row.employee_id || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {row.employee_name || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {row.date || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {row.shift_start || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {row.in_time || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                            {row.shift_end || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {/* Show OUT time and mark Cross-day when actual_date differs from date */}
                            <div className="flex items-center gap-2">
                              <span>{row.out_time || "-"}</span>
                              {row.out_time &&
                                (row.is_cross_day ||
                                  (row.actual_date && row.date && row.actual_date !== row.date)) && (
                                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                    Cross-day
                                  </span>
                                )}
                            </div>
                          </td>

                          {/* Format working hours */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                            {formatDecimalHours(row.working_hours)}
                          </td>

                          {/* Morning OT */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                            {formatDecimalHours(row.morning_ot)}
                          </td>

                          {/* Evening/afternoon OT */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                            {formatDecimalHours(row.evening_ot ?? row.afternoon_ot)}
                          </td>

                          {/* Total OT */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                            {row.total_ot ? formatDecimalHours(row.total_ot) : computeTotalOt(row)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                            {row.special_ot || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                            {row.ot_morning_rate || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                            {row.ot_night_rate || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center gap-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium ${
                                  row.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : row.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : "Pending"}
                              </span>

                              <label className="sr-only" htmlFor={`status-${row.id}`}>Change status</label>
                              <select
                                id={`status-${row.id}`}
                                value={row.status || "pending"}
                                onChange={(e) => handleStatusChange(row.id, e.target.value)}
                                className="ml-1 px-2 py-1 border border-gray-200 rounded-md text-sm bg-white focus:outline-none"
                                aria-label="Change status"
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Approve</option>
                                <option value="rejected">Reject</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {filteredData.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">{indexOfFirstRow + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(indexOfLastRow, filteredData.length)}
                      </span>{" "}
                      of <span className="font-medium">{filteredData.length}</span> records
                    </div>

                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overtime;
