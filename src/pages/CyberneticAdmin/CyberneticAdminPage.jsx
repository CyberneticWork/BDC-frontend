import React, { useEffect, useState } from "react";
import { Building2, CheckCircle2, Lock, LogOut, Plus, Save, Settings2, Upload } from "lucide-react";
import Swal from "sweetalert2";
import {
  activateCompanyPortal,
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
import { googleDriveLogoUrl } from "../../utils/googleDriveLogo";
import { isFirebaseConfigured, uploadToFirebase } from "../../services/firebaseStorage";

const PROCESS_OPTIONS = [
  {
    key: "spm_standard",
    label: "SPM current process",
    summary:
      "One roster shift per day. Working hours are the full IN–OUT span. OT, late, NoPay, attendance and salary stay on the current SPM Tax rules.",
  },
  {
    key: "shift_roster",
    label: "Shift time & roster",
    summary:
      "Allow more than one shift on the same day. Working hours, OT, late, time attendance and salary are calculated from each assigned shift window.",
  },
];

const OT_HOUR_OPTIONS = [
  {
    key: "current",
    label: "Current OT hours",
    summary:
      "Keep the existing OT hour rule: time is taken in 30-minute blocks, and OT is saved only when it is more than 0.5 hours.",
  },
  {
    key: "minute_band",
    label: "Minute-band OT hours",
    summary:
      "0h 00–29m = 0. 0h 30–44m = 0.30. 0h 45–59m = 0.45. For 1h+: 00–14m keep whole hours; 15–29m add 0.15; 30–44m add 0.30; 45–59m add 0.45.",
  },
];

const FUTURE_CONFIGS = [
  {
    key: "leave_rules",
    label: "Leave rules pack",
    summary: "Company-specific entitlements, short leave and carry-forward.",
  },
  {
    key: "holiday_calendar",
    label: "Holiday calendar pack",
    summary: "Public holidays and OT holiday mapping for this company.",
  },
  {
    key: "biometric_map",
    label: "Biometric device map",
    summary: "Bind Hikvision / fingerprint clocks to this tenant.",
  },
];

const emptyForm = {
  company_code: "",
  name: "",
  location: "",
  established: "",
  nopay_working_days: 30,
  slug: "",
  frontend_host: "",
  org_group: "",
  logo_url: "",
  theme_primary: "#0B4F5C",
  theme_secondary: "#0D9488",
  theme_accent: "#FF6B4A",
  late_attendance_policy_enabled: false,
  portal_active: false,
  attendance_process: "spm_standard",
  ot_hour_calculation: "current",
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
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    document.title = "Cybernetic Admin";
    let cancelled = false;
    const token = getCyberneticToken();
    if (!token) {
      setChecking(false);
      return;
    }
    const timer = setTimeout(() => {
      if (!cancelled) setChecking(false);
    }, 4000);
    loadCyberneticAdmin()
      .then(() => {
        if (!cancelled) setAuthed(true);
      })
      .catch(() => {
        logoutCyberneticAdmin();
        if (!cancelled) setAuthed(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!authed) return;
    refresh();
  }, [authed]);

  const refresh = async () => {
    const rows = await fetchCompanies({ all: true });
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
      org_group: company.org_group || "",
      logo_url: company.logo_url || "",
      theme_primary: company.theme_primary || "#0B4F5C",
      theme_secondary: company.theme_secondary || "#0D9488",
      theme_accent: company.theme_accent || "#FF6B4A",
      late_attendance_policy_enabled: !!company.late_attendance_policy_enabled,
      portal_active: !!company.portal_active,
      attendance_process: company.attendance_process || "spm_standard",
      ot_hour_calculation: company.process_config?.ot_hour_calculation || "current",
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
        logo_url: googleDriveLogoUrl(form.logo_url),
        attendance_process: form.attendance_process || "spm_standard",
        process_config: {
          attendance_process: form.attendance_process || "spm_standard",
          ot_hour_calculation: form.ot_hour_calculation || "current",
        },
      };
      let saved;
      if (editingId) {
        saved = await updateCompany(editingId, payload);
      } else {
        saved = await createCompany(payload);
      }
      if (saved?.id && logoFile) {
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

  const setActivePortal = async (company) => {
    try {
      await activateCompanyPortal(company.id);
      Swal.fire({
        icon: "success",
        title: `${company.name} is now the active login brand`,
        timer: 1600,
        showConfirmButton: false,
      });
      await refresh();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not activate",
        text: error?.response?.data?.message || "Try again.",
      });
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
                  <th className="py-2 pr-3">Org group</th>
                  <th className="py-2 pr-3">Login brand</th>
                  <th className="py-2 pr-3">Late policy</th>
                  <th className="py-2 pr-3">Payroll process</th>
                  <th className="py-2 pr-3">OT hours</th>
                  <th className="py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-b last:border-0">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        {company.logo_url ? (
                          <img src={company.logo_url} alt="" referrerPolicy="no-referrer" className="h-8 w-8 object-contain" />
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
                    <td className="py-3 pr-3 font-mono text-xs text-slate-700">
                      {company.org_group || "—"}
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      {company.portal_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActivePortal(company)}
                          className="rounded-full border border-slate-200 px-2 py-0.5 font-medium text-slate-600 hover:border-teal-500 hover:text-teal-800"
                        >
                          Set active
                        </button>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      {company.late_attendance_policy_enabled ? (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 font-semibold text-teal-800">On</span>
                      ) : (
                        <span className="text-slate-400">Off</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      {company.attendance_process === "shift_roster" ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-900">Shift &amp; roster</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">SPM current</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      {company.process_config?.ot_hour_calculation === "minute_band" ? (
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-900">Minute band</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">Current</span>
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
          <label className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={!!form.portal_active}
              onChange={(e) => setForm({ ...form, portal_active: e.target.checked })}
            />
            <span>
              <span className="font-semibold text-emerald-900">Active login brand</span>
              <span className="block text-xs text-emerald-800">
                Login page uses this company&apos;s logo and theme colours. Only one company can be active.
              </span>
            </span>
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

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Settings2 className="h-4 w-4" />
              Company process configuration
            </div>
            <p className="text-xs text-slate-600">
              Attendance, OT, late, NoPay, working hours and salary for this company follow the option you select. More packs can be added later without changing other tenants.
            </p>
            <div className="space-y-2">
              {PROCESS_OPTIONS.map((option) => {
                const selected = (form.attendance_process || "spm_standard") === option.key;
                return (
                  <label
                    key={option.key}
                    className={`flex items-start gap-2 rounded-lg border p-3 text-sm cursor-pointer ${
                      selected ? "border-teal-500 bg-white" : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      className="mt-1"
                      name="attendance_process"
                      value={option.key}
                      checked={selected}
                      onChange={() => setForm({ ...form, attendance_process: option.key })}
                    />
                    <span>
                      <span className="font-semibold text-slate-900">{option.label}</span>
                      <span className="block text-xs text-slate-600 mt-0.5">{option.summary}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500 pt-2">OT hour calculation</p>
            <p className="text-xs text-slate-600">
              Separate from attendance process. Current OT stays as it is unless you pick minute-band rounding for this company.
            </p>
            <div className="space-y-2">
              {OT_HOUR_OPTIONS.map((option) => {
                const selected = (form.ot_hour_calculation || "current") === option.key;
                return (
                  <label
                    key={option.key}
                    className={`flex items-start gap-2 rounded-lg border p-3 text-sm cursor-pointer ${
                      selected ? "border-teal-500 bg-white" : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      className="mt-1"
                      name="ot_hour_calculation"
                      value={option.key}
                      checked={selected}
                      onChange={() => setForm({ ...form, ot_hour_calculation: option.key })}
                    />
                    <span>
                      <span className="font-semibold text-slate-900">{option.label}</span>
                      <span className="block text-xs text-slate-600 mt-0.5">{option.summary}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="pt-1">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">Coming soon</p>
              <div className="space-y-2">
                {FUTURE_CONFIGS.map((option) => (
                  <label
                    key={option.key}
                    className="flex items-start gap-2 rounded-lg border border-dashed border-slate-200 bg-white/70 p-3 text-sm opacity-70"
                  >
                    <input type="checkbox" className="mt-1" disabled />
                    <span>
                      <span className="font-semibold text-slate-700">{option.label}</span>
                      <span className="block text-xs text-slate-500 mt-0.5">{option.summary}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

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
            Organization group
            <input
              value={form.org_group}
              onChange={(e) => setForm({ ...form, org_group: e.target.value.toLowerCase() })}
              className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm"
              placeholder="spm"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Companies with the same group appear together in HR. Use <code>spm</code> for SPM-C and SPM Tax. Use a different group (e.g. <code>bsky</code>) so Blue Sky never shows on the SPM login.
            </span>
          </label>
          <label className="block text-sm">
            Google Drive logo link
            <input
              type="text"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              onBlur={() =>
                setForm((prev) => ({ ...prev, logo_url: googleDriveLogoUrl(prev.logo_url) }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="Paste Drive share link (Anyone with the link)"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Pick a file to upload to Firebase Storage, or paste a Drive/https link.
              {form.logo_url ? (
                <>
                  {" "}
                  ·{" "}
                  <a href={form.logo_url} target="_blank" rel="noreferrer" className="text-teal-700 underline">
                    preview
                  </a>
                </>
              ) : null}
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <Upload className="h-4 w-4" />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                setLogoFile(file || null);
                if (!file) return;
                const theme = await extractThemeFromImageFile(file);
                applyThemeToDocument(theme);
                setForm((prev) => ({
                  ...prev,
                  theme_primary: theme.primary,
                  theme_secondary: theme.secondary,
                  theme_accent: theme.accent,
                }));
                if (await isFirebaseConfigured()) {
                  setUploadingLogo(true);
                  try {
                    const url = await uploadToFirebase(file, "hr/company-logos");
                    setForm((prev) => ({ ...prev, logo_url: url }));
                    setLogoFile(null);
                  } catch (err) {
                    Swal.fire({
                      icon: "error",
                      title: "Firebase upload failed",
                      text: err?.response?.data?.message || err?.message || "Logo will be saved on the server instead.",
                    });
                  } finally {
                    setUploadingLogo(false);
                  }
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
            disabled={saving || uploadingLogo}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving || uploadingLogo ? "Saving…" : "Save company"}
          </button>
        </form>
      </main>
    </div>
  );
}
