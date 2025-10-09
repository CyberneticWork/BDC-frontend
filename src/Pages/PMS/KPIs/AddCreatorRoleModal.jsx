import React, { useState, useEffect } from "react";
import { X, Loader2, Edit2, Trash2, Save } from "lucide-react";
import Swal from "sweetalert2";
import PMSService from "@services/PMS/PMSService";

const makeTempId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

const normalizeRole = (r) => {
  if (!r) return null;
  const copy = { ...r };
  if (!copy.id && !copy._tempId) copy._tempId = makeTempId();
  return copy;
};

const dedupeRoles = (list = []) => {
  const map = new Map();
  for (const r of list) {
    const key = r?.id ?? r?._tempId ?? r?.role_name ?? JSON.stringify(r);
    if (!map.has(key)) map.set(key, normalizeRole(r));
  }
  return Array.from(map.values());
};

const AddCreatorRoleModal = ({ isOpen, onClose, onCreated }) => {
  const [roleName, setRoleName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [roles, setRoles] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setRoleName("");
      setIsSubmitting(false);
      fetchRoles();
    }
  }, [isOpen]);

  const fetchRoles = async () => {
    setIsLoadingList(true);
    try {
      const data = await PMSService.getCreatorRoles(); // [`PMSService.getCreatorRoles`](d:/office/hr_system_frontend/src/services/PMS/PMSService.js)
      const list = Array.isArray(data) ? data : (data?.data || []);
      setRoles(dedupeRoles(list.map(normalizeRole)));
    } catch (err) {
      console.error("Failed to fetch creator roles:", err);
      setRoles([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleCreate = async () => {
    if (!roleName.trim()) {
      await Swal.fire({ icon: "warning", title: "Role name required", text: "Please enter a role name." });
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await PMSService.createCreatorRole({ role_name: roleName.trim() }); // [`PMSService.createCreatorRole`](d:/office/hr_system_frontend/src/services/PMS/PMSService.js)
      const normalized = normalizeRole(created || { role_name: roleName.trim() });
      setRoles(prev => dedupeRoles([normalized, ...(prev || [])]));
      if (onCreated) onCreated(normalized);
      await Swal.fire({ icon: "success", title: "Created", text: "Creator role added.", timer: 1200, showConfirmButton: false });
      setRoleName("");
      onClose && onClose();
    } catch (err) {
      console.error("Failed to create creator role:", err);
      const message = err?.response?.data?.message || err?.response?.data?.error || "Failed to create role";
      await Swal.fire({ icon: "error", title: "Error", text: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (r) => {
    setEditingId(r.id ?? r._tempId);
    setEditingName(r.role_name || r.name || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async (idKey) => {
    if (!editingName.trim()) {
      await Swal.fire({ icon: "warning", title: "Role name required" });
      return;
    }
    setBusyId(idKey);
    try {
      const target = roles.find(r => (r.id ?? r._tempId) === idKey);
      if (!target) throw new Error("Role not found");
      if (target.id) {
        const updated = await PMSService.updateCreatorRole(target.id, { role_name: editingName.trim() }); // [`PMSService.updateCreatorRole`](d:/office/hr_system_frontend/src/services/PMS/PMSService.js)
        const normalized = normalizeRole(updated);
        setRoles(prev => dedupeRoles(prev.map(r => ((r.id ?? r._tempId) === idKey ? normalized : r))));
        if (onCreated) onCreated(normalized);
      } else {
        setRoles(prev => dedupeRoles(prev.map(r => ((r.id ?? r._tempId) === idKey ? { ...r, role_name: editingName.trim() } : r))));
      }
      await Swal.fire({ icon: "success", title: "Saved", timer: 900, showConfirmButton: false });
      cancelEdit();
    } catch (err) {
      console.error("Failed to update creator role:", err);
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
      if (serverMsg) {
        await Swal.fire({ icon: "error", title: "Error", text: serverMsg });
      } else if (err?.response?.status === 422 && err.response.data?.errors) {
        const first = Object.values(err.response.data.errors)[0]?.[0] || 'Validation failed';
        await Swal.fire({ icon: "error", title: "Validation Error", text: first });
      } else {
        await Swal.fire({ icon: "error", title: "Error", text: "Failed to update creator role." });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (idKey, name) => {
    const res = await Swal.fire({
      title: `Delete "${name}"?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });
    if (!res.isConfirmed) return;

    setBusyId(idKey);
    try {
      const target = roles.find(r => (r.id ?? r._tempId) === idKey);
      if (!target) throw new Error("Role not found");
      if (target.id) {
        await PMSService.deleteCreatorRole(target.id); // [`PMSService.deleteCreatorRole`](d:/office/hr_system_frontend/src/services/PMS/PMSService.js)
        setRoles(prev => prev.filter(r => (r.id ?? r._tempId) !== idKey));
      } else {
        setRoles(prev => prev.filter(r => (r.id ?? r._tempId) !== idKey));
      }
      await Swal.fire({ icon: "success", title: "Deleted", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error("Failed to delete creator role:", err);
      await Swal.fire({ icon: "error", title: "Error", text: "Failed to delete creator role." });
    } finally {
      setBusyId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Creator Roles</h2>
            <p className="text-sm text-gray-600 mt-1">Create, edit or remove creator roles</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Team Lead"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                aria-label="New creator role name"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg text-white ${isSubmitting ? "bg-gray-300" : "bg-indigo-600 hover:bg-indigo-700"}`}
              >
                {isSubmitting ? (<><Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />Creating...</>) : "Create"}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Existing Roles</h3>
            <div className="bg-gray-50 rounded-lg border border-gray-100 max-h-64 overflow-y-auto p-3 space-y-2">
              {isLoadingList ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                </div>
              ) : roles.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-6">No roles found</div>
              ) : roles.map((r, idx) => {
                const key = r.id ? `id-${r.id}` : `tmp-${r._tempId || idx}`;
                return (
                  <div key={key} className="flex items-center justify-between gap-3 bg-white p-2 rounded-md border">
                    <div className="flex-1 min-w-0">
                      {editingId === (r.id ?? r._tempId) ? (
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="text-sm font-medium truncate">{r.role_name || r.name}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {editingId === (r.id ?? r._tempId) ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(r.id ?? r._tempId)}
                            disabled={busyId === (r.id ?? r._tempId)}
                            className="px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                            title="Save"
                          >
                            {busyId === (r.id ?? r._tempId) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                            title="Cancel"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(r)}
                            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id ?? r._tempId, r.role_name || r.name)}
                            disabled={busyId === (r.id ?? r._tempId)}
                            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                            title="Delete"
                          >
                            {busyId === (r.id ?? r._tempId) ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4 text-red-600" />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCreatorRoleModal;