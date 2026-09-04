import React, { useEffect, useState } from "react";
import { Building2, RefreshCw, Save } from "lucide-react";
import Swal from "sweetalert2";
import { fetchCompanies, updateCompany } from "../../services/ApiDataService";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Company NoPay working-day divisor (e.g. 30 / 25 / 22).
 * Used as: day salary = amount / nopay_working_days for leave-shortfall NoPay.
 * ACL: module "nopayWorkingDays" view/edit.
 */
const NopayWorkingDaysSettings = () => {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("nopayWorkingDays", "edit");
  const canView = hasPermission("nopayWorkingDays", "view") || canEdit;

  const [companies, setCompanies] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCompanies();
      const list = Array.isArray(data) ? data : [];
      setCompanies(list);
      const next = {};
      list.forEach((c) => {
        next[c.id] = Number(c.nopay_working_days ?? 30) || 30;
      });
      setDrafts(next);
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Failed to load companies" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) load();
  }, [canView]);

  const saveOne = async (company) => {
    if (!canEdit) return;
    const days = Number(drafts[company.id]);
    if (!Number.isFinite(days) || days < 1 || days > 31) {
      Swal.fire({
        icon: "warning",
        title: "Invalid days",
        text: "Enter a working-day count between 1 and 31 (e.g. 30, 25, 22).",
      });
      return;
    }

    setSavingId(company.id);
    try {
      await updateCompany(company.id, {
        company_code: company.company_code,
        name: company.name,
        location: company.location,
        established: company.established,
        nopay_working_days: Math.round(days),
      });
      Swal.fire({
        icon: "success",
        title: "Saved",
        text: `${company.name}: NoPay day rate uses ÷ ${Math.round(days)}`,
        timer: 1800,
        showConfirmButton: false,
      });
      await load();
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: e?.response?.data?.message || "Could not update company.",
      });
    } finally {
      setSavingId(null);
    }
  };

  if (!canView) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
          You do not have permission to view NoPay Working Days settings. Ask an admin to grant ACL module{" "}
          <span className="font-mono">nopayWorkingDays</span>.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">NoPay Working Days</h1>
          <p className="mt-1 text-sm text-gray-600 max-w-2xl">
            Each company chooses how many days to divide by for leave-shortfall NoPay day salary
            (basic + monthly bonus). Example: with 30 days, day rate = total ÷ 30. Use 25 or 22 if
            that matches company policy. Late-coming NoPay is unchanged.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500 text-sm">Loading companies…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Working days (divisor)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-blue-700">{c.company_code || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-gray-400" />
                        {c.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={31}
                          step={1}
                          disabled={!canEdit}
                          value={drafts[c.id] ?? 30}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))
                          }
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                        />
                        <span className="text-xs text-gray-500">days (1–31)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <button
                          type="button"
                          disabled={savingId === c.id}
                          onClick={() => saveOne(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-sm hover:bg-teal-800 disabled:opacity-60"
                        >
                          <Save size={14} />
                          {savingId === c.id ? "Saving…" : "Save"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                      No companies found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NopayWorkingDaysSettings;
