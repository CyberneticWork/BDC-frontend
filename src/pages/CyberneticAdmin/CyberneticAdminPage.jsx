import React, { useEffect, useState } from "react";
import { Building2, Lock, LogOut, Plus, Save, Upload } from "lucide-react";
import Swal from "sweetalert2";
import {
  createCompany,
  fetchCompanies,
  updateCompany,
  uploadCompanyLogo,
} from "../../services/ApiDataService";
import {
  getCyberneticToken,
  loadCyberneticAdmin,
  loginCyberneticAdmin,
  logoutCyberneticAdmin,
} from "../../services/cyberneticAdminService";
import { extractThemeFromImageFile, applyThemeToDocument } from "../../utils/logoTheme";

const emptyForm = {
  company_code: "",
  name: "",
  location: "",
  established: "",
  nopay_working_days: 30,
  slug: "",
  frontend_host: "",
  logo_url: "",
  theme_primary: "#0B4F5C",
  theme_secondary: "#0D9488",
  theme_accent: "#FF6B4A",
  late_attendance_policy_enabled: false,
};

export default function CyberneticAdminPage() {
  const [authed, setAuthed] = useState(!!getCyberneticToken());
  const [checking, setChecking] = useState(!!getCyberneticToken());
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Cybernetic Admin";
    if (!getCyberneticToken()) {
      setChecking(false);
      return;
    }
    loadCyberneticAdmin()
      .then(() => setAuthed(true))
      .catch(() => {
        logoutCyberneticAdmin();
        setAuthed(false);
      })
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!authed) return;
    refresh();
  }, [authed]);

  const refresh = async () => {
    const rows = await fetchCompanies();
    setCompanies(Array.isArray(rows) ? rows : []);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      await loginCyberneticAdmin(password);
      setAuthed(true);
      setPassword("");
    } catch (err) {
      setLoginError(err?.response?.data?.message || "Invalid password.");
    } finally {
      setLoginLoading(false);
    }
  };

  const startEdit = (company) => {
    setEditingId(company.id);
    setLogoFile(null);
    setForm({
      company_code: company.company_code || "",
      name: company.name || "",
      location: company.location || "",
      established: company.established || "",
      nopay_working_days: company.nopay_working_days ?? 30,
      slug: company.slug || "",
      frontend_host: company.frontend_host || "",
      logo_url: company.logo_url || "",
      theme_primary: company.theme_primary || "#0B4F5C",
      theme_secondary: company.theme_secondary || "#0D9488",
      theme_accent: company.theme_accent || "#FF6B4A",
      late_attendance_policy_enabled: !!company.late_attendance_policy_enabled,
    });
  };

  const startAdd = () => {
    setEditingId(null);
    setLogoFile(null);
    setForm(emptyForm);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        company_code: String(form.company_code || "").trim().toUpperCase(),
        established: form.established ? Number(form.established) : null,
        nopay_working_days: Number(form.nopay_working_days || 30),
      };
      let saved;
      if (editingId) {
        saved = await updateCompany(editingId, payload);
      } else {
        saved = await createCompany(payload);
      }
      if (saved?.id && (logoFile || payload.logo_url)) {
        await uploadCompanyLogo(saved.id, logoFile, { logo_url: payload.logo_url });
      }
      Swal.fire({
        icon: "success",
        title: editingId ? "Company updated" : "Company created",
        timer: 1400,
        showConfirmButton: false,
      });
      startAdd();
      await refresh();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not save",
        text: error?.response?.data?.message || "Check the form and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-white">
        Checking access…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl"
        >
          <div className="mb-6 flex items-center gap-3 text-white">
            <Lock className="h-6 w-6 text-teal-400" />
            <div>
              <h1 className="text-xl font-semibold">Cybernetic Admin</h1>
              <p className="text-sm text-slate-400">Company URLs, logos and theme. Not an HR user.</p>
            </div>
          </div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Enter admin password"
          />
          {loginError && <p className="mt-2 text-sm text-red-400">{loginError}</p>}
          <button
            type="submit"
            disabled={loginLoading}
            className="mt-5 w-full rounded-lg bg-teal-500 py-2.5 font-medium text-slate-950 hover:bg-teal-400 disabled:opacity-60"
          >
            {loginLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-teal-400">Cybernetic</p>
            <h1 className="text-lg font-semibold">Company tenants</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              logoutCyberneticAdmin();
              setAuthed(false);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Companies</h2>
            <button
              type="button"
              onClick={startAdd}
              className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-sm text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-slate-500">
                  <th className="py-2 pr-3">Company</th>
                  <th className="py-2 pr-3">HR URL</th>
                  <th className="py-2 pr-3">Late policy</th>
                  <th className="py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-b last:border-0">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        {company.logo_url ? (
                          <img src={company.logo_url} alt="" className="h-8 w-8 object-contain" />
                        ) : (
                          <Building2 className="h-5 w-5 text-slate-400" />
                        )}
                        <div>
                          <div className="font-medium text-slate-900">{company.name}</div>
                          <div className="font-mono text-xs text-slate-500">{company.company_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs text-teal-800">
                      {company.frontend_host || "—"}
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      {company.late_attendance_policy_enabled ? (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 font-semibold text-teal-800">On</span>
                      ) : (
                        <span className="text-slate-400">Off</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(company)}
                        className="text-teal-700 hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {companies.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">No companies yet.</p>
            )}
          </div>
        </section>

        <form onSubmit={save} className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-slate-800">
            {editingId ? "Edit company" : "Add company"}
          </h2>
          <label className="block text-sm">
            Company ID
            <input
              required
              value={form.company_code}
              onChange={(e) => setForm({ ...form, company_code: e.target.value.toUpperCase() })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Location
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="flex items-start gap-2 rounded-lg border border-teal-100 bg-teal-50 p-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={!!form.late_attendance_policy_enabled}
              onChange={(e) => setForm({ ...form, late_attendance_policy_enabled: e.target.checked })}
            />
            <span>
              <span className="font-semibold text-teal-900">Enable late attendance calculation</span>
              <span className="block text-xs text-teal-800">
                For {form.name || "this company"} only: monthly ≤30m deduction and &gt;30m leave/NoPay review. Leave off to ignore.
              </span>
            </span>
          </label>
          <label className="block text-sm">
            HR URL host
            <input
              value={form.frontend_host}
              onChange={(e) => setForm({ ...form, frontend_host: e.target.value.toLowerCase() })}
              className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm"
              placeholder="www.spmhr.lk"
            />
          </label>
          <label className="block text-sm">
            Logo URL (Firebase or any https)
            <input
              type="url"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <Upload className="h-4 w-4" />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                setLogoFile(file || null);
                if (file) {
                  const theme = await extractThemeFromImageFile(file);
                  applyThemeToDocument(theme);
                  setForm((prev) => ({
                    ...prev,
                    theme_primary: theme.primary,
                    theme_secondary: theme.secondary,
                    theme_accent: theme.accent,
                  }));
                }
              }}
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["theme_primary", "theme_secondary", "theme_accent"].map((key) => (
              <label key={key} className="text-xs text-slate-600">
                {key.replace("theme_", "")}
                <input
                  type="color"
                  className="mt-1 h-8 w-full"
                  value={/^#[0-9A-Fa-f]{6}$/.test(form[key] || "") ? form[key] : "#0B4F5C"}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save company"}
          </button>
        </form>
      </main>
    </div>
  );
}
