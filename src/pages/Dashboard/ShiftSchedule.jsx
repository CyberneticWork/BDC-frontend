import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Clock,
  Users,
  Calendar,
  CheckCircle2,
  Circle,
  MapPin,
  AlertCircle,
  Timer,
  Coffee,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import ShiftScheduleService from "../../services/ShiftScheduleService.js";
import Swal from "sweetalert2";

// Modal component for Add/Edit
const ShiftModal = ({
  open,
  onClose,
  onSave,
  initialData = {},
  isEdit = false,
  errors = {},
}) => {
  const [form, setForm] = useState({
    code: "",
    description: "",
    startTime: "",
    endTime: "",
    midnightRoster: false,
    ...initialData,
  });

  React.useEffect(() => {
    setForm({ ...form, ...initialData });
    // eslint-disable-next-line
  }, [initialData, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Edit Shift" : "Add New Shift"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isEdit ? "Update shift details" : "Create a new shift schedule"}
            </p>
          </div>
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            onClick={onClose}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Shift Code *
                </label>
                <input
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter shift code"
                  value={form.code}
                  disabled={isEdit}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
                {errors.shift_code && (
                  <div className="text-xs text-red-600 mt-1">
                    {errors.shift_code[0]}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Description *
              </label>
              <input
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter shift description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              {errors.shift_description && (
                <div className="text-xs text-red-600 mt-1">
                  {errors.shift_description[0]}
                </div>
              )}
            </div>
          </div>

          {/* Time Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Time Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Start Time *
                </label>
                <input
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                />
                {errors.start_time && (
                  <div className="text-xs text-red-600 mt-1">
                    {errors.start_time[0]}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  End Time *
                </label>
                <input
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                />
                {errors.end_time && (
                  <div className="text-xs text-red-600 mt-1">
                    {errors.end_time[0]}
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              className="px-6 py-3 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors duration-200"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
              onClick={handleSubmit}
            >
              {isEdit ? "Update Shift" : "Create Shift"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal for Delete Confirmation
const DeleteModal = ({ open, onClose, onConfirm, shift }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          <X />
        </button>
        <h2 className="text-lg font-bold mb-2 text-red-600 flex items-center gap-2">
          <Trash2 className="w-5 h-5" /> Delete Shift
        </h2>
        <p className="mb-4">
          Are you sure you want to delete shift{" "}
          <span className="font-bold">{shift?.code}</span> -{" "}
          <span>{shift?.description}</span>?
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-gray-100 text-gray-700"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white font-semibold"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ShiftSchedule = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShifts, setSelectedShifts] = useState(new Set());
  const [filterType, setFilterType] = useState("all");
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editShift, setEditShift] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Fetch shifts on component mount
  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const data = await ShiftScheduleService.getAllShifts();
      setShifts(
        data.map((shift) => ({
          code: shift.shift_code,
          description: shift.shift_description,
          startTime: shift.start_time,
          endTime: shift.end_time,
          midnightRoster: shift.midnight_roster,
          id: shift.id,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add Shift
  const handleAddShift = async (shift) => {
    try {
      await ShiftScheduleService.createShift(shift);
      await fetchShifts();
      setModalOpen(false);
      setFormErrors({});
      Swal.fire({
        icon: "success",
        title: "Shift Created",
        text: "The shift was created successfully!",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error?.response?.data?.message || "Failed to create shift.",
        });
      }
    }
  };

  // Update Shift
  const handleUpdateShift = async (updatedShift) => {
    try {
      await ShiftScheduleService.updateShift(updatedShift.id, updatedShift);
      await fetchShifts();
      setEditShift(null);
      setModalOpen(false);
      setFormErrors({});
      Swal.fire({
        icon: "success",
        title: "Shift Updated",
        text: "The shift was updated successfully!",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error?.response?.data?.message || "Failed to update shift.",
        });
      }
    }
  };

  // Delete Shift
  const handleDeleteShift = async () => {
    try {
      await ShiftScheduleService.deleteShift(shiftToDelete.id);
      await fetchShifts();
      setDeleteModalOpen(false);
      setShiftToDelete(null);
      setSelectedShifts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(shiftToDelete.code);
        return newSet;
      });
      Swal.fire({
        icon: "success",
        title: "Shift Deleted",
        text: "The shift was deleted successfully!",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to delete shift.",
      });
    }
  };

  const filteredShifts = shifts.filter((shift) => {
    const matchesSearch =
      shift.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === "all") return matchesSearch;
    if (filterType === "weekday")
      return matchesSearch && shift.description.includes("WD");
    if (filterType === "weekend")
      return matchesSearch && shift.description.includes("WE");
    if (filterType === "night")
      return (
        matchesSearch &&
        (shift.description.includes("Night") || shift.midnightRoster)
      );
    if (filterType === "security")
      return matchesSearch && shift.department === "Security";
    if (filterType === "production")
      return matchesSearch && shift.department === "Production";

    return matchesSearch;
  });

  const toggleShiftSelection = (code) => {
    const newSelected = new Set(selectedShifts);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelectedShifts(newSelected);
  };

  const formatTime = (time) => {
    return time.slice(0, 5);
  };

  const getShiftTypeColor = (description) => {
    if (description.includes("Night") || description.includes("night"))
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    if (description.includes("WE"))
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (description.includes("Security"))
      return "bg-red-100 text-red-800 border-red-200";
    if (description.includes("Production"))
      return "bg-blue-100 text-blue-800 border-blue-200";
    if (description.includes("QC"))
      return "bg-purple-100 text-purple-800 border-purple-200";
    if (description.includes("Driver"))
      return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getDepartmentColor = (department) => {
    const colors = {
      Security: "bg-red-50 text-red-700",
      Production: "bg-blue-50 text-blue-700",
      Management: "bg-purple-50 text-purple-700",
      Administration: "bg-green-50 text-green-700",
      "Quality Control": "bg-yellow-50 text-yellow-700",
      Transport: "bg-orange-50 text-orange-700",
      Procurement: "bg-teal-50 text-teal-700",
      General: "bg-gray-50 text-gray-700",
    };
    return colors[department] || "bg-gray-50 text-gray-700";
  };

  const calculateShiftDuration = (start, end) => {
    const startTime = new Date(`2000-01-01 ${start}`);
    let endTime = new Date(`2000-01-01 ${end}`);

    // Handle overnight shifts
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }

    const diff = endTime - startTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes > 0 ? minutes + "m" : ""}`.trim();
  };

  const stats = {
    total: shifts.length,
    weekday: shifts.filter((s) => s.description.includes("WD")).length,
    weekend: shifts.filter((s) => s.description.includes("WE")).length,
    night: shifts.filter(
      (s) => s.description.includes("Night") || s.midnightRoster
    ).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      {/* Add/Edit Modal */}
      <ShiftModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditShift(null);
          setFormErrors({});
        }}
        onSave={editShift ? handleUpdateShift : handleAddShift}
        initialData={editShift || {}}
        isEdit={!!editShift}
        errors={formErrors}
      />
      {/* Delete Modal */}
      <DeleteModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteShift}
        shift={shiftToDelete}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Shift Schedule Manager
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and optimize employee work schedules
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Shifts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
         
          
        </div>
      </div>

      {/* Controls - Inline Filter Row */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search shifts, codes, or departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Add Shift Button */}
          <button
            onClick={() => {
              setEditShift(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Shift
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Shift Details
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredShifts.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No shifts found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift, index) => (
                  <tr
                    key={shift.code}
                    className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                      index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="font-mono text-sm font-bold text-white bg-gradient-to-r from-gray-700 to-gray-800 px-3 py-2 rounded-lg shadow-sm">
                        {shift.code}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {shift.description}
                          </span>
                          
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">
                              {shift.department}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-mono font-semibold text-gray-900">
                              {formatTime(shift.startTime)}
                            </span>
                          </div>
                          <span className="text-gray-400">→</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-mono font-semibold text-gray-900">
                              {formatTime(shift.endTime)}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                            {calculateShiftDuration(
                              shift.startTime,
                              shift.endTime
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          className="p-1 rounded hover:bg-blue-100"
                          title="Edit"
                          onClick={() => {
                            setEditShift(shift);
                            setModalOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-red-100"
                          title="Delete"
                          onClick={() => {
                            setShiftToDelete(shift);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="mt-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {filteredShifts.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {shifts.length}
              </span>{" "}
              shifts
            </span>
            {filterType !== "all" && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                Filtered by: {filterType}
              </span>
            )}
          </div>
          {selectedShifts.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-blue-600">
                  {selectedShifts.size}
                </span>{" "}
                shifts selected
              </span>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Export Selected
                </button>
                <button
                  onClick={() => setSelectedShifts(new Set())}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ShiftSchedule;