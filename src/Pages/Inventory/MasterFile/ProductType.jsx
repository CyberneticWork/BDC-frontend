import React, { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  getAllProductTypes,
  addProductType,
  updateProductType,
  deleteProductType,
  toggleProductTypeActive,
} from "../../../services/Inventory/productTypeService";

function ProductType() {
  const [types, setTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const initialForm = { name: "", description: "", isActive: true };
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // load product types from API and map backend fields to UI fields
    const load = async () => {
      try {
        const res = await getAllProductTypes();
        // res expected to be an array of product types with fields: id, type, description, status
        const mapped = (res || []).map((p) => ({
          ...p,
          name: p.type,
          isActive: p.status === "active",
        }));
        setTypes(mapped);
      } catch (err) {
        console.error("Failed to load product types", err);
        setTypes([]);
      }
    };

    load();
  }, []);

  const openModal = (type = null) => {
    console.log('Opening modal for:', type);
    if (type) {
      setEditingId(type.id);
      // handle objects coming from API (mapped) or raw backend shape
      setForm({
        name: type.name ?? type.type ?? "",
        description: type.description ?? "",
        isActive: typeof type.isActive === "boolean" ? type.isActive : (type.status === "active"),
      });
    } else {
      setEditingId(null);
      setForm(initialForm);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  } 

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // prepare payload to match backend: { type, description, status }
      const payload = {
        type: form.name,
        description: form.description,
        status: form.isActive ? "active" : "deactive",
      };

      if (editingId) {
        await updateProductType(editingId, payload);
        // close modal immediately after backend confirms update
        closeModal();
        // reload list
        const res = await getAllProductTypes();
        const mapped = (res || []).map((p) => ({ ...p, name: p.type, isActive: p.status === "active" }));
        setTypes(mapped);
        setSuccessMessage("Product type updated successfully.");
      } else {
        await addProductType(payload);
        // close modal immediately after backend confirms create
        closeModal();
        // reload list
        const res = await getAllProductTypes();
        const mapped = (res || []).map((p) => ({ ...p, name: p.type, isActive: p.status === "active" }));
        setTypes(mapped);
        setSuccessMessage("Product type created successfully.");
      }
    } catch (err) {
      console.error("Failed to save product type", err);
      // optionally set errors here based on err.response
    } finally {
      setIsSubmitting(false);
    }
  };

  // auto-hide success message after a few seconds
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(""), 4000);
    return () => clearTimeout(t);
  }, [successMessage]);

  const handleDelete = (id) => {
    if (!confirm("Are you sure you want to delete this product type?")) return;
    (async () => {
      try {
        await deleteProductType(id);
        const res = await getAllProductTypes();
        const mapped = (res || []).map((p) => ({ ...p, name: p.type, isActive: p.status === "active" }));
        setTypes(mapped);
      } catch (err) {
        console.error("Failed to delete product type", err);
      }
    })();
  };

  const toggleActive = (id) => {
    (async () => {
      try {
        await toggleProductTypeActive(id);
        const res = await getAllProductTypes();
        const mapped = (res || []).map((p) => ({ ...p, name: p.type, isActive: p.status === "active" }));
        setTypes(mapped);
      } catch (err) {
        console.error("Failed to toggle product type status", err);
      }
    })();
  };

  const filtered = types.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Types</h1>
          <p className="text-gray-600 mt-1">Manage your product categories and classifications</p>
        </div>
        <button
          onClick={() => openModal(null)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Product Type
        </button>
      </div>

      {/* Success message banner */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md flex items-start justify-between">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="text-sm font-medium">{successMessage}</div>
          </div>
          <button onClick={() => setSuccessMessage("")} className="text-green-600 hover:text-green-800 ml-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search product types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center">
                      <Search className="w-8 h-8 text-gray-400 mb-2" />
                      No product types found.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((t, index) => (
                  <tr key={t.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.name}</td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.code}</td> */}
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{t.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {/*  toggle-switch style for Active / Inactive */}
                      <button
                        onClick={() => toggleActive(t.id)}
                        aria-pressed={t.isActive}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors"
                      >
                        <span
                          className={`relative inline-block h-6 w-11 rounded-full transition-colors ${
                            t.isActive ? "bg-green-500" : "bg-amber-600"
                          }`}
                          aria-hidden
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transform transition-transform ${
                              t.isActive ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </span>
                        <span className={`text-xs ${t.isActive ? "text-green-800" : "text-gray-700"}`}>
                          {t.isActive ? "Active" : "Inactive"}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(t)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingId ? "Edit Product Type" : "Create Product Type"}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={`w-full border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.name ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter product type name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
                {/*
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    className={`w-full border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.code ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter product type code"
                  />
                  {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                </div>
                */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter description (optional)"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Saving..." : editingId ? "Save Changes" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductType;