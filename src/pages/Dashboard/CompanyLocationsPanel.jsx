import React, { useCallback, useEffect, useState } from "react";
import { Edit2, MapPin, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { createLocation, deleteLocation, fetchLocations, updateLocation } from "../../services/ApiDataService";

const emptyForm = { company_id: "", name: "", address: "" };

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const errorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const CompanyLocationsPanel = ({ companies, search = "", showAdd, onCloseAdd }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const modalOpen = showAdd || !!editing;

  const companyIds = new Set(companies.map((c) => String(c.id)));

  const load = useCallback(async () => {
    setLoading(true);
    setLocations(await fetchLocations());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (showAdd) {
      setForm({ ...emptyForm, company_id: companies.length === 1 ? String(companies[0].id) : "" });
    }
  }, [showAdd, companies]);

  const closeModal = () => {
    setEditing(null);
    setForm(emptyForm);
    onCloseAdd();
  };

  const startEdit = (location) => {
    setEditing(location);
    setForm({ company_id: String(location.company_id), name: location.name, address: location.address || "" });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.company_id || !form.name.trim()) {
      Swal.fire({ icon: "error", title: "Missing details", text: "Choose a company and enter a location name." });
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), address: form.address.trim() || null };
      if (editing) {
        await updateLocation(editing.id, payload);
      } else {
        await createLocation({ ...payload, company_id: Number(form.company_id) });
      }
      closeModal();
      await load();
      Swal.fire({ icon: "success", title: editing ? "Location updated" : "Location added", timer: 1400, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Could not save location", text: errorMessage(err, "Please try again.") });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (location) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: `Delete ${location.name}?`,
      text: "Employees must be moved to another location first.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (!confirm.isConfirmed) return;
    try {
      await deleteLocation(location.id);
      await load();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Could not delete location", text: errorMessage(err, "Please try again.") });
    }
  };

  const term = search.toLowerCase().trim();
  const visible = locations
    .filter((l) => companyIds.has(String(l.company_id)))
    .filter(
      (l) =>
        !term ||
        [l.name, l.address, l.company_name].some((v) => String(v || "").toLowerCase().includes(term))
    );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-6 py-3">Location</th>
            <th className="px-6 py-3">Company</th>
            <th className="px-6 py-3">Address</th>
            <th className="px-6 py-3">Active employees</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading locations…</td>
            </tr>
          )}
          {!loading && visible.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                No locations yet. Use Add Location to create one under a company.
              </td>
            </tr>
          )}
          {!loading &&
            visible.map((location) => (
              <tr key={location.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    {location.name}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-700">{location.company_name}</td>
                <td className="px-6 py-3 text-gray-600">{location.address || "—"}</td>
                <td className="px-6 py-3 text-gray-700">{location.employee_count ?? 0}</td>
                <td className="px-6 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => startEdit(location)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit location"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(location)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete location"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={save} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{editing ? "Edit Location" : "Add Location"}</h3>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Company <span className="text-red-500">*</span>
              </label>
              <select
                className={inputClass}
                value={form.company_id}
                disabled={!!editing}
                onChange={(e) => setForm({ ...form, company_id: e.target.value })}
              >
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Location name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. Colombo Head Office"
                maxLength={191}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                className={inputClass}
                maxLength={255}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CompanyLocationsPanel;
