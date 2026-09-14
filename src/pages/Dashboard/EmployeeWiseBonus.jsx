import employeeService from "@services/EmployeeDataService";
import DatePickerInput from "@components/DatePickerInput";
import { Edit3, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
// import * as EmployeeWiseBonusService from "@services/EmployeeWiseBonusService";
import * as EmployeeWiseBonusService from "../../services/EmployeeWiseBonusService";
import { format, parseISO, isValid } from "date-fns";

function EmployeeWiseBonus() {
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [createFormVisible, setCreateFormVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [selectedForDelete, setSelectedForDelete] = useState(null);

    const filteredData = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (!term) return data;

        return data.filter(rec =>
            rec.bonus_code.includes(searchTerm) ||
            rec.bonus_name.includes(searchTerm) ||
            rec.employee_name.includes(searchTerm)
        );
    }, [data, searchTerm]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        console.log(selectedRecord);
    }, [selectedRecord]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await EmployeeWiseBonusService.getAll();
            setData(res);
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "An unknown error occurred!");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createBonusRecord = useCallback(async (data, onFinished) => {
        try {
            const res = await EmployeeWiseBonusService.createOne(data);
            setData(prev => [...prev, res]);
            toast.success("Bonus record created successfully.");
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "An unknown error occurred!");
        } finally {
            onFinished.apply(null, []);
        }
    }, []);

    const updateBonusRecord = useCallback(async (id, data, onFinished) => {
        try {
            const res = await EmployeeWiseBonusService.updateOne(id, data);
            console.log(res);
            setData(prev =>
                prev.map(rec => rec.id === id ? { ...rec, ...res } : rec)
            );
            toast.success("Bonus record updated successfully.");
            setSelectedRecord(null);
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "An unknown error occurred!");
        } finally {
            onFinished.apply(null, []);
        }
    }, []);

    const deleteBonusRecord = useCallback(async (onFinished) => {
        try {
            const res = await EmployeeWiseBonusService.deleteOne(selectedForDelete.id);
            setData(prev => prev.filter(rec => rec.id !== selectedForDelete.id));
            toast.success(res);
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "An unknonw error occurred!");
        } finally {
            setSelectedForDelete(null);
            onFinished.apply(null, []);
        }
    }, [selectedForDelete]);

    const handleAddNewBonusClick = useCallback(() => {
        setCreateFormVisible(true);
    }, []);

    const handleEditClick = useCallback((rec) => {
        if (!rec) return;
        setSelectedRecord(rec);
    }, []);

    const handleDeleteClick = useCallback((rec) => {
        if (!rec) return;
        setSelectedForDelete(rec);
    }, []);

    /**
     * @typedef CreateFormType
     * @property {number} employee_id
     * @property {string} bonus_code
     * @property {string} bonus_name
     * @property {string} bonus_description
     * @property {number} amount 
     * @property {date} date
     * 
     * @typedef CreateFormModalPropType
     * @property {function(CreateFormType, function(): void): (void | Promise<void>)} onSubmit
     * @property {function(): void} onClose
     * 
     * @param {CreateFormModalPropType} props  
     * @returns {import("react").JSX.Element}
     */
    function CreateFormModal({ onSubmit, onClose }) {
        const [isProcessing, setIsProcessing] = useState(false);
        const [employee, setEmployee] = useState(null);
        const [form, setForm] = useState({
            bonus_code: "",
            bonus_name: "",
            bonus_description: "",
            amount: 0,
            date: new Date(Date.now()),
            is_annual: false,
            payment_months: [],
        });

        const monthOptions = [
            { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
            { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
            { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
            { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
        ];

        const togglePaymentMonth = (month) => {
            setForm(prev => {
                const months = prev.payment_months.includes(month)
                    ? prev.payment_months.filter(m => m !== month)
                    : [...prev.payment_months, month];
                return { ...prev, payment_months: months.sort((a, b) => a - b) };
            });
        };

        const employee_attendance_id_ref = useRef(null);

        const handleSearchEmployeeClick = useCallback(() => {
            if (!employee_attendance_id_ref.current) {
                toast.error("An unknown error occurred!");
                return;
            }

            const employee_attendance_id = employee_attendance_id_ref.current.value;
            if (!employee_attendance_id || employee_attendance_id.length < 1) {
                toast.error("Invalid attendance id!");
                return;
            }

            fetchEmployeeByAttendanceId(employee_attendance_id);
        }, [employee_attendance_id_ref]);

        const fetchEmployeeByAttendanceId = useCallback(async (employee_attendance_id) => {
            setIsProcessing(true);
            try {
                const res = await employeeService.searchByAttendanceNo(employee_attendance_id);
                if (!res || Object.keys(res).length < 1) {
                    toast.error("Employee not found!");
                    return;
                }
                setEmployee(res);
            } catch (err) {
                console.error(err);
                toast.error(err instanceof Error ? err.message : "An unknown error occurred!");
            } finally {
                setIsProcessing(false);
            }
        }, []);

        const updateForm = useCallback((name, value) => {
            setForm(prev => ({ ...prev, [name]: value }));
        }, []);

        const handleSubmit = useCallback(() => {
            setIsProcessing(true);

            const payload = {
                employee_id: employee.id,
                ...form,
                amount: Number(form.amount),
                is_annual: !!form.is_annual,
                payment_months: form.is_annual ? form.payment_months : null,
            };

            onSubmit?.apply(this, [payload, () => setIsProcessing(false)]);
        }, [form, employee]);

        return (
            <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center p-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Add New Bonus
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">
                                Create a new Bonus entry
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="bg-blue-100 rounded-lg">
                            <div className="flex justify-start px-2 pt-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Employee Details
                                </label>
                            </div>
                            <div className="grid grid-cols-12 sm:grid-cols-12 gap-4 p-2">
                                <div className="col-span-10">
                                    <input
                                        ref={employee_attendance_id_ref}
                                        type="text"
                                        className={`w-full px-4 py-3 border "border-gray-200" rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                        placeholder="Enter employee id"
                                    />
                                </div>
                                <div className="col-span-2 flex justify-end">
                                    <button
                                        className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all font-medium shadow-lg disabled:shadow-none flex items-center gap-2"
                                        onClick={handleSearchEmployeeClick}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="animate-spin h-4 w-4" />
                                        ) : (
                                            <Search className="text-white w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            {employee && <div className="grid grid-cols-2 p-2">
                                <div className="col-span-1 flex flex-col">
                                    <span>Full Name</span>
                                    <span>Attendance No</span>
                                    <span>NIC</span>
                                    <span>EPF No</span>
                                </div>
                                <div className="col-span-1 flex flex-col">
                                    <span>{employee?.full_name}</span>
                                    <span>{employee?.attendance_employee_no}</span>
                                    <span>{employee?.nic}</span>
                                    <span>{employee?.epf}</span>
                                </div>
                            </div>}
                        </div>

                        {employee && (<>
                            <div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Bonus Code *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.bonus_code}
                                        onChange={(e) =>
                                            updateForm("bonus_code", e.target.value)
                                        }
                                        className={`w-full px-4 py-3 border "border-gray-200" rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                        placeholder="Enter Bonus code"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Bonus Name *
                                </label>
                                <input
                                    type="text"
                                    value={form.bonus_name}
                                    onChange={(e) =>
                                        updateForm("bonus_name", e.target.value)
                                    }
                                    className={`w-full px-4 py-3 border "border-gray-200" rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                    placeholder="Enter Bonus name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Bonus Description
                                </label>
                                <input
                                    type="text"
                                    value={form.bonus_description}
                                    onChange={(e) => updateForm("bonus_description", e.target.value)}
                                    className={`w-full px-4 py-3 border "border-gray-200" rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                    placeholder="Enter Bonus description"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Date Configuration *
                                </label>
                                <DatePickerInput
                                    value={form.date}
                                    onChange={(e) =>
                                        updateForm("date", e.target.value)
                                    }
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all`}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Amount *
                                </label>
                                <input
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => updateForm("amount", e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all`}
                                    placeholder="Enter Bonus amount"
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_annual_create"
                                    checked={form.is_annual}
                                    onChange={(e) => updateForm("is_annual", e.target.checked)}
                                />
                                <label htmlFor="is_annual_create" className="text-sm font-medium text-gray-700">
                                    Annual bonus (paid in selected months only)
                                </label>
                            </div>

                            {form.is_annual && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Payment Months
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {monthOptions.map(({ value, label }) => (
                                            <label key={value} className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={form.payment_months.includes(value)}
                                                    onChange={() => togglePaymentMonth(value)}
                                                />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>)}
                    </div>

                    <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                            disabled={isProcessing}
                        >
                            Cancel
                        </button>
                        {employee && <button
                            onClick={handleSubmit}
                            disabled={isProcessing}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all font-medium shadow-lg disabled:shadow-none flex items-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    Processing...
                                </>
                            ) : (
                                "Add Bonus"
                            )}
                        </button>}
                    </div>
                </div>
            </div>
        );
    }

    /**
     * @typedef UpdateFormType
     * @property {number} employee_id
     * @property {string} bonus_code
     * @property {string} bonus_name
     * @property {string} bonus_description
     * @property {number} amount 
     * @property {string} status
     * @property {date} date
     * 
     * @typedef UpdateFormModalPropType
     * @property {import("../../services/EmployeeWiseBonusService").EmployeeWiseBonus} selectedRecord
     * @property {function(): any} setSelectedRecord
     * @property {function(UpdateFormType, function(): void): (void | Promise<void>)} onSubmit
     * @property {function(): void} onClose
     * 
     * @param {UpdateFormModalPropType} props  
     * @returns {import("react").JSX.Element}
     */
    function UpdateFormModal({ selectedRecord, setSelectedRecord, onSubmit, onClose }) {
        const [isProcessing, setIsProcessing] = useState(false);

        const monthOptions = [
            { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
            { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
            { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
            { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
        ];

        const paymentMonths = Array.isArray(selectedRecord.payment_months)
            ? selectedRecord.payment_months
            : (typeof selectedRecord.payment_months === 'string'
                ? JSON.parse(selectedRecord.payment_months || '[]')
                : []);

        const updateForm = useCallback((name, value) => {
            setSelectedRecord(prev => ({ ...prev, [name]: value }));
        }, []);

        const togglePaymentMonth = (month) => {
            setSelectedRecord(prev => {
                const current = Array.isArray(prev.payment_months) ? prev.payment_months : paymentMonths;
                const months = current.includes(month)
                    ? current.filter(m => m !== month)
                    : [...current, month];
                return { ...prev, payment_months: months.sort((a, b) => a - b) };
            });
        };

        const handleSubmit = useCallback(() => {
            setIsProcessing(true);

            const payload = {
                employee_id: selectedRecord.employee_id,
                bonus_name: selectedRecord.bonus_name,
                bonus_description: selectedRecord.bonus_description,
                amount: Number(selectedRecord.amount),
                status: selectedRecord.status,
                date: selectedRecord.date,
                is_annual: !!selectedRecord.is_annual,
                payment_months: selectedRecord.is_annual ? (selectedRecord.payment_months || paymentMonths) : null,
            };

            onSubmit?.apply(this, [selectedRecord.id, payload, () => setIsProcessing(false)]);
        }, [selectedRecord, paymentMonths]);

        return (
            <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center p-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Update Bonus
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">
                                Update an existing Bonus entry
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <>
                            <div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Bonus Code *
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedRecord.bonus_code}
                                        onChange={(e) =>
                                            updateForm("bonus_code", e.target.value)
                                        }
                                        className={`w-full px-4 py-3 border "border-gray-200" rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                        placeholder="Enter Bonus code"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Bonus Name *
                                </label>
                                <input
                                    type="text"
                                    value={selectedRecord.bonus_name}
                                    onChange={(e) =>
                                        updateForm("bonus_name", e.target.value)
                                    }
                                    className={`w-full px-4 py-3 border "border-gray-200" rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                    placeholder="Enter Bonus name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Bonus Description
                                </label>
                                <input
                                    type="text"
                                    value={selectedRecord.bonus_description}
                                    onChange={(e) => updateForm("bonus_description", e.target.value)}
                                    className={`w-full px-4 py-3 border "border-gray-200" rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                    placeholder="Enter Bonus description"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Date Configuration *
                                </label>
                                <DatePickerInput
                                    value={selectedRecord.date}
                                    onChange={(e) =>
                                        updateForm("date", e.target.value)
                                    }
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all`}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Amount *
                                </label>
                                <input
                                    type="number"
                                    value={selectedRecord.amount}
                                    onChange={(e) => updateForm("amount", e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all`}
                                    placeholder="Enter Bonus amount"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Status *
                                </label>
                                <select
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all`}
                                    value={selectedRecord.status}
                                    onChange={(e) => updateForm("status", e.target.value)}
                                >
                                    <option value={"active"}>Active</option>
                                    <option value={"inactive"}>Inactive</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_annual_update"
                                    checked={!!selectedRecord.is_annual}
                                    onChange={(e) => updateForm("is_annual", e.target.checked)}
                                />
                                <label htmlFor="is_annual_update" className="text-sm font-medium text-gray-700">
                                    Annual bonus
                                </label>
                            </div>

                            {selectedRecord.is_annual && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Payment Months
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {monthOptions.map(({ value, label }) => (
                                            <label key={value} className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={(selectedRecord.payment_months || paymentMonths).includes(value)}
                                                    onChange={() => togglePaymentMonth(value)}
                                                />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    </div>

                    <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                            disabled={isProcessing}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isProcessing}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all font-medium shadow-lg disabled:shadow-none flex items-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    Processing...
                                </>
                            ) : (
                                "Update Bonus"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /**
     * @typedef DeleteFormModalProps
     * @property {function(function(): void): (void | Promise<void>) } onSubmit 
     * @property {function(): void} onClose
     * 
     * @param {DeleteFormModalProps} props
     * @returns {import("react").JSX.Element}
     */
    function DeleteFormModal({ onSubmit, onClose }) {
        const [isProcessing, setIsProcessing] = useState(false);

        const handleCloseClick = useCallback(() => {
            onClose?.apply(null, []);
        }, []);

        const handleSubmit = useCallback(() => {
            setIsProcessing(true);
            onSubmit?.apply(null, [() => setIsProcessing(false)]);
        }, []);

        return (
            <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            Delete Bonus
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this record?
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={handleCloseClick}
                                className="px-6 py-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                                disabled={isProcessing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isProcessing}
                                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 disabled:from-gray-300 disabled:to-gray-300 transition-all font-medium shadow-lg disabled:shadow-none flex items-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col flex-1 overflow-hidden">

            <div className="mb-8 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleAddNewBonusClick}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <Plus size={20} />
                            <span className="font-medium">Add New Bonus</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 shrink-0">
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search Bonuss by name or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col flex-1 overflow-hidden">
                <div className="overflow-auto flex-1 current-scrollbar">
                    <table className="w-full min-w-[1000px] table-auto border-collapse">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">
                            <tr>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700">
                                    Code
                                </th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700">
                                    Bonus Name
                                </th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden lg:table-cell">
                                    Employee ID
                                </th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden lg:table-cell">
                                    Employee Name
                                </th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden sm:table-cell">
                                    Amount
                                </th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden sm:table-cell">
                                    Date
                                </th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden lg:table-cell">
                                    Status
                                </th>
                                <th className="text-right py-4 px-6 font-semibold text-gray-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        {isLoading ? (
                            <tbody>
                                <tr>
                                    <td colSpan="8" className="py-24">
                                        <div className="flex flex-col items-center justify-center gap-3 w-full">
                                            <Loader2 className="animate-spin h-10 w-10 text-blue-600 stroke-[2.5]" />
                                            <p className="text-sm font-medium text-slate-500 animate-pulse">
                                                Loading Bonus records...
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        ) : (
                            <tbody className="divide-y divide-gray-100">
                                {filteredData.length < 1 ? (
                                    <tr>
                                        <td colSpan="11" className="text-center py-12">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-4 bg-gray-100 rounded-full">
                                                    <Search className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <p className="text-gray-500 font-medium">
                                                    No Bonuss found
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    Try adjusting your search criteria
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((rec) => (
                                        <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6">
                                                <span className="text-blue-600 font-bold text-sm">
                                                    {rec.bonus_code}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 font-medium text-gray-900">
                                                {rec.bonus_name}
                                            </td>
                                            <td className="py-4 px-6 hidden lg:table-cell text-gray-600">
                                                {rec.employee_id}
                                            </td>
                                            <td className="py-4 px-6 hidden lg:table-cell text-gray-600">
                                                {rec.employee_name || "—"}
                                            </td>
                                            <td className="py-4 px-6 hidden sm:table-cell text-gray-900 font-semibold">
                                                LKR {parseFloat(rec.amount).toFixed(2)}
                                            </td>
                                            <td className="py-4 px-6 hidden sm:table-cell text-gray-500">
                                                {rec.date && isValid(parseISO(String(rec.date).slice(0, 10))) ? format(parseISO(String(rec.date).slice(0, 10)), "yyyy-MM-dd") : "—"}
                                            </td>
                                            <td className="py-4 px-6 hidden lg:table-cell">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${rec.status === 'active'
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                                                    }`}>
                                                    {rec.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditClick(rec)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="Edit Bonus"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(rec)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Delete Bonus"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        )}
                    </table>
                </div>
            </div>

            {createFormVisible &&
                <CreateFormModal
                    onClose={() => setCreateFormVisible(false)}
                    onSubmit={(data, onFinished) => createBonusRecord(data, onFinished)}
                />
            }

            {selectedRecord &&
                <UpdateFormModal
                    selectedRecord={selectedRecord}
                    setSelectedRecord={setSelectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    onSubmit={(id, data, onFinished) => updateBonusRecord(id, data, onFinished)}
                />
            }

            {selectedForDelete &&
                <DeleteFormModal
                    onClose={() => setSelectedForDelete(null)}
                    onSubmit={deleteBonusRecord}
                />}
        </div>
    );
}

export default memo(EmployeeWiseBonus);