import React, { useState, useEffect } from "react";
import { Clock, Search } from "lucide-react";
import { fetchTimeCards, approveOt } from "@services/OverTimeService";

const Overtime = () => {
  const [timeData, setTimeData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch initial data
    fetchOvertimeData();
  }, []);

  // Fetch data
  const fetchOvertimeData = async () => {
    setIsLoading(true);
    try {
      // await new Promise((resolve) => setTimeout(resolve, 800));
      const data = await fetchTimeCards();
      // console.log("Fetched overtime data:", data);
      setTimeData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id, sts) => {
    await approveOt(id, sts);
    fetchOvertimeData();
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
                          {row.employee_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.employee_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {row?.time_card_id?.date ?? "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {row?.shift_code?.start_time ?? "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {row?.time_card_id?.time ?? "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                          {row?.shift_code?.end_time ?? "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {row?.time_card_id?.time ?? "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                          {row?.time_card_id?.working_hours ?? "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                          {/* Morning OT - not directly in data, showing shift morning OT start time */}
                          {row.time_card_id.working_hours}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                          {row.morning_ot}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                          {row.evening_ot}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                          {(parseFloat(row.morning_ot) || 0) +
                            (parseFloat(row.evening_ot) || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{row?.ot_morning_rate ?? "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{row?.ot_night_rate ?? "-"}</td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {row.status === "pending" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleApprove(row.id, "approved")
                                }
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleApprove(row.id, "rejected")
                                }
                                className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                              >
                                Reject
                              </button>
                            </div>
                          ) : row.status === "approved" ? (
                            <span className="text-green-600 font-semibold">
                              Approved
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold">
                              Rejected
                            </span>
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
