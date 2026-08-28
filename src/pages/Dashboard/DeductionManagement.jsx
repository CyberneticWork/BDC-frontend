import { FileText } from "lucide-react";
import { lazy, memo, Suspense, useState } from "react";

const CompanyWiseDeduction = lazy(() => import("./createnewdeduction"));
const EmployeeWiseDeduction = lazy(() => import("./EmployeeWiseDeduction"));

const ModesGroup = memo(({ selectedTab, onTabSelect }) => {
    const baseButtonStyles =
        "flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200 first:rounded-l-xl last:rounded-r-xl";
    const activeStyles =
        "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md z-10";
    const inactiveStyles =
        "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200";

    return (
        <div className="inline-flex rounded-xl shadow-sm -space-x-px" role="group">
            <button
                type="button"
                onClick={() => onTabSelect("company")}
                className={`${baseButtonStyles} ${selectedTab === "company" ? activeStyles : inactiveStyles}`}
            >
                Company Wise (Predefine)
            </button>
            <button
                type="button"
                onClick={() => onTabSelect("employee")}
                className={`${baseButtonStyles} ${selectedTab === "employee" ? activeStyles : inactiveStyles}`}
            >
                Assign (All / Employee)
            </button>
        </div>
    );
});

const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
);

function DeductionManagement() {
    const [selectedTab, setSelectedTab] = useState("company");

    return (
        <div className="w-full min-h-screen p-4 md:p-8 bg-gray-50">
            <div className="max-w-7xl mx-auto w-full">
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="p-2 bg-red-500 rounded-lg">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                Deduction Management
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Manage company and employee-wise deductions
                            </p>
                        </div>
                        <ModesGroup selectedTab={selectedTab} onTabSelect={setSelectedTab} />
                    </div>
                </div>
                <div className="border border-slate-100 rounded-2xl bg-white shadow-sm">
                    <Suspense fallback={<LoadingSpinner />}>
                        {selectedTab === "company" ? (
                            <CompanyWiseDeduction />
                        ) : (
                            <EmployeeWiseDeduction />
                        )}
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

export default memo(DeductionManagement);
