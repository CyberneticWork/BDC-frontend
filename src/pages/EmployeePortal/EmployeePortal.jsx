import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  DollarSign,
  Home,
  Key,
  LogOut,
  Wallet,
  Banknote,
  ArrowLeft,
} from "lucide-react";
import {
  changeMyPassword,
  getMyAdvances,
  getMyAttendance,
  getMyLeaves,
  getMyNopay,
  getMyOvertime,
  getMySalary,
  getPortalHome,
  submitAdvance,
  submitLeave,
} from "../../services/EmployeePortalService";
import { logout } from "../../services/AuthService";
import { clearUser, getUser } from "../../services/UserService";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const LEAVE_TYPES = [
  "Annual Leave",
  "Casual Leave",
  "Medical Leave",
  "No Pay Leave",
  "Short Leave",
];

const money = (v) =>
  `Rs. ${Number(v || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const statusClass = (s) => {
  const v = String(s || "").toUpperCase();
  if (v.includes("APPROV") || v === "ISSUED" || v === "PROCESSED")
    return "bg-emerald-100 text-emerald-800";
  if (v.includes("REJECT") || v.includes("CANCEL"))
    return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
};

export default function EmployeePortal() {
  const navigate = useNavigate();
  const user = getUser();
  const [view, setView] = useState("home");
  const [home, setHome] = useState(null);
  const [bootError, setBootError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [leaveHistory, setLeaveHistory] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [overtime, setOvertime] = useState([]);
  const [nopay, setNopay] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [slipRow, setSlipRow] = useState(null);

  const [leaveForm, setLeaveForm] = useState({
    leave_type: "Casual Leave",
    leave_from: "",
    leave_to: "",
    day_type: "FULL",
    reason: "",
  });
  const [advanceForm, setAdvanceForm] = useState({
    amount: "",
    needed_on: "",
    reason: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const initials = useMemo(() => {
    const n = home?.employee?.fullName || user?.name || "EP";
    return n
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }, [home, user]);

  const flash = (ok, text) => {
    setMessage(ok ? text : "");
    setError(ok ? "" : text);
    setTimeout(() => {
      setMessage("");
      setError("");
    }, 3500);
  };

  const loadHome = async () => {
    try {
      setLoading(true);
      setBootError("");
      const data = await getPortalHome({ month, year });
      setHome(data);
      setAdvances(data.advances || []);
    } catch (e) {
      setBootError(
        e?.response?.data?.message ||
          "Unable to load employee portal. Link an employee profile to this login."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadLeave = async () => {
    const data = await getMyLeaves();
    setLeaveHistory(data.items || []);
  };

  const loadAdvances = async () => {
    const data = await getMyAdvances();
    setAdvances(data.items || []);
  };

  const loadTime = async () => {
    const data = await getMyAttendance({ month, year });
    setAttendance(data.items || []);
  };

  const loadPay = async () => {
    const [ot, np, sal] = await Promise.all([
      getMyOvertime({ month, year }),
      getMyNopay({ month, year }),
      getMySalary(),
    ]);
    setOvertime(ot.items || []);
    setNopay(np.items || []);
    setSalaries(sal.items || []);
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/otp-login");
      return;
    }
    loadHome();
  }, []);

  useEffect(() => {
    if (view === "leave") loadLeave().catch(() => flash(false, "Failed to load leaves"));
    if (view === "advance") loadAdvances().catch(() => flash(false, "Failed to load advances"));
    if (view === "time") loadTime().catch(() => flash(false, "Failed to load attendance"));
    if (view === "pay") loadPay().catch(() => flash(false, "Failed to load pay data"));
  }, [view, month, year]);

  const open = (v) => setView(v);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      /* ignore */
    }
    clearUser();
    localStorage.removeItem("token");
    navigate("/otp-login");
  };

  const onSubmitLeave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await submitLeave(leaveForm);
      flash(true, "Leave request submitted");
      setLeaveForm({
        leave_type: "Casual Leave",
        leave_from: "",
        leave_to: "",
        day_type: "FULL",
        reason: "",
      });
      await loadLeave();
      await loadHome();
    } catch (err) {
      flash(false, err?.response?.data?.message || "Leave submit failed");
    } finally {
      setSaving(false);
    }
  };

  const onSubmitAdvance = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await submitAdvance({
        amount: Number(advanceForm.amount),
        needed_on: advanceForm.needed_on || null,
        reason: advanceForm.reason,
      });
      flash(true, "Advance request submitted");
      setAdvanceForm({ amount: "", needed_on: "", reason: "" });
      await loadAdvances();
      await loadHome();
    } catch (err) {
      flash(false, err?.response?.data?.message || "Advance submit failed");
    } finally {
      setSaving(false);
    }
  };

  const onSavePassword = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await changeMyPassword(passwordForm);
      flash(true, "Password updated");
      setPasswordForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
    } catch (err) {
      flash(false, err?.response?.data?.message || "Password update failed");
    } finally {
      setSaving(false);
    }
  };

  const navBtn = (id, label, Icon) => (
    <button
      key={id}
      type="button"
      onClick={() => open(id)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ${
        view === id
          ? "bg-teal-600 text-white shadow"
          : "text-slate-600 hover:bg-teal-50"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(165deg,#f3fbf9,#eef8ff 45%,#fff8f1)" }}>
      <header
        className="sticky top-0 z-20 text-white shadow-lg"
        style={{ background: "linear-gradient(135deg,#062A32,#0B4F5C 55%,#0D9488)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center font-display font-bold text-lg">
              {initials}
            </div>
            <div>
              <p className="text-teal-100 text-xs uppercase tracking-[0.16em]">Employee portal</p>
              <h1 className="font-display text-xl font-bold leading-tight">
                {home?.employee?.fullName || "My workplace"}
              </h1>
              <p className="text-teal-50/90 text-xs">
                {home?.employee?.employeeNo ? `#${home.employee.employeeNo}` : ""}
                {home?.employee?.department ? ` · ${home.employee.department}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-3 flex flex-wrap gap-2">
          {navBtn("home", "Home", Home)}
          {navBtn("leave", "Leave", Calendar)}
          {navBtn("advance", "Advance", Wallet)}
          {navBtn("time", "Attendance", Clock)}
          {navBtn("pay", "Pay", Banknote)}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {(message || error) && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
              message
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message || error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading portal…</div>
        ) : bootError ? (
          <div className="bg-white rounded-2xl border border-red-100 p-8 text-center shadow">
            <p className="text-red-700 font-semibold mb-2">Portal unavailable</p>
            <p className="text-slate-600 text-sm mb-4">{bootError}</p>
            <button
              type="button"
              onClick={() => navigate("/otp-login")}
              className="px-4 py-2 rounded-xl text-white font-semibold"
              style={{ background: "linear-gradient(135deg,#0D9488,#0B4F5C)" }}
            >
              Back to login
            </button>
          </div>
        ) : (
          <>
            {view === "home" && (
              <section className="space-y-5 anim-rise">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Attendance", value: home?.attendanceCount || 0, sub: "This month", go: "time" },
                    { label: "OT hours", value: home?.otHours || 0, sub: "This month", go: "pay" },
                    { label: "No pay", value: home?.nopayDays || 0, sub: "Days", go: "pay" },
                    {
                      label: "Last net",
                      value: money(home?.lastSalary?.netPay),
                      sub: "Processed salary",
                      go: "pay",
                    },
                  ].map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => open(s.go)}
                      className="text-left bg-white rounded-2xl p-4 border border-teal-50 shadow-[0_10px_30px_rgba(6,42,50,0.06)] hover:-translate-y-0.5 transition"
                    >
                      <p className="text-xs text-slate-500 font-semibold uppercase">{s.label}</p>
                      <p className="font-display text-2xl font-bold text-[var(--brand-ink)] mt-1">{s.value}</p>
                      <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
                    </button>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { title: "Request leave", text: "Submit and track your leave", go: "leave" },
                    { title: "Salary advance", text: "Request an advance for HR approval", go: "advance" },
                    { title: "My attendance", text: "View this month’s time cards", go: "time" },
                    { title: "Pay, OT & payslip", text: "View after salary is processed", go: "pay" },
                  ].map((a) => (
                    <button
                      key={a.title}
                      type="button"
                      onClick={() => open(a.go)}
                      className="text-left rounded-2xl p-5 text-white shadow-lg hover:opacity-95 transition"
                      style={{ background: "linear-gradient(135deg,#0D9488,#0B4F5C)" }}
                    >
                      <strong className="font-display text-lg block">{a.title}</strong>
                      <span className="text-teal-50 text-sm">{a.text}</span>
                    </button>
                  ))}
                </div>

                <form onSubmit={onSavePassword} className="bg-white rounded-2xl border border-teal-50 p-5 shadow space-y-3">
                  <h3 className="font-display font-bold text-[var(--brand-ink)] flex items-center gap-2">
                    <Key className="w-4 h-4 text-teal-600" /> Change my password
                  </h3>
                  <input
                    type="password"
                    placeholder="Current password"
                    className="w-full border border-teal-100 rounded-xl px-3 py-2.5"
                    value={passwordForm.current_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, current_password: e.target.value })
                    }
                    required
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    className="w-full border border-teal-100 rounded-xl px-3 py-2.5"
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, new_password: e.target.value })
                    }
                    required
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full border border-teal-100 rounded-xl px-3 py-2.5"
                    value={passwordForm.new_password_confirmation}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        new_password_confirmation: e.target.value,
                      })
                    }
                    required
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl text-white font-semibold disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#0D9488,#0B4F5C)" }}
                  >
                    Update password
                  </button>
                </form>
              </section>
            )}

            {view === "leave" && (
              <section className="space-y-5 anim-rise">
                <h2 className="font-display text-2xl font-bold text-[var(--brand-ink)]">Request leave</h2>
                <form onSubmit={onSubmitLeave} className="bg-white rounded-2xl border border-teal-50 p-5 shadow space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Leave type
                    <select
                      className="mt-1 w-full border border-teal-100 rounded-xl px-3 py-2.5"
                      value={leaveForm.leave_type}
                      onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                    >
                      {LEAVE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="block text-sm font-semibold text-slate-700">
                      From
                      <input
                        type="date"
                        className="mt-1 w-full border border-teal-100 rounded-xl px-3 py-2.5"
                        value={leaveForm.leave_from}
                        onChange={(e) => setLeaveForm({ ...leaveForm, leave_from: e.target.value })}
                        required
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      To
                      <input
                        type="date"
                        className="mt-1 w-full border border-teal-100 rounded-xl px-3 py-2.5"
                        value={leaveForm.leave_to}
                        onChange={(e) => setLeaveForm({ ...leaveForm, leave_to: e.target.value })}
                        required
                      />
                    </label>
                  </div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Day type
                    <select
                      className="mt-1 w-full border border-teal-100 rounded-xl px-3 py-2.5"
                      value={leaveForm.day_type}
                      onChange={(e) => setLeaveForm({ ...leaveForm, day_type: e.target.value })}
                    >
                      <option value="FULL">Full day</option>
                      <option value="HALF">Half day</option>
                      <option value="SHORT">Short leave</option>
                    </select>
                  </label>
                  {leaveForm.leave_from && leaveForm.leave_to && (
                    <div className="rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-sm text-slate-700">
                      Leave calculation:{" "}
                      {(() => {
                        const from = new Date(leaveForm.leave_from);
                        const to = new Date(leaveForm.leave_to);
                        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
                          return "select a valid date range";
                        }
                        const calendarDays = Math.ceil((to - from) / (1000 * 3600 * 24)) + 1;
                        const unit = leaveForm.day_type === "HALF" ? 0.5 : leaveForm.day_type === "SHORT" ? 0.25 : 1;
                        const total = Math.round(calendarDays * unit * 10000) / 10000;
                        const unitLabel = leaveForm.day_type === "HALF" ? "Half (0.5)" : leaveForm.day_type === "SHORT" ? "Short (0.25)" : "Full (1)";
                        return (
                          <>
                            {calendarDays} calendar day(s) × {unitLabel} = <b>{total}</b> day(s)
                          </>
                        );
                      })()}
                    </div>
                  )}
                  <label className="block text-sm font-semibold text-slate-700">
                    Reason
                    <textarea
                      rows={3}
                      className="mt-1 w-full border border-teal-100 rounded-xl px-3 py-2.5"
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl text-white font-semibold disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#0D9488,#0B4F5C)" }}
                  >
                    Submit leave request
                  </button>
                </form>

                <h3 className="font-display font-bold text-[var(--brand-ink)]">My requests</h3>
                <div className="space-y-2">
                  {leaveHistory.length === 0 && (
                    <p className="text-sm text-slate-500">No leave requests yet.</p>
                  )}
                  {leaveHistory.map((row) => (
                    <article
                      key={row.id}
                      className="bg-white rounded-xl border border-teal-50 px-4 py-3 flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div>
                        <strong className="text-[var(--brand-ink)]">{row.leave_type}</strong>
                        <p className="text-sm text-slate-500">
                          {row.leave_from || row.leave_date}
                          {row.leave_to ? ` – ${row.leave_to}` : ""} · {row.leave_duration || 1} day(s)
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {view === "advance" && (
              <section className="space-y-5 anim-rise">
                <h2 className="font-display text-2xl font-bold text-[var(--brand-ink)]">Salary advance</h2>
                <form onSubmit={onSubmitAdvance} className="bg-white rounded-2xl border border-teal-50 p-5 shadow space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Amount (LKR)
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      className="mt-1 w-full border border-teal-100 rounded-xl px-3 py-2.5"
                      value={advanceForm.amount}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                      required
                    />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Needed on
                    <input
                      type="date"
                      className="mt-1 w-full border border-teal-100 rounded-xl px-3 py-2.5"
                      value={advanceForm.needed_on}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, needed_on: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Reason
                    <textarea
                      rows={3}
                      className="mt-1 w-full border border-teal-100 rounded-xl px-3 py-2.5"
                      value={advanceForm.reason}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl text-white font-semibold disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#FF6B4A,#F5A524)" }}
                  >
                    Submit advance request
                  </button>
                </form>

                <h3 className="font-display font-bold text-[var(--brand-ink)]">My requests</h3>
                <div className="space-y-2">
                  {advances.length === 0 && (
                    <p className="text-sm text-slate-500">No advance requests yet.</p>
                  )}
                  {advances.map((row) => (
                    <article
                      key={row.id}
                      className="bg-white rounded-xl border border-teal-50 px-4 py-3 flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div>
                        <strong className="text-[var(--brand-ink)]">{money(row.amount)}</strong>
                        <p className="text-sm text-slate-500">{row.reason}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {view === "time" && (
              <section className="space-y-5 anim-rise">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-2xl font-bold text-[var(--brand-ink)]">My attendance</h2>
                  <div className="flex gap-2">
                    <select
                      className="border border-teal-100 rounded-xl px-3 py-2 text-sm"
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                    >
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="border border-teal-100 rounded-xl px-3 py-2 text-sm w-24"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                    />
                  </div>
                </div>
                <p className="text-sm text-slate-500">Attendance is view-only. Contact HR for corrections.</p>
                <div className="space-y-2">
                  {attendance.length === 0 && (
                    <p className="text-sm text-slate-500">No attendance for this month.</p>
                  )}
                  {attendance.map((row) => (
                    <article
                      key={row.id}
                      className="bg-white rounded-xl border border-teal-50 px-4 py-3 shadow-sm"
                    >
                      <strong className="text-[var(--brand-ink)]">{row.cardDate}</strong>
                      <p className="text-sm text-slate-500">
                        {row.clockTime || "—"} · {row.status || "Present"} · {row.workingHours || 0} hrs
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {view === "pay" && (
              <section className="space-y-5 anim-rise">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-2xl font-bold text-[var(--brand-ink)]">Pay & overtime</h2>
                  <div className="flex gap-2">
                    <select
                      className="border border-teal-100 rounded-xl px-3 py-2 text-sm"
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                    >
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="border border-teal-100 rounded-xl px-3 py-2 text-sm w-24"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                    />
                  </div>
                </div>
                <p className="text-sm text-slate-500">
                  OT, no-pay, salary, and pay slip are view only after HR processes salary.
                </p>

                <h3 className="font-display font-bold text-[var(--brand-ink)]">Processed salary</h3>
                <div className="space-y-2">
                  {salaries.length === 0 && (
                    <p className="text-sm text-slate-500">No processed salary yet.</p>
                  )}
                  {salaries.map((row) => (
                    <article
                      key={row.id}
                      className="bg-white rounded-xl border border-teal-50 px-4 py-3 flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div>
                        <strong className="text-[var(--brand-ink)]">
                          {MONTHS[(row.salaryMonth || 1) - 1]} {row.salaryYear}
                        </strong>
                        <p className="text-sm text-slate-500">
                          Gross {money(row.grossPay)} · Net {money(row.netPay)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-teal-700 font-semibold text-sm"
                        onClick={() => setSlipRow(row)}
                      >
                        Pay slip
                      </button>
                    </article>
                  ))}
                </div>

                {slipRow && (
                  <div className="bg-white rounded-2xl border border-teal-100 p-5 shadow">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-display font-bold">
                        Pay slip · {MONTHS[(slipRow.salaryMonth || 1) - 1]} {slipRow.salaryYear}
                      </h3>
                      <button type="button" className="text-sm text-slate-500" onClick={() => setSlipRow(null)}>
                        Close
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                      <p>Basic: {money(slipRow.breakdown?.basic_salary)}</p>
                      <p>Allowances: {money(slipRow.breakdown?.total_allowances)}</p>
                      <p>Deductions: {money(slipRow.breakdown?.total_deductions)}</p>
                      <p className="font-bold text-teal-800">Net: {money(slipRow.netPay)}</p>
                    </div>
                  </div>
                )}

                <h3 className="font-display font-bold text-[var(--brand-ink)]">Overtime</h3>
                <div className="space-y-2">
                  {overtime.length === 0 && (
                    <p className="text-sm text-slate-500">No OT this month.</p>
                  )}
                  {overtime.map((row) => (
                    <article
                      key={row.id}
                      className="bg-white rounded-xl border border-teal-50 px-4 py-3 flex justify-between shadow-sm"
                    >
                      <div>
                        <strong>{row.otDate}</strong>
                        <p className="text-sm text-slate-500">
                          {row.hours || 0} hrs · {money(row.amount)}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold h-fit ${statusClass(row.status)}`}>
                        {row.status || "POSTED"}
                      </span>
                    </article>
                  ))}
                </div>

                <h3 className="font-display font-bold text-[var(--brand-ink)]">No pay</h3>
                <div className="space-y-2">
                  {nopay.length === 0 && (
                    <p className="text-sm text-slate-500">No no-pay this month.</p>
                  )}
                  {nopay.map((row) => (
                    <article
                      key={row.id}
                      className="bg-white rounded-xl border border-teal-50 px-4 py-3 flex justify-between shadow-sm"
                    >
                      <div>
                        <strong>{row.nopayDate}</strong>
                        <p className="text-sm text-slate-500">
                          {row.nopayDays} day(s) · {row.type || "No pay"}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold h-fit ${statusClass(row.status)}`}>
                        {row.status || "—"}
                      </span>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
