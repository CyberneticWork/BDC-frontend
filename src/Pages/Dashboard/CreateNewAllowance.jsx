import React, { useState } from "react";
import {
  Plus,
  X,
  Search,
  Edit3,
  Trash2,
  FileText,
  Users,
  Settings,
  Plane,
  Target,
  Heart,
  Clipboard,
  DollarSign,
  Calendar,
} from "lucide-react";

const CreateNewAllowance = () => {
  const companies = ["Company A", "Company B", "Company C"];

  const [selectedCompany, setSelectedCompany] = useState(companies[0]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [allowances, setAllowances] = useState([
    {
      id: 1,
      company: "Company A",
      code: "001",
      name: "Travelling Allowance",
      status: "Active",
      category: "Travel",
      type: "Variable",
      date: "2023-10-15",
    },
    {
      id: 2,
      company: "Company A",
      code: "002",
      name: "Special Allowance",
      status: "Active",
      category: "Bonus",
      type: "Fixed",
    },
    {
      id: 3,
      company: "Company B",
      code: "003",
      name: "Attendance Allowance",
      status: "Active",
      category: "Performance",
      type: "Variable",
      date: "2023-11-20",
    },
    {
      id: 4,
      company: "Company B",
      code: "004",
      name: "Production Incentive",
      status: "Active",
      category: "Performance",
      type: "Variable",
      date: "2023-09-05",
    },
    {
      id: 5,
      company: "Company C",
      code: "005",
      name: "Medical Reimbursement",
      status: "Active",
      category: "Health",
      type: "Fixed",
    },
    {
      id: 6,
      company: "Company C",
      code: "006",
      name: "Other Reimbursement",
      status: "Inactive",
      category: "Other",
      type: "Fixed",
    },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAllowance, setSelectedAllowance] = useState(null);
  const [editAllowance, setEditAllowance] = useState({
    id: null,
    code: "",
    name: "",
    company: companies[0],
    category: "Bonus",
    status: "Active",
    type: "Fixed",
    fromDate: "",
    toDate: "",
  });
  const [newAllowance, setNewAllowance] = useState({
    code: "",
    name: "",
    company: companies[0],
    category: "Bonus",
    status: "Active",
    type: "Fixed",
    fromDate: "",
    toDate: "",
  });

  const categories = ["Travel", "Bonus", "Performance", "Health", "Other"];
  const statuses = ["Active", "Inactive"];
  const allowanceTypes = ["Fixed", "Variable"];

  // Filtered allowances by company and category
  const filteredAllowances = allowances.filter(
    (allowance) =>
      allowance.company === selectedCompany &&
      (selectedCategory === "" || allowance.category === selectedCategory) &&
      (allowance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        allowance.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddAllowance = () => {
    if (
      newAllowance.code.trim() &&
      newAllowance.name.trim() &&
      (newAllowance.type !== "Variable" ||
        (newAllowance.fromDate && newAllowance.toDate))
    ) {
      const newId = Math.max(...allowances.map((a) => a.id), 0) + 1;
      setAllowances([
        ...allowances,
        {
          id: newId,
          ...newAllowance,
          fromDate: newAllowance.type === "Variable" ? newAllowance.fromDate : "",
          toDate: newAllowance.type === "Variable" ? newAllowance.toDate : "",
        },
      ]);
      setNewAllowance({
        code: "",
        name: "",
        company: companies[0],
        category: "Bonus",
        status: "Active",
        type: "Fixed",
        fromDate: "",
        toDate: "",
      });
      setIsAddModalOpen(false);
    }
  };

  const handleEditAllowance = () => {
    if (
      editAllowance.code.trim() &&
      editAllowance.name.trim() &&
      (editAllowance.type !== "Variable" ||
        (editAllowance.fromDate && editAllowance.toDate))
    ) {
      setAllowances(
        allowances.map((allowance) =>
          allowance.id === editAllowance.id
            ? {
                ...editAllowance,
                fromDate: editAllowance.type === "Variable" ? editAllowance.fromDate : "",
                toDate: editAllowance.type === "Variable" ? editAllowance.toDate : "",
              }
            : allowance
        )
      );
      setIsEditModalOpen(false);
      setEditAllowance({
        id: null,
        code: "",
        name: "",
        company: companies[0],
        category: "Bonus",
        status: "Active",
        type: "Fixed",
        fromDate: "",
        toDate: "",
      });
    }
  };

  const handleDeleteAllowance = () => {
    setAllowances(
      allowances.filter((allowance) => allowance.id !== selectedAllowance.id)
    );
    setIsDeleteModalOpen(false);
    setSelectedAllowance(null);
  };

  const openEditModal = (allowance) => {
    setEditAllowance({ ...allowance });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (allowance) => {
    setSelectedAllowance(allowance);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (field, value) => {
    setNewAllowance((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditInputChange = (field, value) => {
    setEditAllowance((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewAllowance({
      code: "",
      name: "",
      company: companies[0], // Reset company
      category: "Bonus",
      status: "Active",
      type: "Fixed",
      fromDate: "",
      toDate: "",
    });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditAllowance({
      id: null,
      code: "",
      name: "",
      company: companies[0], // Reset company
      category: "Bonus",
      status: "Active",
      type: "Fixed",
      fromDate: "",
      toDate: "",
    });
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedAllowance(null);
  };

  const getStatusColor = (status) => {
    return status === "Active"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-gray-100 text-gray-600 border-gray-200";
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Travel":
        return <Plane className="w-4 h-4 text-blue-600" />;
      case "Performance":
        return <Target className="w-4 h-4 text-green-600" />;
      case "Health":
        return <Heart className="w-4 h-4 text-red-600" />;
      case "Other":
        return <Clipboard className="w-4 h-4 text-gray-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-yellow-600" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                Allowance Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and organize employee allowances
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus size={20} />
                <span className="font-medium">Add New Allowance</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Allowances
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {allowances.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {allowances.filter((a) => a.status === "Active").length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-500">
                  {allowances.filter((a) => a.status === "Inactive").length}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-xl">
                <Settings className="w-6 h-6 text-gray-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-purple-600">
                  {categories.length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search allowances by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Company and Category Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Code
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Allowance Name
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden sm:table-cell">
                    Category
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden lg:table-cell">
                    Type
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden lg:table-cell">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden xl:table-cell">
                    Date
                  </th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAllowances.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-gray-100 rounded-full">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          No allowances found
                        </p>
                        <p className="text-gray-400 text-sm">
                          Try adjusting your search criteria
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAllowances.map((allowance) => (
                    <tr
                      key={allowance.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">
                              {allowance.code}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {allowance.name}
                          </span>
                          <span className="text-sm text-gray-500 sm:hidden">
                            {getCategoryIcon(allowance.category)}{" "}
                            {allowance.category}
                          </span>
                          {allowance.type === "Variable" && (
                            <span className="text-xs text-gray-400 xl:hidden">
                              {formatDate(allowance.date)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(allowance.category)}
                          <span className="text-gray-700">
                            {allowance.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 hidden lg:table-cell">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                            allowance.type === "Fixed"
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : "bg-orange-100 text-orange-800 border-orange-200"
                          }`}
                        >
                          {allowance.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 hidden lg:table-cell">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            allowance.status
                          )}`}
                        >
                          {allowance.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 hidden xl:table-cell">
                        {allowance.type === "Variable" && allowance.fromDate && allowance.toDate ? (
                          <div className="flex flex-col gap-1 text-gray-700">
                            <div>
                              <Calendar className="w-4 h-4 text-gray-400 inline mr-1" />
                              <span>From: {formatDate(allowance.fromDate)}</span>
                            </div>
                            <div>
                              <Calendar className="w-4 h-4 text-gray-400 inline mr-1" />
                              <span>To: {formatDate(allowance.toDate)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(allowance)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all tooltip"
                            title="Edit Allowance"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(allowance)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all tooltip"
                            title="Delete Allowance"
                          >
                            <Trash2 size={16} />
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
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Add New Allowance
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Create a new allowance entry
                </p>
              </div>
              <button
                onClick={closeAddModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Allowance Code *
                  </label>
                  <input
                    type="text"
                    value={newAllowance.code}
                    onChange={(e) => handleInputChange("code", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., 007"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={newAllowance.status}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Allowance Name *
                </label>
                <input
                  type="text"
                  value={newAllowance.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter allowance name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newAllowance.category}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {getCategoryIcon(category)} {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Allowance Type
                </label>
                <select
                  value={newAllowance.type}
                  onChange={(e) => {
                    handleInputChange("type", e.target.value);
                    if (e.target.value === "Fixed") {
                      handleInputChange("fromDate", "");
                      handleInputChange("toDate", "");
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {allowanceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {newAllowance.type === "Variable" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      From Date *
                    </label>
                    <input
                      type="date"
                      value={newAllowance.fromDate}
                      min={todayStr}
                      onChange={(e) => handleInputChange("fromDate", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      To Date *
                    </label>
                    <input
                      type="date"
                      value={newAllowance.toDate}
                      min={newAllowance.fromDate || todayStr}
                      onChange={(e) => handleInputChange("toDate", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company
                  </label>
                  <select
                    value={newAllowance.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {companies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={closeAddModal}
                className="px-6 py-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAllowance}
                disabled={
                  !newAllowance.code.trim() ||
                  !newAllowance.name.trim() ||
                  (newAllowance.type === "Variable" && (!newAllowance.fromDate || !newAllowance.toDate))
                }
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all font-medium shadow-lg disabled:shadow-none"
              >
                Add Allowance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Edit Allowance
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Modify allowance details
                </p>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Allowance Code *
                  </label>
                  <input
                    type="text"
                    value={editAllowance.code}
                    onChange={(e) =>
                      handleEditInputChange("code", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., 007"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editAllowance.status}
                    onChange={(e) =>
                      handleEditInputChange("status", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Allowance Name *
                </label>
                <input
                  type="text"
                  value={editAllowance.name}
                  onChange={(e) =>
                    handleEditInputChange("name", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter allowance name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={editAllowance.category}
                  onChange={(e) =>
                    handleEditInputChange("category", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {getCategoryIcon(category)} {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Allowance Type
                </label>
                <select
                  value={editAllowance.type}
                  onChange={(e) => {
                    handleEditInputChange("type", e.target.value);
                    if (e.target.value === "Fixed") {
                      handleEditInputChange("fromDate", "");
                      handleEditInputChange("toDate", "");
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {allowanceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {editAllowance.type === "Variable" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      From Date *
                    </label>
                    <input
                      type="date"
                      value={editAllowance.fromDate}
                      min={todayStr}
                      onChange={(e) => handleEditInputChange("fromDate", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      To Date *
                    </label>
                    <input
                      type="date"
                      value={editAllowance.toDate}
                      min={editAllowance.fromDate || todayStr}
                      onChange={(e) => handleEditInputChange("toDate", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company
                  </label>
                  <select
                    value={editAllowance.company}
                    onChange={(e) => handleEditInputChange("company", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {companies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={closeEditModal}
                className="px-6 py-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditAllowance}
                disabled={
                  !editAllowance.code.trim() ||
                  !editAllowance.name.trim() ||
                  (editAllowance.type === "Variable" && (!editAllowance.fromDate || !editAllowance.toDate))
                }
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all font-medium shadow-lg disabled:shadow-none"
              >
                Update Allowance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedAllowance && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Delete Allowance
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the allowance
                <span className="font-semibold text-gray-900">
                  {" "}
                  "{selectedAllowance.name}"
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-6 py-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllowance}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-medium shadow-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateNewAllowance;