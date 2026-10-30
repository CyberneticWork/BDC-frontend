import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import zktecoService from "@services/zktecoService";

const emptyForm = {
  name: "Test Beats Tech 2",
  model: "SenseFP M2",
  serial_number: "FQQ2254700019",
  connection_mode: "liveu",
  api_key: "",
  ip_address: "",
  port: 443,
  company_id: "",
  is_active: true,
  adms_enabled: true,
};

const toDateInput = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function ZktecoDevicePanel({ companies = [] }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expanded, setExpanded] = useState(false);

  const loadDevices = async () => {
    setLoading(true);
    try {
      setDevices(await zktecoService.listDevices());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded) loadDevices();
  }, [expanded]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.serial_number) {
      Swal.fire({ icon: "warning", title: "Missing fields", text: "Name and Serial Number (SN) are required." });
      return;
    }
    if (form.connection_mode === "liveu" && !form.api_key.trim()) {
      Swal.fire({
        icon: "warning",
        title: "API key required",
        text: "Paste the LiveU Branch API key (x-api-key) from Live U. Example reference key was provided for Test Beats Tech 2.",
      });
      return;
    }

    try {
      const res = await zktecoService.createDevice({
        ...form,
        company_id: form.company_id || null,
        port: Number(form.port) || (form.connection_mode === "liveu" ? 443 : 4370),
        ip_address: form.ip_address || null,
        api_key: form.api_key || undefined,
      });
      Swal.fire({
        icon: "success",
        title: "Device added",
        html: `<p class="text-sm">${res.message || "Saved"}</p>
          ${
            res.data?.connection_mode === "liveu"
              ? `<p class="text-xs mt-2">Mode: LiveU · SN <code>${res.data.serial_number}</code></p>`
              : `<p class="text-xs mt-2 break-all">ADMS URL:<br/><code>${res.data?.adms_url || ""}</code></p>`
          }`,
      });
      setForm({ ...emptyForm, api_key: "" });
      setShowForm(false);
      loadDevices();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Save failed", text: err.response?.data?.message || err.message });
    }
  };

  const removeDevice = async (id) => {
    const ok = await Swal.fire({
      icon: "warning",
      title: "Remove device?",
      text: "Punches already imported stay on the Time Card.",
      showCancelButton: true,
      confirmButtonText: "Remove",
      confirmButtonColor: "#e11d48",
    });
    if (!ok.isConfirmed) return;
    try {
      await zktecoService.deleteDevice(id);
      loadDevices();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Remove failed", text: err.response?.data?.message || err.message });
    }
  };

  const runTest = async (id) => {
    try {
      const res = await zktecoService.testConnection(id);
      Swal.fire({ icon: "success", title: "Test OK", text: res.message || "Connected" });
      loadDevices();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Test failed",
        text: err.response?.data?.message || err.message,
      });
      loadDevices();
    }
  };

  const syncWithRange = async (deviceId) => {
    const today = toDateInput(new Date());
    const weekAgo = toDateInput(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const result = await Swal.fire({
      title: "Sync LiveU attendance",
      width: 440,
      html: `
        <div class="text-left space-y-3 px-1 text-sm">
          <p class="text-slate-600">Pull SenseFP / LiveU punches into Time Card for this date range.</p>
          <label class="block text-xs font-semibold">From</label>
          <input id="zk-from" type="date" class="swal2-input m-0 w-full" value="${weekAgo}" max="${today}" />
          <label class="block text-xs font-semibold">To</label>
          <input id="zk-to" type="date" class="swal2-input m-0 w-full" value="${today}" max="${today}" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Sync Now",
      preConfirm: () => {
        const from_date = document.getElementById("zk-from")?.value;
        const to_date = document.getElementById("zk-to")?.value;
        if (!from_date || !to_date || from_date > to_date) {
          Swal.showValidationMessage("Pick a valid From / To range");
          return false;
        }
        return { from_date, to_date };
      },
    });
    if (!result.isConfirmed || !result.value) return;

    try {
      const res = await zktecoService.syncNow(deviceId, result.value);
      Swal.fire({
        icon: "success",
        title: "Sync",
        text: res?.message || `Imported ${res?.data?.imported ?? 0}, skipped ${res?.data?.skipped ?? 0}`,
      });
      loadDevices();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Sync failed", text: err.response?.data?.message || err.message });
      loadDevices();
    }
  };

  const showLogs = async (id) => {
    try {
      const logs = await zktecoService.getEventLogs(id, 30);
      if (!logs.length) {
        Swal.fire({ icon: "info", title: "No events yet", text: "For LiveU: click Sync Now. For ADMS: wait for handshake then scan." });
        return;
      }
      Swal.fire({
        icon: "info",
        title: "Recent punches",
        width: 720,
        html: `<div class="text-left text-xs max-h-80 overflow-auto">
          <table class="w-full border-collapse">
            <thead><tr class="bg-slate-100">
              <th class="p-1 text-left">Time</th><th class="p-1 text-left">Emp</th>
              <th class="p-1 text-left">Src</th><th class="p-1 text-left">Status</th><th class="p-1 text-left">Msg</th>
            </tr></thead>
            <tbody>${logs
              .map(
                (l) => `<tr class="border-t">
              <td class="p-1">${l.event_time || ""}</td>
              <td class="p-1">${l.employee_no || ""}</td>
              <td class="p-1">${l.source || ""}</td>
              <td class="p-1">${l.status}</td>
              <td class="p-1">${(l.message || "").toString().slice(0, 60)}</td>
            </tr>`
              )
              .join("")}</tbody>
          </table>
        </div>`,
      });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Logs failed", text: err.response?.data?.message || err.message });
    }
  };

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      Swal.fire({ icon: "success", title: `${label} copied`, timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "info", title: label, text: text });
    }
  };

  return (
    <div className="mb-6 border border-teal-200 rounded-xl overflow-hidden bg-teal-50/40">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-teal-700 text-white font-semibold"
        onClick={() => setExpanded((v) => !v)}
      >
        <span>ZKTeco / LiveU Fingerprint Sync (SenseFP M2 · K40 Pro)</span>
        <span>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-600">
            <b>SenseFP M2</b> (Live U cloud): punches come from{" "}
            <code className="text-xs">attapi.liveucloud.com</code> with your Branch API key — use{" "}
            <b>Test</b> then <b>Sync Now</b>. <b>K40 Pro</b> (ADMS): device pushes to the ADMS URL. Device{" "}
            <b>User ID / memberId</b> must match <strong>Attendance Employee No</strong>.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-3 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? "Cancel" : "Add Device"}
            </button>
            <button
              type="button"
              className="px-3 py-2 bg-slate-200 text-slate-800 rounded-lg text-sm font-medium"
              onClick={loadDevices}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              className="px-3 py-2 bg-amber-100 text-amber-900 rounded-lg text-sm font-medium"
              onClick={async () => {
                try {
                  const g = await zktecoService.getSetupGuide();
                  Swal.fire({
                    icon: "info",
                    title: "ZKTeco / LiveU setup",
                    width: 640,
                    html: `<ol class="text-left text-sm list-decimal pl-5 space-y-2">${(g.steps || [])
                      .map((s) => `<li><b>${s.title}</b><br/>${s.detail}</li>`)
                      .join("")}</ol>`,
                  });
                } catch (e) {
                  Swal.fire({ icon: "error", title: "Failed", text: e.message });
                }
              }}
            >
              Setup Guide
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-white rounded-lg border">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Connection</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.connection_mode}
                  onChange={(e) => {
                    const connection_mode = e.target.value;
                    setForm({
                      ...form,
                      connection_mode,
                      model: connection_mode === "liveu" ? "SenseFP M2" : "K40 Pro",
                      port: connection_mode === "liveu" ? 443 : 4370,
                    });
                  }}
                >
                  <option value="liveu">LiveU cloud — SenseFP M2 (pull attendances)</option>
                  <option value="adms">ADMS push — K40 Pro (device → HR)</option>
                </select>
              </div>

              {[
                ["name", "Device / branch name", "text"],
                ["model", "Model", "text"],
                ["serial_number", "Serial Number (SN)", "text"],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                  <input
                    type={type}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required={key === "name" || key === "serial_number"}
                  />
                </div>
              ))}

              {form.connection_mode === "liveu" && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    LiveU Branch API key (x-api-key)
                  </label>
                  <input
                    type="password"
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                    placeholder="Paste key from Live U"
                    value={form.api_key}
                    onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                    required
                    autoComplete="off"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Reference device: SN FQQ2254700019 · Test Beats Tech 2. Key is stored encrypted — never committed to git.
                  </p>
                </div>
              )}

              {form.connection_mode === "adms" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">IP (optional)</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={form.ip_address}
                      onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Port</label>
                    <input
                      type="number"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={form.port}
                      onChange={(e) => setForm({ ...form, port: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.company_id}
                  onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                >
                  <option value="">All companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold">
                  Save Device
                </button>
              </div>
            </form>
          )}

          {loading && <p className="text-sm text-slate-500">Loading devices...</p>}
          {!loading && devices.length === 0 && (
            <p className="text-sm text-slate-500">
              No devices yet. For SenseFP M2 add LiveU mode with SN <code>FQQ2254700019</code> and your Branch API key.
            </p>
          )}

          {devices.map((d) => (
            <div key={d.id} className="p-4 bg-white border rounded-lg space-y-2">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-500">
                    {d.model} · SN {d.serial_number} · {d.connection_mode === "liveu" ? "LiveU cloud" : "ADMS"}
                    {d.has_api_key ? " · API key saved" : ""}
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      d.online ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {d.online ? "Recent sync/handshake" : "Waiting"}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${d.is_active ? "bg-teal-100 text-teal-800" : "bg-gray-100"}`}
                  >
                    {d.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="text-xs space-y-1">
                {d.connection_mode === "liveu" ? (
                  <p>
                    <span className="font-semibold text-slate-600">LiveU API:</span>{" "}
                    <code>{d.liveu_base || "https://attapi.liveucloud.com/api/v1"}</code>
                  </p>
                ) : (
                  <p>
                    <span className="font-semibold text-slate-600">ADMS URL:</span>
                    <button
                      type="button"
                      className="ml-2 text-teal-700 underline break-all"
                      onClick={() => copyText(d.adms_url, "ADMS URL")}
                    >
                      {d.adms_url}
                    </button>
                  </p>
                )}
                <p className="text-slate-500">
                  Last sync: {d.last_sync_at || "—"} · Last punch: {d.last_event_at || "—"}
                </p>
                {d.last_error && <p className="text-rose-600">{d.last_error}</p>}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button type="button" className="px-2 py-1 text-xs rounded bg-slate-100" onClick={() => runTest(d.id)}>
                  Test
                </button>
                {d.connection_mode === "liveu" && (
                  <button
                    type="button"
                    className="px-2 py-1 text-xs rounded bg-teal-700 text-white"
                    onClick={() => syncWithRange(d.id)}
                  >
                    Sync Now
                  </button>
                )}
                <button type="button" className="px-2 py-1 text-xs rounded bg-slate-100" onClick={() => showLogs(d.id)}>
                  Recent punches
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded bg-rose-50 text-rose-700"
                  onClick={() => removeDevice(d.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
