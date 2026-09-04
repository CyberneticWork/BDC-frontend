import AllowancesService from "@services/AllowancesService";
import { fetchCompanies, fetchDepartmentsById } from "@services/ApiDataService";
import {
  Download,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

const emptyForm = () => ({
  allowance_code: "",
  allowance_name: "",
  company_id: "",
  department_id: "",
  amount: "",
  category: "other",
  status: "active",
});

const CATEGORIES = ["travel", "bonus", "monthly_bonus", "performance", "health", "other"];

export default function CreateNewAllowance() {
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, companyList] = await Promise.all([
        AllowancesService.getAllAllowances(),
        fetchCompanies(),
      ]);
      setRows(list || []);
      setCompanies(companyList || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load allowances");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!form.company_id) {
      setDepartments([]);
      return;
    }
    (async () => {
      try {
        const deps = await fetchDepartmentsById(form.company_id);
        setDepartments(deps || []);
      } catch {
        setDepartments([]);
      }
    })();
  }, [form.company_id]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterCompany && String(r.company_id) !== String(filterCompany)) return false;
      if (!term) return true;
      return (
        String(r.allowance_code || "").toLowerCase().includes(term) ||
        String(r.allowance_name || "").toLowerCase().includes(term) ||
        String(r.company?.name || "").toLowerCase().includes(term)
      );
    });
  }, [rows, search, filterCompany]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      allowance_code: row.allowance_code || "",
      allowance_name: row.allowance_name || "",
      company_id: String(row.company_id || ""),
      department_id: row.department_id ? String(row.department_id) : "",
      amount: row.amount != null ? String(row.amount) : "",
      category: row.category || "other",
      status: row.status || "active",
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const next = {};
    if (!form.allowance_code.trim()) next.allowance_code = "Code is required";
    if (!form.allowance_name.trim()) next.allowance_name = "Name is required";
    if (!form.company_id) next.company_id = "Company is required";
    if (form.amount === "" || Number.isNaN(Number(form.amount)) || Number(form.amount) < 0) {
      next.amount = "Valid amount is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      allowance_code: form.allowance_code.trim(),
      allowance_name: form.allowance_name.trim(),
      company_id: Number(form.company_id),
      department_id: form.department_id ? Number(form.department_id) : null,
      amount: Number(form.amount),
      category: form.category || "other",
      status: form.status,
    };

    setSaving(true);
    try {
      if (editingId) {
        await AllowancesService.updateAllowance(editingId, payload);
        toast.success("Allowance updated");
      } else {
        await AllowancesService.createAllowance(payload);
        toast.success("Allowance predefined");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      if (typeof err === "object" && err !== null) {
        setErrors(err);
        toast.error("Please fix validation errors");
      } else {
        toast.error("Save failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this predefined allowance?")) return;
    try {
      await AllowancesService.deleteAllowance(id);
      toast.success("Deleted");
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await AllowancesService.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "allowances_template.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Template download failed");
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await AllowancesService.importAllowances(file);
      toast.success("Import complete");
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Import failed");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Predefine Allowances</h2>
          <p className="mt-1 text-sm text-slate-600">
            Create the catalog only. Fixed or Variable is chosen later when you assign.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Template
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            <Plus className="h-4 w-4" />
            New Allowance
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, name, company…"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <select
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_label || c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Default amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 hover:bg-teal-50/40">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.allowance_code}</td>
                  <td className="px-4 py-3 text-slate-700">{row.allowance_name}</td>
                  <td className="px-4 py-3 text-slate-600">{row.company?.name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{row.department?.name || "All"}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-800">
                    {Number(row.amount || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="rounded-lg p-1.5 text-teal-700 hover:bg-teal-50"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-slate-500">
                    No predefined allowances yet. Click <strong>New Allowance</strong> to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit Allowance" : "Predefine Allowance"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Code" error={errors.allowance_code?.[0] || errors.allowance_code}>
                  <input
                    value={form.allowance_code}
                    onChange={(e) => setForm((f) => ({ ...f, allowance_code: e.target.value }))}
                    disabled={!!editingId}
                    className="input"
                    required
                  />
                </Field>
                <Field label="Name" error={errors.allowance_name?.[0] || errors.allowance_name}>
                  <input
                    value={form.allowance_name}
                    onChange={(e) => setForm((f) => ({ ...f, allowance_name: e.target.value }))}
                    className="input"
                    required
                  />
                </Field>
              </div>
              <Field label="Company" error={errors.company_id?.[0] || errors.company_id}>
                <select
                  value={form.company_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, company_id: e.target.value, department_id: "" }))
                  }
                  className="input"
                  required
                >
                  <option value="">Select company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_label || c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Department (optional)">
                <select
                  value={form.department_id}
                  onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
                  className="input"
                  disabled={!form.company_id}
                >
                  <option value="">All departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Default amount" error={errors.amount?.[0] || errors.amount}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="input"
                    required
                  />
                </Field>
                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="input"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
              <p className="rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-800">
                Fixed / Variable and apply months are set in the <strong>Assign</strong> step — not
                here.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: #0f766e;
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
        }
        .input:disabled {
          background: #f8fafc;
          color: #64748b;
        }
      `}</style>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
