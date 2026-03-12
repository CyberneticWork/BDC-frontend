import React, { useState, useEffect } from "react";
import { X, Loader2, Edit2, Trash2, Save } from "lucide-react";
import Swal from "sweetalert2";
import PMSService from "@services/PMS/PMSService";

const makeTempId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

const normalizeTask = (t) => {
  // Ensure each task has either numeric id or a stable _tempId
  if (t == null) return null;
  const copy = { ...t };
  if (!copy.id && !copy._tempId) copy._tempId = makeTempId();
  return copy;
};

// Deduplicate by id/_tempId preserving order (new items first if specified)
const dedupeTasks = (list = []) => {
  const map = new Map();
  for (const t of list) {
    const key = t?.id ?? t?._tempId ?? (t.task_name ?? t.name ?? JSON.stringify(t));
    if (!map.has(key)) map.set(key, normalizeTask(t));
  }
  return Array.from(map.values());
};

const AddKpiTaskModal = ({ isOpen, onClose, onCreated }) => {
  const [taskName, setTaskName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // list states
  const [tasks, setTasks] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [busyId, setBusyId] = useState(null); // id being mutated

  useEffect(() => {
    if (isOpen) {
      setTaskName("");
      setIsSubmitting(false);
      fetchTasks();
    }
  }, [isOpen]);

  const fetchTasks = async () => {
    setIsLoadingList(true);
    try {
      const data = await PMSService.getKpiTasks();
      // backend might return { data: [...] } or [...]
      const list = Array.isArray(data) ? data : (data?.data || []);
      const normalized = list.map(normalizeTask);
      setTasks(dedupeTasks(normalized));
    } catch (err) {
      console.error("Failed to fetch KPI tasks:", err);
      setTasks([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleCreate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!taskName.trim()) {
      await Swal.fire({ icon: "warning", title: "Task name required", text: "Please enter a task name." });
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await PMSService.createKpiTask({ task_name: taskName.trim() });
      // If backend did not return id, assign a temp id
      const normalized = normalizeTask(created || { task_name: taskName.trim() });
      // Add to list (new first)
      setTasks(prev => dedupeTasks([normalized, ...(prev || [])]));
      if (onCreated) onCreated(normalized);
      await Swal.fire({ icon: "success", title: "Created", text: "KPI task created successfully.", timer: 1200, showConfirmButton: false });
      setTaskName("");
      if (onClose) onClose();
    } catch (err) {
      console.error("Failed to create KPI task:", err);
      const message = err?.response?.data?.message || "Failed to create KPI task.";
      await Swal.fire({ icon: "error", title: "Error", text: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (t) => {
    setEditingId(t.id ?? t._tempId);
    setEditingName(t.task_name ?? t.name ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async (idKey) => {
    if (!editingName.trim()) {
      await Swal.fire({ icon: "warning", title: "Task name required" });
      return;
    }
    setBusyId(idKey);
    try {
      // Try to find numeric id when possible
      const target = tasks.find(t => (t.id ?? t._tempId) === idKey);
      if (!target) throw new Error("Task not found");
      if (target.id) {
        const updated = await PMSService.updateKpiTask(target.id, { task_name: editingName.trim() });
        const normalized = normalizeTask(updated);
        setTasks(prev => dedupeTasks(prev.map(t => ((t.id ?? t._tempId) === idKey ? normalized : t))));
        if (onCreated) onCreated(normalized);
      } else {
        // local-only update for temp items (backend can't update)
        setTasks(prev => dedupeTasks(prev.map(t => ((t.id ?? t._tempId) === idKey ? { ...t, task_name: editingName.trim() } : t))));
      }
      await Swal.fire({ icon: "success", title: "Saved", timer: 900, showConfirmButton: false });
      cancelEdit();
    } catch (err) {
      console.error("Failed to update KPI task:", err);
      // improved error extraction: backend may return { message } or { error } or validation errors
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
      if (serverMsg) {
        await Swal.fire({ icon: "error", title: "Error", text: serverMsg });
      } else if (err?.response?.status === 422 && err.response.data?.errors) {
        const first = Object.values(err.response.data.errors)[0]?.[0] || 'Validation failed';
        await Swal.fire({ icon: "error", title: "Validation Error", text: first });
      } else {
        await Swal.fire({ icon: "error", title: "Error", text: "Failed to update KPI task. See console for details." });
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
      const target = tasks.find(t => (t.id ?? t._tempId) === idKey);
      if (!target) throw new Error("Task not found");
      if (target.id) {
        await PMSService.deleteKpiTask(target.id);
        setTasks(prev => prev.filter(t => (t.id ?? t._tempId) !== idKey));
      } else {
        // remove local-only temp item
        setTasks(prev => prev.filter(t => (t.id ?? t._tempId) !== idKey));
      }
      await Swal.fire({ icon: "success", title: "Deleted", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error("Failed to delete KPI task:", err);
      await Swal.fire({ icon: "error", title: "Error", text: "Failed to delete KPI task: Cannot delete this KPI task as it is currently assigned to employees" });
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
            <h2 className="text-lg font-semibold text-gray-900">Add KPI Task</h2>
            <p className="text-sm text-gray-600 mt-1">Create or manage KPI task names</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Add form */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="e.g. Quality of Work"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                aria-label="New KPI task name"
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

          {/* Existing tasks list */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Existing KPI Tasks</h3>
            <div className="bg-gray-50 rounded-lg border border-gray-100 max-h-64 overflow-y-auto p-3 space-y-2">
              {isLoadingList ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-6">No KPI tasks found</div>
              ) : tasks.map((t, idx) => {
                const key = t.id ? `id-${t.id}` : `tmp-${t._tempId || idx}`;
                return (
                  <div key={key} className="flex items-center justify-between gap-3 bg-white p-2 rounded-md border">
                    <div className="flex-1 min-w-0">
                      {editingId === (t.id ?? t._tempId) ? (
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="text-sm font-medium truncate">{t.task_name || t.name}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {editingId === (t.id ?? t._tempId) ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(t.id ?? t._tempId)}
                            disabled={busyId === (t.id ?? t._tempId)}
                            className="px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                            title="Save"
                          >
                            {busyId === (t.id ?? t._tempId) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
                            onClick={() => startEdit(t)}
                            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id ?? t._tempId, t.task_name || t.name)}
                            disabled={busyId === (t.id ?? t._tempId)}
                            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                            title="Delete"
                          >
                            {busyId === (t.id ?? t._tempId) ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4 text-red-600" />}
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

export default AddKpiTaskModal;