import React, { useState, useEffect } from "react";
import { X, Loader2, Edit2, Trash2, Save } from "lucide-react";
import Swal from "sweetalert2";
import PMSService from "@services/PMS/PMSService";

const makeTempId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

const normalizeWeight = (w) => {
  if (!w) return null;
  const copy = { ...w };
  if (!copy.id && !copy._tempId) copy._tempId = makeTempId();
  return copy;
};

const dedupeWeights = (list = []) => {
  const map = new Map();
  for (const w of list) {
    const key = w?.id ?? w?._tempId ?? w?.name ?? JSON.stringify(w);
    if (!map.has(key)) map.set(key, normalizeWeight(w));
  }
  return Array.from(map.values());
};

const AddKpiWeightModal = ({ isOpen, onClose, onCreated }) => {
  const [weightName, setWeightName] = useState("");
  const [weightDescription, setWeightDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [weights, setWeights] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setWeightName("");
      setWeightDescription("");
      setIsSubmitting(false);
      fetchWeights();
    }
  }, [isOpen]);

  const fetchWeights = async () => {
    setIsLoadingList(true);
    try {
      const data = await PMSService.getKpiWeights();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setWeights(dedupeWeights(list.map(normalizeWeight)));
    } catch (err) {
      console.error("Failed to fetch KPI weights:", err);
      setWeights([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleCreate = async () => {
    if (!weightName.trim()) {
      await Swal.fire({ icon: "warning", title: "Weight name required", text: "Please enter a weight name." });
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await PMSService.createKpiWeight({ 
        name: weightName.trim(),
        description: weightDescription.trim()
      });
      
      const normalized = normalizeWeight(created || { 
        name: weightName.trim(),
        description: weightDescription.trim()
      });
      
      setWeights(prev => dedupeWeights([normalized, ...(prev || [])]));
      if (onCreated) onCreated(normalized);
      await Swal.fire({ icon: "success", title: "Created", text: "Weight criteria added.", timer: 1200, showConfirmButton: false });
      setWeightName("");
      setWeightDescription("");
    } catch (err) {
      console.error("Failed to create weight:", err);
      const message = err?.response?.data?.message || err?.response?.data?.error || "Failed to create weight";
      await Swal.fire({ icon: "error", title: "Error", text: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (w) => {
    setEditingId(w.id ?? w._tempId);
    setEditingName(w.name || "");
    setEditingDescription(w.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingDescription("");
  };

  const saveEdit = async (idKey) => {
    if (!editingName.trim()) {
      await Swal.fire({ icon: "warning", title: "Weight name required" });
      return;
    }
    setBusyId(idKey);
    try {
      const target = weights.find(w => (w.id ?? w._tempId) === idKey);
      if (!target) throw new Error("Weight not found");
      
      if (target.id) {
        const updated = await PMSService.updateKpiWeight(target.id, { 
          name: editingName.trim(),
          description: editingDescription.trim() 
        });
        const normalized = normalizeWeight(updated);
        setWeights(prev => dedupeWeights(prev.map(w => ((w.id ?? w._tempId) === idKey ? normalized : w))));
        if (onCreated) onCreated(normalized);
      } else {
        setWeights(prev => dedupeWeights(prev.map(w => ((w.id ?? w._tempId) === idKey ? { 
          ...w, 
          name: editingName.trim(),
          description: editingDescription.trim() 
        } : w))));
      }
      await Swal.fire({ icon: "success", title: "Saved", timer: 900, showConfirmButton: false });
      cancelEdit();
    } catch (err) {
      console.error("Failed to update weight:", err);
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
      
      if (serverMsg) {
        await Swal.fire({ icon: "error", title: "Error", text: serverMsg });
      } else if (err?.response?.status === 422 && err.response.data?.errors) {
        const first = Object.values(err.response.data.errors)[0]?.[0] || 'Validation failed';
        await Swal.fire({ icon: "error", title: "Validation Error", text: first });
      } else {
        await Swal.fire({ icon: "error", title: "Error", text: "Failed to update weight." });
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
      const target = weights.find(w => (w.id ?? w._tempId) === idKey);
      if (!target) throw new Error("Weight not found");
      if (target.id) {
        await PMSService.deleteKpiWeight(target.id);
        setWeights(prev => prev.filter(w => (w.id ?? w._tempId) !== idKey));
      } else {
        setWeights(prev => prev.filter(w => (w.id ?? w._tempId) !== idKey));
      }
      await Swal.fire({ icon: "success", title: "Deleted", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error("Failed to delete weight:", err);
      await Swal.fire({ icon: "error", title: "Error", text: "Failed to delete weight." });
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
            <h2 className="text-lg font-semibold text-gray-900">Performance Criteria Weights</h2>
            <p className="text-sm text-gray-600 mt-1">Create, edit or remove KPI weight criteria</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight Name</label>
            <div className="flex gap-3 mb-2">
              <input
                type="text"
                value={weightName}
                onChange={(e) => setWeightName(e.target.value)}
                placeholder="e.g. Teamwork and Communication"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                aria-label="New weight name"
              />
            </div>
            
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <div className="flex gap-3">
              <textarea
                value={weightDescription}
                onChange={(e) => setWeightDescription(e.target.value)}
                placeholder="e.g. Measures ability to work effectively with team members"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
            </div>
            
            <div className="mt-3">
              <button
                type="button"
                onClick={handleCreate}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg text-white ${isSubmitting ? "bg-gray-300" : "bg-indigo-600 hover:bg-indigo-700"}`}
              >
                {isSubmitting ? (<><Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />Creating...</>) : "Add Weight"}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Existing Weights</h3>
            <div className="bg-gray-50 rounded-lg border border-gray-100 max-h-64 overflow-y-auto p-3 space-y-2">
              {isLoadingList ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                </div>
              ) : weights.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-6">No weights found</div>
              ) : weights.map((w, idx) => {
                const key = w.id ? `id-${w.id}` : `tmp-${w._tempId || idx}`;
                return (
                  <div key={key} className="flex items-start gap-3 bg-white p-3 rounded-md border">
                    <div className="flex-1 min-w-0">
                      {editingId === (w.id ?? w._tempId) ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                          <textarea
                            value={editingDescription}
                            onChange={(e) => setEditingDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            rows={2}
                            placeholder="Description (optional)"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-medium">{w.name}</div>
                          {w.description && (
                            <div className="text-xs text-gray-500 mt-1">{w.description}</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start">
                      {editingId === (w.id ?? w._tempId) ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(w.id ?? w._tempId)}
                            disabled={busyId === (w.id ?? w._tempId)}
                            className="px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                            title="Save"
                          >
                            {busyId === (w.id ?? w._tempId) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
                            onClick={() => startEdit(w)}
                            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(w.id ?? w._tempId, w.name)}
                            disabled={busyId === (w.id ?? w._tempId)}
                            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                            title="Delete"
                          >
                            {busyId === (w.id ?? w._tempId) ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4 text-red-600" />}
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

export default AddKpiWeightModal;