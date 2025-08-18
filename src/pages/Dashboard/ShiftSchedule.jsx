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
  errors = {}, // Add errors prop
}) => {
  const [form, setForm] = useState({
    code: "",
    description: "",
    startTime: "",
    endTime: "",
    morningOTStart: "",
    specialOTStart: "",
    lateDeduction: "",
    midnightRoster: false,
    nightlyHours: 0,

    breakTime: "",
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Morning OT Start
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  type="time"
                  placeholder="Optional"
                  value={form.morningOTStart}
                  onChange={(e) =>
                    setForm({ ...form, morningOTStart: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Special OT Start
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  type="time"
                  placeholder="Optional"
                  value={form.specialOTStart}
                  onChange={(e) =>
                    setForm({ ...form, specialOTStart: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Additional Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Late Deduction
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  type="time"
                  placeholder="HH:MM"
                  value={form.lateDeduction}
                  onChange={(e) =>
                    setForm({ ...form, lateDeduction: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Nightly Hours
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  type="number"
                  step="0.1"
                  placeholder="Enter hours (e.g., 8.5)"
                  value={form.nightlyHours}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nightlyHours: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Break Time
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter break duration (e.g., 12:00-13:00)"
                  value={form.breakTime ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, breakTime: e.target.value })
                  }
                />
                {errors.break_time && (
                  <div className="text-xs text-red-600 mt-1">
                    {errors.break_time[0]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Special Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Special Options
            </h3>
            {/* <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={form.midnightRoster}
                onChange={(e) =>
                  setForm({ ...form, midnightRoster: e.target.checked })
                }
                id="midnightRoster"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label
                htmlFor="midnightRoster"
                className="text-sm font-medium text-gray-700"
              >
                Midnight Roster
              </label>
              <span className="text-xs text-gray-500">
                Check if this shift crosses midnight
              </span>
            </div> */}
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
          morningOTStart: shift.morning_ot_start,
          specialOTStart: shift.special_ot_start,
          lateDeduction: shift.late_deduction,
          midnightRoster: shift.midnight_roster,
          nightlyHours: parseFloat(shift.nopay_hour_halfday),

          location: shift.location,
          breakTime: shift.break_time || "", // <- ensure empty string when not set
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
      const payload = {
        ...shift,
        breakTime: shift.breakTime?.trim() ? shift.breakTime.trim() : null, // <- omit if empty
      };
      await ShiftScheduleService.createShift(payload);
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
        // No SweetAlert for validation errors, only set field errors
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
      const payload = {
        ...updatedShift,
        breakTime: updatedShift.breakTime?.trim()
          ? updatedShift.breakTime.trim()
          : null, // <- omit if empty
      };
      await ShiftScheduleService.updateShift(updatedShift.id, payload);
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
        // No SweetAlert for validation errors, only set field errors
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
        errors={formErrors} // Pass errors to modal
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
          <div className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Weekday</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.weekday}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border-l-4 border-emerald-500 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Weekend</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.weekend}
                </p>
              </div>
              <Coffee className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-500 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Night Shifts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.night}
                </p>
              </div>
              <Timer className="w-8 h-8 text-indigo-500" />
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

          {/* Inline Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {[
                {
                  value: "all",
                  label: "All",
                  color: "bg-gray-100 text-gray-700 hover:bg-gray-200",
                },
                {
                  value: "weekday",
                  label: "Weekday",
                  color: "bg-green-100 text-green-700 hover:bg-green-200",
                },
                {
                  value: "weekend",
                  label: "Weekend",
                  color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
                },
                {
                  value: "night",
                  label: "Night",
                  color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
                },
                {
                  value: "security",
                  label: "Security",
                  color: "bg-red-100 text-red-700 hover:bg-red-200",
                },
                {
                  value: "production",
                  label: "Production",
                  color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
                },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterType(filter.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                    filterType === filter.value
                      ? "ring-2 ring-blue-500 ring-offset-1 " + filter.color
                      : filter.color
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
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

          {/* Selected Count */}
          {selectedShifts.size > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {selectedShifts.size} selected
              </span>
              <button
                onClick={() => setSelectedShifts(new Set())}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-2"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedShifts.size === filteredShifts.length &&
                      filteredShifts.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedShifts(
                          new Set(filteredShifts.map((s) => s.code))
                        );
                      } else {
                        setSelectedShifts(new Set());
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </th>
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
                  Overtime
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
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
                    colSpan="8"
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
                      selectedShifts.has(shift.code)
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500"
                        : index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedShifts.has(shift.code)}
                        onChange={() => toggleShiftSelection(shift.code)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </td>
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
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full border ${getShiftTypeColor(
                              shift.description
                            )}`}
                          >
                            {shift.description.includes("WD")
                              ? "Weekday"
                              : shift.description.includes("WE")
                              ? "Weekend"
                              : shift.description.includes("Night")
                              ? "Night"
                              : "Regular"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-2 h-2 rounded-full ${getDepartmentColor(
                                shift.department
                              )
                                .replace("text-", "bg-")
                                .replace("-700", "-500")}`}
                            ></div>
                            <span className="font-medium">
                              {shift.department}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{shift.location}</span>
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
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Coffee className="w-3 h-3" />
                          <span>
                            Break: {shift.breakTime ? shift.breakTime : "—"}
                          </span>{" "}
                          {/* <- show dash when empty */}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Morning:</span>
                          <span className="font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            {shift.morningOTStart}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Special:</span>
                          <span className="font-mono font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            {formatTime(shift.specialOTStart)}
                          </span>
                        </div>
                        {shift.lateDeduction !== "00:00" && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            <span className="text-red-600 font-medium">
                              Late: {shift.lateDeduction}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-gray-600">Night Hours: </span>
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                            {shift.nightlyHours.toFixed(2)}h
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-center gap-2">
                        {shift.midnightRoster ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                              Midnight
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Circle className="w-5 h-5 text-gray-300" />
                            <span className="text-xs text-gray-500">
                              Regular
                            </span>
                          </div>
                        )}
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
