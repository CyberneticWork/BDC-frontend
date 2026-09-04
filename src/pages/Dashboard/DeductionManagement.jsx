import { ArrowRight, FileMinus, ListChecks, Settings2 } from "lucide-react";
import { lazy, memo, Suspense, useState } from "react";

const PredefineDeduction = lazy(() => import("./createnewdeduction"));
const AssignDeduction = lazy(() => import("./EmployeeWiseDeduction"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
  </div>
);

function DeductionManagement() {
  const [selectedTab, setSelectedTab] = useState("predefine");

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-rose-50/25 to-slate-100 p-4 md:p-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              <span className="rounded-xl bg-rose-700 p-2.5 shadow-sm">
                <FileMinus className="h-6 w-6 text-white" />
              </span>
              Deduction Management
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Predefine deduction masters first, then assign Fixed (month range) or Variable
              (single month) to employees or the whole company.
            </p>
          </div>

          <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setSelectedTab("predefine")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition ${
                selectedTab === "predefine"
                  ? "bg-rose-700 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Settings2 className="h-4 w-4" />
              1. Predefine
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab("assign")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition ${
                selectedTab === "assign"
                  ? "bg-rose-700 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ListChecks className="h-4 w-4" />
              2. Assign
            </button>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-rose-100 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm backdrop-blur">
          <span
            className={`rounded-lg px-2.5 py-1 font-medium ${
              selectedTab === "predefine"
                ? "bg-rose-100 text-rose-900"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            Predefine catalog
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400" />
          <span
            className={`rounded-lg px-2.5 py-1 font-medium ${
              selectedTab === "assign"
                ? "bg-rose-100 text-rose-900"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            Assign Fixed or Variable
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <Suspense fallback={<LoadingSpinner />}>
            {selectedTab === "predefine" ? <PredefineDeduction /> : <AssignDeduction />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default memo(DeductionManagement);
