import React, { useEffect, useMemo, useState } from "react";
import { Clock, DollarSign, Save, Info, CheckCircle2, AlertCircle, Building2, X, Calculator, ArrowRight, Eye, Trash2, Edit } from "lucide-react";
import Swal from "sweetalert2";
import ShiftOvertimeRateService from "@services/ShiftOvertimeRateService";

const num = (v) => (v === "" || v === null || v === undefined ? "" : String(v));

const initialForm = {
  shift_id: "",
  shift_hours_per_day: "",
  working_days_per_month: "",
  ot_multiplier: "",
  holiday_multiplier: "",
  ignore_hours_threshold: { hours: "", minutes: "" }, // Change from string to object
};

const ShiftOvertimeRates = () => {
  const [shifts, setShifts] = useState([]);
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [selectedShift, setSelectedShift] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [savedRates, setSavedRates] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);

  // Independent calculation inputs (not tied to selected shift)
  const [calculationInputs, setCalculationInputs] = useState({
    basicSalary: "50000",
    shiftHours: "8",
    daysInMonth: "30"
  });

  // Calculate example rates based on independent inputs
  const calculateIndependentRates = () => {
    const basicSalary = parseFloat(calculationInputs.basicSalary) || 0;
    const shiftHours = parseFloat(calculationInputs.shiftHours) || 8;
    const daysInMonth = parseFloat(calculationInputs.daysInMonth) || 30;
    
    const totalMonthlyHours = shiftHours * daysInMonth;
    const hourlyRate = totalMonthlyHours > 0 ? basicSalary / totalMonthlyHours : 0;
    const otRate = hourlyRate * 1.5;
    const holidayRate = hourlyRate * 2;
    
    return {
      shiftHours,
      totalMonthlyHours,
      hourlyRate,
      otRate,
      holidayRate,
      basicSalary,
      daysInMonth
    };
  };

  const independentCalcs = calculateIndependentRates();

  // Calculate shift duration from selected shift (for display only)
  const calculateShiftDuration = () => {
    if (!selectedShift || !selectedShift.start_time || !selectedShift.end_time) return 8;
    
    const start = new Date(`2000-01-01 ${selectedShift.start_time}`);
    let end = new Date(`2000-01-01 ${selectedShift.end_time}`);
    
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end - start;
    const hours = diffMs / (1000 * 60 * 60);
    return Math.round(hours * 100) / 100;
  };

  // Load shift dropdown
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await ShiftOvertimeRateService.getShiftsDropdown();
        if (mounted) setShifts(data);
      } catch {
        Swal.fire({ icon: "error", title: "Error", text: "Failed to load shifts" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // When shift changes, fetch any existing rate + hydrate shift meta
  useEffect(() => {
    if (!selectedShiftId || !shifts.length) {
      setSelectedShift(null);
      return;
    }

    const shiftMeta = shifts.find((s) => String(s.id) === String(selectedShiftId));
    setSelectedShift(shiftMeta || null);

    let cancelled = false;

    const loadRate = async () => {
      try {
        setLoading(true);
        const rate = await ShiftOvertimeRateService.getByShiftId(selectedShiftId);
        if (cancelled) return;

        if (rate) {
          setForm({
            shift_id: rate.shift_id?.toString() || "",
            shift_hours_per_day: rate.shift_hours_per_day?.toString() || "",
            working_days_per_month: rate.working_days_per_month?.toString() || "",
            ot_multiplier: rate.ot_multiplier?.toString() || "",
            holiday_multiplier: rate.holiday_multiplier?.toString() || "",
            ignore_hours_threshold: {
              hours: rate.ignore_hours_threshold?.hours?.toString() || "",
              minutes: rate.ignore_hours_threshold?.minutes?.toString() || "",
            },
          });
          setRecordId(rate.id);
        } else {
          setForm({
            ...initialForm,
            shift_id: selectedShiftId.toString(),
            ignore_hours_threshold: { hours: "", minutes: "" },
          });
          setRecordId(null);
        }
      } catch (error) {
        if (cancelled) return;

        if (error?.response?.status === 404) {
          setForm({
            ...initialForm,
            shift_id: selectedShiftId.toString(),
            ignore_hours_threshold: { hours: "", minutes: "" },
          });
          setRecordId(null);
        } else {
          console.error("Failed to fetch shift OT rate:", error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRate();

    return () => {
      cancelled = true;
    };
  }, [selectedShiftId, shifts]);

  const onNumberChange = (key) => (e) => {
    const v = e.target.value;
    // allow empty, else numeric with up to 2 decimals
    if (v === "" || /^\d{0,4}(\.\d{0,2})?$/.test(v)) {
      setForm((prev) => ({ ...prev, [key]: v }));
    }
  };

  // Update the threshold change handler
  const onThresholdChange = (field) => (e) => {
    const value = e.target.value;
    setForm(prev => ({
      ...prev,
      ignore_hours_threshold: {
        ...prev.ignore_hours_threshold,
        [field]: value
      }
    }));
  };

  // Handle calculation input changes
  const onCalculationInputChange = (key) => (e) => {
    const v = e.target.value;
    if (v === "" || /^\d{0,6}(\.\d{0,2})?$/.test(v)) {
      setCalculationInputs(prev => ({ ...prev, [key]: v }));
    }
  };

  const payload = useMemo(
    () => ({
      shift_id: Number(form.shift_id || selectedShiftId),
      shift_hours_per_day: form.shift_hours_per_day === "" ? 0 : Number(form.shift_hours_per_day),
      working_days_per_month: form.working_days_per_month === "" ? 0 : Number(form.working_days_per_month),
      ot_multiplier: form.ot_multiplier === "" ? 0 : Number(form.ot_multiplier),
      holiday_multiplier: form.holiday_multiplier === "" ? 0 : Number(form.holiday_multiplier),
      ignore_hours_threshold: {
        hours: form.ignore_hours_threshold.hours === "" ? null : Number(form.ignore_hours_threshold.hours),
        minutes: form.ignore_hours_threshold.minutes === "" ? null : Number(form.ignore_hours_threshold.minutes)
      }, // Send as object instead of number
    }),
    [form, selectedShiftId]
  );

  const handleSave = async () => {
    if (!selectedShiftId) {
      Swal.fire({ icon: "warning", title: "Select Shift", text: "Please select a shift first." });
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      if (recordId) {
        await ShiftOvertimeRateService.update(recordId, payload);
        Swal.fire({ icon: "success", title: "Updated", text: "Shift OT configuration updated successfully.", timer: 1500, showConfirmButton: false });
      } else {
        const created = await ShiftOvertimeRateService.create(payload);
        setRecordId(created?.id ?? null);
        Swal.fire({ icon: "success", title: "Saved", text: "Shift OT configuration saved successfully.", timer: 1500, showConfirmButton: false });
      }

      // Clear form automatically after successful operation
      handleClear();
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to save OT configuration.";
      const val = error?.response?.data?.errors;
      if (val) setErrors(val);
      Swal.fire({ icon: "error", title: "Error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleEditRate = (rate) => {
    // Set the shift selection first
    setSelectedShiftId(rate.shift_id?.toString() || rate.shift?.id?.toString() || "");
    
    // Hydrate form with the rate data
    setForm({
      shift_id: rate.shift_id?.toString() || rate.shift?.id?.toString() || "",
      shift_hours_per_day: rate.shift_hours_per_day?.toString() || "",
      working_days_per_month: rate.working_days_per_month?.toString() || "",
      ot_multiplier: rate.ot_multiplier?.toString() || "",
      holiday_multiplier: rate.holiday_multiplier?.toString() || "",
      ignore_hours_threshold: {
        hours: rate.ignore_hours_threshold?.hours?.toString() || "",
        minutes: rate.ignore_hours_threshold?.minutes?.toString() || ""
      }
    });
    
    // Set the record ID for update mode
    setRecordId(rate.id);
    
    // Clear any existing errors
    setErrors({});
    
    // Close the modal
    setShowModal(false);
  };

  const handleClear = () => {
    setForm({
      ...initialForm,
      shift_id: selectedShiftId?.toString() || "",
      ignore_hours_threshold: { hours: "", minutes: "" }
    });
    setRecordId(null);
    setErrors({});
  };

  // Function to copy calculated configuration to form
  const copyCalculatedRates = () => {
    setForm(prev => ({
      ...prev,
      shift_hours_per_day: independentCalcs.shiftHours.toFixed(2),
      working_days_per_month: independentCalcs.daysInMonth.toFixed(2),
      ot_multiplier: "1.50",
      holiday_multiplier: "2.00"
    }));
    Swal.fire({
      icon: "success",
      title: "Configuration Copied",
      text: "Calculated parameters have been copied to the form.",
      timer: 1500,
      showConfirmButton: false
    });
  };

  // Load saved rates for modal
  const loadSavedRates = async () => {
    try {
      setLoadingTable(true);
      const data = await ShiftOvertimeRateService.list();
      setSavedRates(data);
      setShowModal(true);
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load saved configurations" });
    } finally {
      setLoadingTable(false);
    }
  };

  // Delete rate
  const handleDeleteRate = async (id) => {
    const result = await Swal.fire({
      title: "Delete Configuration?",
      text: "Are you sure you want to delete this overtime configuration?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await ShiftOvertimeRateService.delete(id);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Configuration has been deleted.",
          timer: 1500,
          showConfirmButton: false,
        });
        // Reload the table
        loadSavedRates();
      } catch {
        Swal.fire({ icon: "error", title: "Error", text: "Failed to delete configuration" });
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <DollarSign className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shift Overtime Configuration</h1>
              <p className="text-gray-600">Configure shift parameters and overtime multipliers for dynamic rate calculation</p>
            </div>
          </div>
          <button
            onClick={loadSavedRates}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm"
          >
            <Eye size={18} />
            View Saved Data
          </button>
        </div>
      </div>

      {/* Independent Rate Calculator Card - keeping existing implementation */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calculator size={20} className="text-purple-600" />
            Rate Calculator
          </h3>
          <div className="text-xs text-gray-500">
            Calculate standard rates based on salary and working hours
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="text-sm font-semibold text-purple-900 mb-4">Calculation Parameters</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-purple-700 mb-1">
                  Employee Basic Salary (Rs.)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={calculationInputs.basicSalary}
                  onChange={onCalculationInputChange("basicSalary")}
                  className="w-full border border-purple-300 rounded px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-700 mb-1">
                  Shift Hours per Day
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={calculationInputs.shiftHours}
                  onChange={onCalculationInputChange("shiftHours")}
                  className="w-full border border-purple-300 rounded px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="8"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-700 mb-1">
                  Working Days per Month
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={calculationInputs.daysInMonth}
                  onChange={onCalculationInputChange("daysInMonth")}
                  className="w-full border border-purple-300 rounded px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="30"
                />
              </div>
              <div className="text-xs text-purple-600 space-y-1 pt-2 border-t border-purple-200">
                <div>• Total Monthly Hours: <strong>{independentCalcs.totalMonthlyHours} hours</strong></div>
                <div>• Base Hourly Rate: <strong>Rs. {independentCalcs.hourlyRate.toFixed(2)}</strong></div>
              </div>
            </div>
          </div>

          {/* Results Section - keeping existing implementation */}
          <div className="space-y-4">
            {/* Normal Rate */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
                Normal Hours Rate
              </h4>
              <div className="text-xs text-blue-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span>Basic Salary ÷ Total Monthly Hours</span>
                  <ArrowRight size={12} />
                  <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                    Rs. {independentCalcs.basicSalary.toLocaleString()} ÷ {independentCalcs.totalMonthlyHours}h
                  </span>
                </div>
                <div className="pt-2 border-t border-blue-300">
                  <div className="text-sm font-bold text-blue-900">
                    Normal Rate: <span className="bg-blue-200 px-2 py-1 rounded">Rs. {independentCalcs.hourlyRate.toFixed(2)}/hour</span>
                  </div>
                </div>
              </div>
            </div>

            {/* OT Rate */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
                Overtime Rate Calculation
              </h4>
              <div className="text-xs text-green-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span>Hourly Rate × 1.5 (OT Multiplier)</span>
                  <ArrowRight size={12} />
                  <span className="font-mono bg-green-100 px-2 py-1 rounded">
                    Rs. {independentCalcs.hourlyRate.toFixed(2)} × 1.5
                  </span>
                </div>
                <div className="pt-2 border-t border-green-300">
                  <div className="text-sm font-bold text-green-900">
                    OT Rate: <span className="bg-green-200 px-2 py-1 rounded">Rs. {independentCalcs.otRate.toFixed(2)}/hour</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Holiday Rate */}
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="text-sm font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs">3</span>
                Holiday Rate Calculation
              </h4>
              <div className="text-xs text-orange-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span>Hourly Rate × 2 (Holiday Multiplier)</span>
                  <ArrowRight size={12} />
                  <span className="font-mono bg-orange-100 px-2 py-1 rounded">
                    Rs. {independentCalcs.hourlyRate.toFixed(2)} × 2
                  </span>
                </div>
                <div className="pt-2 border-t border-orange-300">
                  <div className="text-sm font-bold text-orange-900">
                    Holiday Rate: <span className="bg-orange-200 px-2 py-1 rounded">Rs. {independentCalcs.holidayRate.toFixed(2)}/hour</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex-1">
            <p className="text-xs text-blue-800">
              <strong>💡 Calculation Formula:</strong> Basic Salary ÷ (Shift Hours × Working Days) = Base Hourly Rate
            </p>
          </div>
          <button
            onClick={copyCalculatedRates}
            disabled={!selectedShiftId}
            className="ml-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Copy to Form
          </button>
        </div>
      </div>

      {/* Shift Selection and Configuration Card */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        {/* Shift picker + meta - keeping existing implementation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Shift</label>
            <div className="flex gap-2">
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                disabled={loading}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select --</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shift_code} — {s.shift_description}
                  </option>
                ))}
              </select>
              <button
                onClick={handleClear}
                disabled={loading}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                title="Clear form"
              >
                <X size={18} />
              </button>
            </div>
            {errors?.shift_id && <p className="text-xs text-red-600 mt-1">{errors.shift_id[0]}</p>}
          </div>

          <div className="lg:col-span-2">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-200 rounded">
                  <Info className="text-gray-700" size={18} />
                </div>
                <div className="flex-1">
                  {selectedShift ? (
                    <>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="inline-flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200">
                          <Building2 size={16} /> {selectedShift.shift_code}
                        </span>
                        <span className="text-gray-800 font-medium">{selectedShift.shift_description}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="text-green-600" size={16} /> Start: {selectedShift.start_time?.slice(0,5) || 'N/A'}
                        </span>
                        <span>→</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="text-red-600" size={16} /> End: {selectedShift.end_time?.slice(0,5) || 'N/A'}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          <Clock size={14} /> Duration: {calculateShiftDuration()}h
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-500 text-sm">Pick a shift to view its details and configure parameters.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* New Configuration form with parameter fields */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Configure Parameters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift Hours per Day
                <span className="text-xs text-gray-500 block">Hours worked per day</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="8.00"
                  value={num(form.shift_hours_per_day)}
                  onChange={onNumberChange("shift_hours_per_day")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">hrs</span>
              </div>
              {errors?.shift_hours_per_day && <p className="text-xs text-red-600 mt-1">{errors.shift_hours_per_day[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Days per Month
                <span className="text-xs text-gray-500 block">Expected working days</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="30.00"
                  value={num(form.working_days_per_month)}
                  onChange={onNumberChange("working_days_per_month")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">days</span>
              </div>
              {errors?.working_days_per_month && <p className="text-xs text-red-600 mt-1">{errors.working_days_per_month[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OT Multiplier
                <span className="text-xs text-gray-500 block">Overtime rate multiplier</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="1.50"
                  value={num(form.ot_multiplier)}
                  onChange={onNumberChange("ot_multiplier")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">×</span>
              </div>
              {errors?.ot_multiplier && <p className="text-xs text-red-600 mt-1">{errors.ot_multiplier[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Holiday Multiplier
                <span className="text-xs text-gray-500 block">Holiday rate multiplier</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="2.00"
                  value={num(form.holiday_multiplier)}
                  onChange={onNumberChange("holiday_multiplier")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">×</span>
              </div>
              {errors?.holiday_multiplier && <p className="text-xs text-red-600 mt-1">{errors.holiday_multiplier[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ignore Hours Threshold
                <span className="text-xs text-gray-500 block">Hours to ignore before OT</span>
              </label>
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="1"
                      value={form.ignore_hours_threshold.hours}
                      onChange={onThresholdChange("hours")}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      step="1"
                      value={form.ignore_hours_threshold.minutes}
                      onChange={onThresholdChange("minutes")}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Set threshold for ignoring overtime calculations (e.g., 1 hour 30 minutes)
                </p>
              </div>
              {errors?.ignore_hours_threshold && <p className="text-xs text-red-600 mt-1">{errors.ignore_hours_threshold[0]}</p>}
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">💡 How the new system works:</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• <strong>Shift Hours per Day:</strong> Used to calculate total monthly hours (Hours × Days)</li>
              <li>• <strong>Working Days per Month:</strong> Expected working days for calculating hourly rate</li>
              <li>• <strong>OT Multiplier:</strong> Factor to multiply base rate for overtime (typically 1.5)</li>
              <li>• <strong>Holiday Multiplier:</strong> Factor to multiply base rate for holidays (typically 2.0)</li>
              <li>• <strong>Rates are calculated dynamically:</strong> Employee Salary ÷ (Hours × Days) × Multiplier</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || loading || !selectedShiftId}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {recordId ? "Update Configuration" : "Save Configuration"}
                </>
              )}
            </button>

            <button
              onClick={handleClear}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <X size={18} />
              Clear Form
            </button>

            {recordId && (
              <div className="inline-flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">Configuration saved for this shift</span>
              </div>
            )}
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="inline-flex items-center gap-2 text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">Please fix validation errors</span>
            </div>
          )}
        </div>
      </div>

      {/* Updated Modal for Saved Data */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Saved Shift Overtime Configurations</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-[calc(90vh-140px)]">
              {loadingTable ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : savedRates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No saved overtime configurations found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Shift Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Hours/Day</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Days/Month</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">OT Multiplier</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Holiday Multiplier</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Ignore Threshold</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedRates.map((rate, index) => (
                        <tr key={rate.id} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{rate.shift_code}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{rate.shift_description}</td>
                          <td className="px-4 py-3 text-sm text-right font-mono text-gray-900">
                            {Number(rate.shift_hours_per_day).toFixed(2)}h
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono text-gray-900">
                            {Number(rate.working_days_per_month).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono text-green-700">
                            {Number(rate.ot_multiplier).toFixed(2)}×
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono text-orange-700">
                            {Number(rate.holiday_multiplier).toFixed(2)}×
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            {rate.ignore_hours_threshold && (rate.ignore_hours_threshold.hours || rate.ignore_hours_threshold.minutes) ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {rate.ignore_hours_threshold.hours || '0'}h {rate.ignore_hours_threshold.minutes || '0'}m
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-xs">Not set</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditRate(rate)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteRate(rate.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
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

export default ShiftOvertimeRates;