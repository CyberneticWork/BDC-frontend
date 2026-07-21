import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import hikvisionService from "@services/hikvisionService";

const emptyForm = {
  name: "",
  model: "DS-K1T320MFWX",
  serial_number: "",
  ip_address: "",
  port: 80,
  username: "admin",
  password: "",
  company_id: "",
  is_active: true,
  webhook_enabled: true,
  polling_enabled: true,
};

export default function HikvisionDevicePanel({ companies = [] }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expanded, setExpanded] = useState(false);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const data = await hikvisionService.listDevices();
      setDevices(data);
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
    if (!form.name || !form.ip_address || !form.password) {
      Swal.fire({ icon: "warning", title: "Missing fields", text: "Name, IP and password are required." });
      return;
    }

    try {
      await hikvisionService.createDevice({
        ...form,
        company_id: form.company_id || null,
        port: Number(form.port) || 80,
      });
      Swal.fire({ icon: "success", title: "Device added", timer: 1500, showConfirmButton: false });
      setForm(emptyForm);
      setShowForm(false);
      loadDevices();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Save failed", text: err.response?.data?.message || err.message });
    }
  };

  const runAction = async (label, fn) => {
    try {
      const res = await fn();
      Swal.fire({ icon: "success", title: label, text: res.message || "Done" });
      loadDevices();
    } catch (err) {
      const data = err.response?.data;
      Swal.fire({
        icon: "error",
        title: label + " failed",
        html: `<p>${data?.message || err.message}</p>${data?.webhook_url ? `<p class="text-sm mt-2">Webhook URL:<br><code>${data.webhook_url}</code></p>` : ""}`,
      });
    }
  };

  return (
    <div className="mb-6 border border-indigo-200 rounded-xl overflow-hidden bg-indigo-50/40">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-indigo-600 text-white font-semibold"
        onClick={() => setExpanded((v) => !v)}
      >
        <span>Hikvision Fingerprint Device (DS-K1T320 / iVMS-4200)</span>
        <span>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-600">
            Real-time punches use the device webhook. Scheduled sync polls the device every few minutes.
            Employee IDs on the device must match <strong>Attendance Employee No</strong> in HR.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
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
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-white rounded-lg border">
              {[
                ["name", "Device name", "text"],
                ["model", "Model", "text"],
                ["serial_number", "Serial (GG4907842)", "text"],
                ["ip_address", "IP address", "text"],
                ["port", "Port", "number"],
                ["username", "Username", "text"],
                ["password", "Password", "password"],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                  <input
                    type={type}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.company_id}
                  onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                >
                  <option value="">All companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
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
            <p className="text-sm text-slate-500">No devices configured yet.</p>
          )}

          {devices.map((d) => (
            <div key={d.id} className="p-4 bg-white border rounded-lg space-y-2">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-500">{d.model} · {d.ip_address}:{d.port}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${d.is_active ? "bg-green-100 text-green-800" : "bg-gray-100"}`}>
                  {d.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="text-xs break-all text-slate-600">
                <span className="font-semibold">Webhook:</span> {d.webhook_url}
              </p>
              {d.last_sync_at && (
                <p className="text-xs text-slate-500">Last sync: {new Date(d.last_sync_at).toLocaleString()}</p>
              )}
              {d.last_error && (
                <p className="text-xs text-red-600">Last error: {d.last_error}</p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                  onClick={() => runAction("Connection OK", () => hikvisionService.testConnection(d.id))}
                >
                  Test
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded"
                  onClick={() => runAction("Sync completed", () => hikvisionService.syncNow(d.id))}
                >
                  Sync Now
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded"
                  onClick={() => runAction("Webhook configured", () => hikvisionService.configureWebhook(d.id))}
                >
                  Configure Webhook
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded"
                  onClick={async () => {
                    const ok = await Swal.fire({
                      icon: "warning",
                      title: "Remove device?",
                      showCancelButton: true,
                    });
                    if (ok.isConfirmed) {
                      await hikvisionService.deleteDevice(d.id);
                      loadDevices();
                    }
                  }}
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
