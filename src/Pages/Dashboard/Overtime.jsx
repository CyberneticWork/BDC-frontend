import React, { useState, useEffect } from "react";
import { Clock, Search } from "lucide-react";
import { fetchTimeCards, approveOt } from "@services/OverTimeService";

const Overtime = () => {
  const [timeData, setTimeData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
  }, []);

  // Fetch data
  const fetchOvertimeData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTimeCards();
      console.log("Overtime API response:", data); // Debug what's coming back

      if (Array.isArray(data)) {
        setTimeData(data);
      } else if (data && Array.isArray(data.data)) {
        // Some APIs wrap the response in a data property
        setTimeData(data.data);
      } else {
        console.error("Unexpected data format:", data);
        setError("Data received in unexpected format");
        setTimeData([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load overtime data");
      setTimeData([]);
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

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-800 to-blue-600 bg-clip-text text-transparent">
              Overtime Management System
            </h1>
          </div>
          <p className="text-gray-600 ml-11">
            Manage and approve employee overtime hours efficiently
          </p>
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
                  {timeData.length === 0 ? (
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
                    timeData.map((row) => (
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
                          {row.status === "pending" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(row.id, "approved")}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApprove(row.id, "rejected")}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                              >
                                Reject
                              </button>
                            </div>
                          ) : row.status === "approved" ? (
                            <span className="text-green-600 font-semibold">Approved</span>
                          ) : (
                            <span className="text-red-600 font-semibold">Rejected</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overtime;
