import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  Package,
  BarChart3,
  Filter,
} from "lucide-react";
import Swal from "sweetalert2";
import { fetchDiscountLevels } from "../../../services/Inventory/discountLevelService";
import { getAllProductTypes } from "../../../services/Inventory/productTypeService";
import {
  getAll,
  create,
  update,
  remove,
} from "../../../services/Inventory/productListService";
import { useAuth } from "../../../contexts/AuthContext";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [priceFormData, setPriceFormData] = useState({
    cost: "",
    minPrice: "",
    mrp: "",
  });
  const [discountLevels, setDiscountLevels] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    oemNumbers: "",
    barcode: "",
    discountLevel: "",
    productType: "",
    cost: "",
    minPrice: "",
    mrp: "",
    isActive: true,
  });

  const [productTypes, setProductTypes] = useState([]);
  const { user } = useAuth();

  // Robust helper to pick an id field from user object (id, userId, user_id)
  const getUserId = (u) => u?.id ?? u?.userId ?? u?.user_id ?? "";

  // Map API product response to frontend format
  const mapProduct = (product) => ({
    ...product,
    isActive: product.is_active,
    discountLevel: product.discount_level_id,
    productType: product.product_type_id,
    discountLevelName:
      product.discount_level?.name ||
      product.discount_level?.label ||
      product.discount_level?.value,
    productTypeName:
      product.product_type?.type ||
      product.product_type?.name ||
      product.product_type?.label ||
      product.product_type?.value,
    oemNumbers: product.oem_numbers,
    minPrice: product.min_price,
    mrp: product.mrp,
  });

  // Fetch discount levels on component mount
  useEffect(() => {
    const loadDiscountLevels = async () => {
      try {
        const levels = await fetchDiscountLevels();
        setDiscountLevels(levels);
      } catch (error) {
        console.error("Failed to fetch discount levels:", error);
        // You might want to show a toast notification here
      }
    };
    loadDiscountLevels();
    // Load product types as well
    const loadProductTypes = async () => {
      try {
        const types = await getAllProductTypes();
        setProductTypes(types || []);
      } catch (err) {
        console.error("Failed to fetch product types:", err);
      }
    };
    loadProductTypes();
    // Load products
    const loadProducts = async () => {
      try {
        const data = await getAll();
        const productsData = Array.isArray(data) ? data : data?.data || [];
        // Map API response to frontend expected format
        const mappedProducts = productsData.map(mapProduct);
        setProducts(mappedProducts);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };
    loadProducts();
  }, []);

  // Refs for keyboard navigation
  const formRefs = {
    name: React.useRef(null),
    code: React.useRef(null),
    description: React.useRef(null),
    oemNumbers: React.useRef(null),
    barcode: React.useRef(null),
    cost: React.useRef(null),
    minPrice: React.useRef(null),
    mrp: React.useRef(null),
  };

  // Keyboard navigation handler
  const handleKeyDown = (e, currentField) => {
    const fieldOrder = currentProduct
      ? ["name", "code", "description", "oemNumbers", "barcode"]
      : [
          "name",
          "code",
          "description",
          "oemNumbers",
          "barcode",
          "cost",
          "minPrice",
          "mrp",
        ];

    const currentIndex = fieldOrder.indexOf(currentField);

    if (
      e.key === "ArrowDown" ||
      (e.key === "Enter" && currentField !== "description")
    ) {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % fieldOrder.length;
      const nextField = fieldOrder[nextIndex];
      formRefs[nextField].current?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex =
        currentIndex === 0 ? fieldOrder.length - 1 : currentIndex - 1;
      const prevField = fieldOrder[prevIndex];
      formRefs[prevField].current?.focus();
    }
  };

  const openModal = (product = null) => {
    setCurrentProduct(product);
    if (product) {
      setFormData({
        name: product.name,
        code: product.code,
        description: product.description,
        oemNumbers: product.oemNumbers,
        barcode: product.barcode,
        discountLevel: product.discountLevel || "",
        productType: product.productType || product.productTypeId || "",
        cost: product.cost || "",
        minPrice: product.minPrice || "",
        mrp: product.mrp || "",
        isActive: product.isActive !== undefined ? product.isActive : true,
      });
    } else {
      setFormData({
        name: "",
        code: "",
        description: "",
        oemNumbers: "",
        barcode: "",
        discountLevel: "",
        productType: "",
        cost: "",
        minPrice: "",
        mrp: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const openPriceModal = (product) => {
    setCurrentProduct(product);
    setPriceFormData({
      cost: product.cost || "",
      minPrice: product.minPrice || "",
      mrp: product.mrp || "",
    });
    setIsPriceModalOpen(true);
  };

  const closePriceModal = () => {
    setIsPriceModalOpen(false);
    setCurrentProduct(null);
  };

  const handlePriceInputChange = (e) => {
    const { name, value } = e.target;
    setPriceFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePriceSubmit = (e) => {
    e.preventDefault();
    setProducts((prev) =>
      prev.map((p) =>
        p.id === currentProduct.id ? { ...p, ...priceFormData } : p
      )
    );
    closePriceModal();
    Swal.fire({
      title: "Success!",
      text: "Product prices updated successfully.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      customClass: {
        popup: "rounded-xl",
      },
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Compare as strings to avoid type mismatches between numbers and strings
    const selectedLevel = discountLevels.find(
      (l) => String(l.id || l.value) === String(formData.discountLevel)
    );
    const selectedType = productTypes.find(
      (t) => String(t.id || t.value) === String(formData.productType)
    );

    try {
      if (currentProduct) {
        const payload = {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          oem_numbers: formData.oemNumbers,
          barcode: formData.barcode,
          discount_level_id: formData.discountLevel,
          product_type_id: formData.productType,
          cost: formData.cost,
          min_price: formData.minPrice,
          mrp: formData.mrp,
          is_active: formData.isActive,
        };
        const res = await update(currentProduct.id, payload);
        // Use returned resource when available, otherwise merge formData
        const updatedProduct = res
          ? mapProduct(res)
          : mapProduct({ ...currentProduct, ...payload });
        setProducts((prev) =>
          prev.map((p) => (p.id === currentProduct.id ? updatedProduct : p))
        );
        Swal.fire({
          title: "Success!",
          text: "Product updated successfully.",
          icon: "success",
          timer: 1800,
          showConfirmButton: false,
          customClass: { popup: "rounded-xl" },
        });
      } else {
        // include created_by as the currently logged-in user's id and create via API
        const payload = {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          oem_numbers: formData.oemNumbers,
          barcode: formData.barcode,
          discount_level_id: formData.discountLevel,
          product_type_id: formData.productType,
          cost: formData.cost,
          min_price: formData.minPrice,
          mrp: formData.mrp,
          is_active: formData.isActive,
          created_by: getUserId(user),
        };
        const createdProduct = mapProduct(await create(payload));
        setProducts((prev) => [...prev, createdProduct]);

        Swal.fire({
          title: "Success!",
          text: "Product created successfully.",
          icon: "success",
          timer: 1800,
          showConfirmButton: false,
          customClass: { popup: "rounded-xl" },
        });
      }
      closeModal();
    } catch (err) {
      console.error("Failed to save product:", err);
      const message = err?.message || err?.error || JSON.stringify(err);
      Swal.fire({ title: "Error", text: String(message), icon: "error" });
    }
  };

  const handleToggleActive = async (id) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const updated = { ...product, isActive: !product.isActive };
    try {
      await update(id, { is_active: updated.isActive });
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      console.error("Failed to toggle active state:", err);
      Swal.fire({
        title: "Error",
        text: "Could not change product status.",
        icon: "error",
      });
    }
  };

  const handleRemove = async (id) => {
    const result = await Swal.fire({
      title: "Delete Product?",
      text: "This action cannot be undone. The product will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-xl",
        confirmButton: "rounded-lg font-medium",
        cancelButton: "rounded-lg font-medium",
      },
    });

    if (!result.isConfirmed) return;

    try {
      await remove(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      Swal.fire({
        title: "Deleted!",
        text: "Product has been successfully deleted.",
        icon: "success",
        timer: 1600,
        showConfirmButton: false,
        customClass: { popup: "rounded-xl" },
      });
    } catch (err) {
      console.error(`Error deleting product ${id}:`, err);
      Swal.fire({
        title: "Error",
        text: "Failed to delete product.",
        icon: "error",
      });
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Product Management
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage your inventory products efficiently
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => openModal()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Product
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="pr-12">
              <p className="text-sm font-medium text-gray-600">
                📦 Total Products
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {products.length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="pr-12">
              <p className="text-sm font-medium text-gray-600">
                💰 Active Products
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {products.filter((p) => p.isActive !== false).length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Filter className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <div className="pr-12">
              <p className="text-sm font-medium text-gray-600">
                🏷️ Inactive Products
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {products.filter((p) => p.isActive === false).length}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search products by name, code, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="mx-auto h-24 w-24 text-gray-400">
                <Package className="h-full w-full" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {products.length === 0
                  ? "No products yet"
                  : "No products found"}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {products.length === 0
                  ? "Get started by creating your first product."
                  : "Try adjusting your search criteria."}
              </p>
              {products.length === 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => openModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Product
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                      Product Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                      Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                      OEM Numbers
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                      Barcode
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                      Discount Level
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                      Product Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                      Actions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-l-2 border-gray-300">
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div className="flex items-center">
                          <div
                            className={`w-3 h-3 rounded-full mr-3 ${
                              product.isActive !== false
                                ? "bg-green-500"
                                : "bg-orange-500"
                            }`}
                          ></div>
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                              <Package className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <div
                          className="text-sm text-gray-900 max-w-xs truncate"
                          title={product.description}
                        >
                          {product.description || "No description"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {product.oemNumbers || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {product.barcode || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {product.discountLevelName ||
                          (() => {
                            // Fallback lookup: coerce to string for robust comparison
                            const level = discountLevels.find(
                              (l) =>
                                String(l.id || l.value) ===
                                String(product.discountLevel)
                            );
                            return level
                              ? level.name || level.label || level.value
                              : "N/A";
                          })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {product.productTypeName ||
                          (() => {
                            const t = productTypes.find(
                              (pt) =>
                                String(pt.id || pt.value) ===
                                String(
                                  product.productType || product.productTypeId
                                )
                            );
                            return t
                              ? t.name || t.type || t.label || t.value
                              : "N/A";
                          })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium border-r border-gray-200">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => openModal(product)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                            title="Edit product details"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => openPriceModal(product)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                            title="Edit prices"
                          >
                            <BarChart3 className="h-3 w-3 mr-1" />
                            Price
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium border-r border-gray-200">
                        <div className="flex items-center">
                          <span className="text-xs font-medium text-gray-600 mr-2">
                            {product.isActive !== false ? "Active" : "Inactive"}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={product.isActive !== false}
                              onChange={() => handleToggleActive(product.id)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium border-l-2 border-gray-300">
                        <button
                          onClick={() => handleRemove(product.id)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-blue-200">
            <div className="px-6 py-4 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg border border-blue-300">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentProduct
                      ? "Edit Product Details"
                      : "Create New Product"}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={formRefs.name}
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onKeyDown={(e) => handleKeyDown(e, "name")}
                      required
                      autoComplete="off"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Code / Item Code{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={formRefs.code}
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      onKeyDown={(e) => handleKeyDown(e, "code")}
                      required
                      autoComplete="off"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                      placeholder="Enter product code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      ref={formRefs.description}
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown" && !e.shiftKey) {
                          e.preventDefault();
                          handleKeyDown(e, "description");
                        } else if (e.key === "ArrowUp" && !e.shiftKey) {
                          e.preventDefault();
                          handleKeyDown(e, "description");
                        }
                      }}
                      rows={4}
                      autoComplete="off"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white resize-none"
                      placeholder="Enter product description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Level
                    </label>
                    <select
                      name="discountLevel"
                      value={formData.discountLevel}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                    >
                      <option value="">Select Discount Level</option>
                      {discountLevels.map((level) => (
                        <option
                          key={level.id || level.value}
                          value={level.id || level.value}
                        >
                          {level.name || level.label || level.value}
                        </option>
                      ))}
                    </select>
                    {formData.discountLevel && (
                      <p className="text-sm text-gray-600 mt-1">
                        Selected:{" "}
                        {(() => {
                          const level = discountLevels.find(
                            (l) =>
                              String(l.id || l.value) ===
                              String(formData.discountLevel)
                          );
                          return level
                            ? level.name || level.label || level.value
                            : "";
                        })()}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Type
                    </label>
                    <select
                      name="productType"
                      value={formData.productType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                    >
                      <option value="">Select Product Type</option>
                      {productTypes.map((t) => (
                        <option key={t.id || t.value} value={t.id || t.value}>
                          {t.name || t.type || t.label || t.value}
                        </option>
                      ))}
                    </select>
                    {formData.productType && (
                      <p className="text-sm text-gray-600 mt-1">
                        Selected:{" "}
                        {(() => {
                          const t = productTypes.find(
                            (pt) =>
                              String(pt.id || pt.value) ===
                              String(formData.productType)
                          );
                          return t
                            ? t.name || t.type || t.label || t.value
                            : "";
                        })()}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OEM Numbers
                      </label>
                      <input
                        ref={formRefs.oemNumbers}
                        type="text"
                        name="oemNumbers"
                        value={formData.oemNumbers}
                        onChange={handleInputChange}
                        onKeyDown={(e) => handleKeyDown(e, "oemNumbers")}
                        autoComplete="off"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                        placeholder="Enter OEM numbers"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Barcode
                      </label>
                      <input
                        ref={formRefs.barcode}
                        type="text"
                        name="barcode"
                        value={formData.barcode}
                        onChange={handleInputChange}
                        onKeyDown={(e) => handleKeyDown(e, "barcode")}
                        autoComplete="off"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                        placeholder="Enter barcode"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isActive"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Active Product
                    </label>
                  </div>

                  {!currentProduct && (
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cost Price
                        </label>
                        <input
                          ref={formRefs.cost}
                          type="number"
                          name="cost"
                          value={formData.cost}
                          onChange={handleInputChange}
                          onKeyDown={(e) => handleKeyDown(e, "cost")}
                          step="0.01"
                          min="0"
                          autoComplete="off"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Price
                        </label>
                        <input
                          ref={formRefs.minPrice}
                          type="number"
                          name="minPrice"
                          value={formData.minPrice}
                          onChange={handleInputChange}
                          onKeyDown={(e) => handleKeyDown(e, "minPrice")}
                          step="0.01"
                          min="0"
                          autoComplete="off"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          MRP (Maximum Retail Price)
                        </label>
                        <input
                          ref={formRefs.mrp}
                          type="number"
                          name="mrp"
                          value={formData.mrp}
                          onChange={handleInputChange}
                          onKeyDown={(e) => handleKeyDown(e, "mrp")}
                          step="0.01"
                          min="0"
                          autoComplete="off"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium shadow-sm"
                >
                  {currentProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price Edit Modal */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-green-200">
            <div className="px-6 py-4 border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg border border-green-300">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      💰 Edit Prices
                    </h2>
                    <p className="text-sm text-green-700 font-medium">
                      {currentProduct?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closePriceModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handlePriceSubmit} className="px-6 py-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Price
                    </label>
                    <input
                      type="number"
                      name="cost"
                      value={priceFormData.cost}
                      onChange={handlePriceInputChange}
                      step="0.01"
                      min="0"
                      autoComplete="off"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Price
                    </label>
                    <input
                      type="number"
                      name="minPrice"
                      value={priceFormData.minPrice}
                      onChange={handlePriceInputChange}
                      step="0.01"
                      min="0"
                      autoComplete="off"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      MRP (Maximum Retail Price)
                    </label>
                    <input
                      type="number"
                      name="mrp"
                      value={priceFormData.mrp}
                      onChange={handlePriceInputChange}
                      step="0.01"
                      min="0"
                      autoComplete="off"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closePriceModal}
                  className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 font-medium shadow-sm"
                >
                  Update Prices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
