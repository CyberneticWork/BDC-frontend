import React, { useEffect, useMemo, useState } from "react";
import { Clock, DollarSign, Save, Info, CheckCircle2, AlertCircle, Building2, X, Calculator, ArrowRight, Eye, Trash2, Edit } from "lucide-react";
import Swal from "sweetalert2";
import ShiftOvertimeRateService from "@services/ShiftOvertimeRateService";

const num = (v) => (v === "" || v === null || v === undefined ? "" : String(v));
const toFixedOrEmpty = (v) => (v === "" || v === null || v === undefined ? "" : Number(v).toFixed(2));

const initialForm = {
  shift_id: "",
  normal_hours_rate: "",
  ot_rate: "",
  holiday_rate: "",
  ignore_hours_threshold: "1.00",
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
      } catch (e) {
        Swal.fire({ icon: "error", title: "Error", text: "Failed to load shifts" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // When shift changes, fetch any existing rate + hydrate shift meta
  useEffect(() => {
    (async () => {
      setErrors({});
      setRecordId(null);
      setSelectedShift(null);
      if (!selectedShiftId) {
        setForm(initialForm);
        return;
      }

      const meta = shifts.find((s) => String(s.id) === String(selectedShiftId));
      setSelectedShift(meta || null);

      try {
        setLoading(true);
        const existing = await ShiftOvertimeRateService.getByShiftId(selectedShiftId);
        if (existing) {
          setRecordId(existing.id);
          setForm({
            shift_id: existing.shift_id,
            normal_hours_rate: toFixedOrEmpty(existing.normal_hours_rate),
            ot_rate: toFixedOrEmpty(existing.ot_rate),
            holiday_rate: toFixedOrEmpty(existing.holiday_rate),
            ignore_hours_threshold: toFixedOrEmpty(existing.ignore_hours_threshold),
          });
        } else {
          setForm({
            ...initialForm,
            shift_id: selectedShiftId,
          });
        }
      } catch (e) {
        Swal.fire({ icon: "error", title: "Error", text: "Failed to load OT rate for selected shift" });
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedShiftId, shifts]);

  const onNumberChange = (key) => (e) => {
    const v = e.target.value;
    // allow empty, else numeric with up to 2 decimals
    if (v === "" || /^\d{0,4}(\.\d{0,2})?$/.test(v)) {
      setForm((prev) => ({ ...prev, [key]: v }));
    }
  };

  const onThresholdChange = (e) => {
    const v = e.target.value;
    if (v === "" || /^\d{0,2}(\.\d{0,2})?$/.test(v)) {
      setForm((prev) => ({ ...prev, ignore_hours_threshold: v }));
    }
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
      normal_hours_rate: form.normal_hours_rate === "" ? 0 : Number(form.normal_hours_rate),
      ot_rate: form.ot_rate === "" ? 0 : Number(form.ot_rate),
      holiday_rate: form.holiday_rate === "" ? 0 : Number(form.holiday_rate),
      ignore_hours_threshold: form.ignore_hours_threshold === "" ? 0 : Number(form.ignore_hours_threshold),
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
        Swal.fire({ icon: "success", title: "Updated", text: "Shift OT rates updated successfully.", timer: 1500, showConfirmButton: false });
      } else {
        const created = await ShiftOvertimeRateService.create(payload);
        setRecordId(created?.id ?? null);
        Swal.fire({ icon: "success", title: "Saved", text: "Shift OT rates saved successfully.", timer: 1500, showConfirmButton: false });
      }
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to save OT rates.";
      const val = e?.response?.data?.errors;
      if (val) setErrors(val);
      Swal.fire({ icon: "error", title: "Error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setSelectedShiftId("");
    setSelectedShift(null);
    setForm({
      shift_id: "",
      normal_hours_rate: "",
      ot_rate: "",
      holiday_rate: "",
      ignore_hours_threshold: "1.00",
    });
    setRecordId(null);
    setErrors({});
  };

  // Function to copy calculated rates to form
  const copyCalculatedRates = () => {
    setForm(prev => ({
      ...prev,
      normal_hours_rate: independentCalcs.hourlyRate.toFixed(2),
      ot_rate: independentCalcs.otRate.toFixed(2),
      holiday_rate: independentCalcs.holidayRate.toFixed(2)
    }));
    Swal.fire({
      icon: "success",
      title: "Rates Copied",
      text: "Calculated rates have been copied to the form.",
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
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load saved rates" });
    } finally {
      setLoadingTable(false);
    }
  };

  // Edit rate from table
  const handleEditRate = (rate) => {
    setSelectedShiftId(String(rate.shift_id));
    setShowModal(false);
    // The useEffect will handle loading the data
  };

  // Delete rate
  const handleDeleteRate = async (id) => {
    const result = await Swal.fire({
      title: "Delete Rate?",
      text: "Are you sure you want to delete this overtime rate configuration?",
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
          text: "Rate configuration has been deleted.",
          timer: 1500,
          showConfirmButton: false,
        });
        // Reload the table
        loadSavedRates();
      } catch (e) {
        Swal.fire({ icon: "error", title: "Error", text: "Failed to delete rate" });
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
              <h1 className="text-2xl font-bold text-gray-900">Shift Overtime Rates</h1>
              <p className="text-gray-600">Configure normal hours rate, OT rate, holiday rate, and ignore-hours threshold per shift</p>
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

      {/* Independent Rate Calculator Card */}
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

          {/* Results Section */}
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

      {/* Shift Selection and Rate Configuration Card */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        {/* Shift picker + meta */}
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
                    <span className="text-gray-500 text-sm">Pick a shift to view its details and configure rates.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rates form */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Configure Rates</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Normal Hours Rate
                <span className="text-xs text-gray-500 block">Rate for regular working hours</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rs.</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={num(form.normal_hours_rate)}
                  onChange={onNumberChange("normal_hours_rate")}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {errors?.normal_hours_rate && <p className="text-xs text-red-600 mt-1">{errors.normal_hours_rate[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overtime Rate
                <span className="text-xs text-gray-500 block">Rate for overtime hours</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rs.</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={num(form.ot_rate)}
                  onChange={onNumberChange("ot_rate")}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {errors?.ot_rate && <p className="text-xs text-red-600 mt-1">{errors.ot_rate[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Holiday Rate
                <span className="text-xs text-gray-500 block">Rate for holiday work</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rs.</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={num(form.holiday_rate)}
                  onChange={onNumberChange("holiday_rate")}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {errors?.holiday_rate && <p className="text-xs text-red-600 mt-1">{errors.holiday_rate[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ignore Hours Threshold
                <span className="text-xs text-gray-500 block">Hours to ignore before calculating OT</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="1.00"
                  value={num(form.ignore_hours_threshold)}
                  onChange={onThresholdChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">hrs</span>
              </div>
              {errors?.ignore_hours_threshold && <p className="text-xs text-red-600 mt-1">{errors.ignore_hours_threshold[0]}</p>}
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">💡 How it works:</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• <strong>Normal Hours Rate:</strong> Applied to regular working hours within shift duration</li>
              <li>• <strong>Overtime Rate:</strong> Applied to hours worked beyond normal shift hours</li>
              <li>• <strong>Holiday Rate:</strong> Special rate for work performed on designated holidays</li>
              <li>• <strong>Ignore Hours Threshold:</strong> Hours to ignore before calculating overtime (e.g., 1.00 = ignore first hour of OT)</li>
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
                  {recordId ? "Update Rates" : "Save Rates"}
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
                <span className="text-sm font-medium">Rates configured for this shift</span>
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

      {/* Modal for Saved Data */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Saved Shift Overtime Rates</h2>
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
                  <p className="text-gray-500">No saved overtime rates found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Shift Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Normal Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">OT Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Holiday Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Ignore Threshold</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedRates.map((rate, index) => (
                        <tr key={rate.id} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{rate.shift_code}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{rate.shift_description}</td>
                          <td className="px-4 py-3 text-sm text-right font-mono text-gray-900">
                            Rs. {Number(rate.normal_hours_rate).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono text-green-700">
                            Rs. {Number(rate.ot_rate).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono text-orange-700">
                            Rs. {Number(rate.holiday_rate).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono text-gray-700">
                            {Number(rate.ignore_hours_threshold).toFixed(2)} hrs
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