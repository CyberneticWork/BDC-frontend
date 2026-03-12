import React, { useState, useEffect } from "react";
import {
  Plus,
  X,
  Search,
  Edit3,
  Trash2,
  FileText,
  Users,
  Settings,
  Loader2,
  Download,
  Upload,
} from "lucide-react";
import BonusService from "../../services/BonusService";
import { fetchCompanies, fetchDepartments } from "@services/ApiDataService";
import Swal from "sweetalert2";

const CreateNewBonus = () => {
  // State management
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("all");

  const [bonuses, setBonuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBonus, setSelectedBonus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [importFile, setImportFile] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const getToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Form states
  const [editBonus, setEditBonus] = useState({
    id: null,
    bonus_code: "",
    bonus_name: "",
    company_id: "",
    amount: "",
    department_id: "",
    status: "active",
    bonus_type: "fixed",
    fixed_date: "",
    variable_from: "",
    variable_to: "",
  });

  const [newBonus, setNewBonus] = useState({
    bonus_code: "",
    bonus_name: "",
    company_id: "",
    department_id: "",
    amount: "",
    status: "active",
    bonus_type: "fixed",
    fixed_date: getToday(),
    variable_from: "",
    variable_to: "",
  });

  const [formErrors, setFormErrors] = useState({
    add: {},
    edit: {},
  });

  // Constants
  const statuses = ["active", "inactive"];
  const bonusTypes = ["fixed", "variable"];

  // Helper function to format dates for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Alerts
  const showSuccessAlert = (message) => {
    Swal.fire({
      title: "Success!",
      text: message,
      icon: "success",
      confirmButtonText: "OK",
      customClass: {
        confirmButton:
          "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg",
      },
    });
  };

  const showErrorAlert = (message) => {
    Swal.fire({
      title: "Error!",
      text: message,
      icon: "error",
      confirmButtonText: "OK",
      customClass: {
        confirmButton:
          "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg",
      },
    });
  };

  // Fetch data
  useEffect(() => {
    fetchData();
    getToday();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [bonusesRes, comp, depts] = await Promise.all([
        BonusService.getAllBonuses(),
        fetchCompanies(),
        fetchDepartments(),
      ]);

      setBonuses(bonusesRes);
      setCompanies(comp);
      setDepartments(depts);

      // default company for newBonus
      if (comp.length > 0 && !newBonus.company_id) {
        setNewBonus((prev) => ({
          ...prev,
          company_id: comp[0].id,
          department_id: "",
        }));

        const defaultCompanyDepts = depts.filter(
          (dept) => dept.company_id === comp[0].id
        );
        setFilteredDepartments(defaultCompanyDepts);
      }

      if (
        selectedCompany !== "all" &&
        !comp.some((c) => c.id == selectedCompany)
      ) {
        setSelectedCompany("all");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch data");
      showErrorAlert(err.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter departments for Add form
  useEffect(() => {
    if (newBonus.company_id) {
      const filtered = departments.filter(
        (dept) => dept.company_id == newBonus.company_id
      );
      setFilteredDepartments(filtered);

      if (
        newBonus.department_id &&
        !filtered.some((dept) => dept.id == newBonus.department_id)
      ) {
        setNewBonus((prev) => ({ ...prev, department_id: "" }));
      }
    }
  }, [newBonus.company_id, departments]);

  // Validate edit department when company changes
  useEffect(() => {
    if (editBonus.company_id) {
      const filtered = departments.filter(
        (dept) => dept.company_id == editBonus.company_id
      );

      if (
        editBonus.department_id &&
        !filtered.some((dept) => dept.id == editBonus.department_id)
      ) {
        setEditBonus((prev) => ({ ...prev, department_id: "" }));
      }
    }
  }, [editBonus.company_id, departments]);

  // Filter bonuses
  const filteredBonuses = bonuses.filter((bonus) => {
    const matchesCompany =
      selectedCompany === "all" || bonus.company_id == selectedCompany;

    const matchesSearch =
      (bonus.bonus_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (bonus.bonus_code || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesCompany && matchesSearch;
  });

  // Excel Import/Export
  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const response = await BonusService.downloadTemplate();

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "bonuses_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      showSuccessAlert("Template downloaded successfully!");
    } catch (error) {
      showErrorAlert(error.message || "Failed to download template");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e) => {
    setImportFile(e.target.files[0]);
    setImportErrors([]);
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      showErrorAlert("Please select a file to import");
      return;
    }

    setIsProcessing(true);
    setImportErrors([]);

    try {
      const response = await BonusService.importBonuses(importFile);
      showSuccessAlert(response.message || "Bonuses imported successfully!");
      setIsImportModalOpen(false);
      setImportFile(null);
      fetchData();
    } catch (error) {
      console.error("Import error:", error);

      let errorMessage = "There were errors in your import file:";
      let errorsToDisplay = [];

      if (error.message && error.message.includes("Row")) {
        const rowErrors = error.message.split("\n");
        errorsToDisplay = rowErrors;
        errorMessage += "\n\n" + rowErrors.map((e) => `• ${e}`).join("\n");
      } else {
        const msg = error.message || "Import failed";
        errorsToDisplay = [msg];
        errorMessage += `\n\n• ${msg}`;
      }

      setImportErrors(errorsToDisplay);
      showErrorAlert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // CRUD Handlers
  const handleAddBonus = async () => {
    setIsProcessing(true);
    setFormErrors((prev) => ({ ...prev, add: {} }));

    try {
      const errors = {};
      if (!newBonus.bonus_code.trim()) errors.bonus_code = ["Bonus code is required"];
      if (!newBonus.bonus_name.trim()) errors.bonus_name = ["Bonus name is required"];
      if (!newBonus.company_id) errors.company_id = ["Company is required"];

      // Date validation
      if (newBonus.bonus_type === "fixed") {
        if (!newBonus.fixed_date) errors.fixed_date = ["Fixed date is required"];
      } else {
        if (!newBonus.variable_from) errors.variable_from = ["Start date is required"];
        if (!newBonus.variable_to) errors.variable_to = ["End date is required"];
        if (
          newBonus.variable_from &&
          newBonus.variable_to &&
          new Date(newBonus.variable_from) > new Date(newBonus.variable_to)
        ) {
          errors.variable_to = ["End date must be after start date"];
        }
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors((prev) => ({ ...prev, add: errors }));
        return;
      }

      const response = await BonusService.createBonus(newBonus);

      const selectedCompanyObj = companies.find((c) => c.id == newBonus.company_id);
      const selectedDepartment = departments.find((d) => d.id == newBonus.department_id);

      setBonuses((prev) => [
        ...prev,
        {
          ...response,
          company: selectedCompanyObj
            ? { id: selectedCompanyObj.id, name: selectedCompanyObj.name }
            : null,
          department: selectedDepartment
            ? { id: selectedDepartment.id, name: selectedDepartment.name }
            : null,
        },
      ]);

      setNewBonus({
        bonus_code: "",
        bonus_name: "",
        company_id: companies[0]?.id || "",
        department_id: "",
        status: "active",
        bonus_type: "fixed",
        amount: "",
        fixed_date: getToday(),
        variable_from: "",
        variable_to: "",
      });

      setIsAddModalOpen(false);
      showSuccessAlert("Bonus created successfully!");
    } catch (error) {
      console.error("Add error:", error);
      if (error.response?.data?.errors) {
        setFormErrors((prev) => ({ ...prev, add: error.response.data.errors }));
      } else {
        showErrorAlert(error.message || "Failed to create bonus");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditBonus = async () => {
    setIsProcessing(true);
    setFormErrors((prev) => ({ ...prev, edit: {} }));

    try {
      const errors = {};
      if (!editBonus.bonus_code.trim()) errors.bonus_code = ["Bonus code is required"];
      if (!editBonus.bonus_name.trim()) errors.bonus_name = ["Bonus name is required"];
      if (!editBonus.company_id) errors.company_id = ["Company is required"];

      // Date validation
      if (editBonus.bonus_type === "fixed") {
        if (!editBonus.fixed_date) errors.fixed_date = ["Fixed date is required"];
      } else {
        if (!editBonus.variable_from) errors.variable_from = ["Start date is required"];
        if (!editBonus.variable_to) errors.variable_to = ["End date is required"];
        if (
          editBonus.variable_from &&
          editBonus.variable_to &&
          new Date(editBonus.variable_from) > new Date(editBonus.variable_to)
        ) {
          errors.variable_to = ["End date must be after start date"];
        }
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors((prev) => ({ ...prev, edit: errors }));
        return;
      }

      const selectedCompanyObj = companies.find((c) => c.id == editBonus.company_id);
      const selectedDepartment = departments.find((d) => d.id == editBonus.department_id);

      const response = await BonusService.updateBonus(editBonus.id, editBonus);

      setBonuses((prev) =>
        prev.map((item) => {
          if (item.id === editBonus.id) {
            return {
              ...response,
              company: selectedCompanyObj
                ? { id: selectedCompanyObj.id, name: selectedCompanyObj.name }
                : null,
              department: selectedDepartment
                ? { id: selectedDepartment.id, name: selectedDepartment.name }
                : null,
            };
          }
          return item;
        })
      );

      setIsEditModalOpen(false);
      showSuccessAlert("Bonus updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      if (error.response?.data?.errors) {
        setFormErrors((prev) => ({ ...prev, edit: error.response.data.errors }));
      } else {
        showErrorAlert(error.message || "Failed to update bonus");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBonus = async () => {
    setIsProcessing(true);
    try {
      await BonusService.deleteBonus(selectedBonus.id);
      setBonuses((prev) => prev.filter((item) => item.id !== selectedBonus.id));
      setIsDeleteModalOpen(false);
      showSuccessAlert("Bonus deleted successfully!");
    } catch (error) {
      showErrorAlert(error.message || "Failed to delete bonus");
    } finally {
      setIsProcessing(false);
    }
  };

  // Modals
  const openEditModal = (bonus) => {
    const formattedBonus = {
      ...bonus,
      department_id: bonus.department_id || "",
      fixed_date: formatDateForInput(bonus.fixed_date),
      variable_from: formatDateForInput(bonus.variable_from),
      variable_to: formatDateForInput(bonus.variable_to),
    };

    setEditBonus(formattedBonus);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (bonus) => {
    setSelectedBonus(bonus);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (field, value) => {
    setNewBonus((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field, value) => {
    setEditBonus((prev) => ({ ...prev, [field]: value }));
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewBonus({
      bonus_code: "",
      bonus_name: "",
      company_id: companies[0]?.id || "",
      department_id: "",
      amount: "",
      status: "active",
      bonus_type: "fixed",
      fixed_date: getToday(),
      variable_from: "",
      variable_to: "",
    });
    setFormErrors((prev) => ({ ...prev, add: {} }));
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditBonus({
      id: null,
      bonus_code: "",
      bonus_name: "",
      amount: "",
      company_id: companies[0]?.id || "",
      department_id: "",
      status: "active",
      bonus_type: "fixed",
      fixed_date: getToday(),
      variable_from: "",
      variable_to: "",
    });
    setFormErrors((prev) => ({ ...prev, edit: {} }));
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedBonus(null);
  };

  const getStatusColor = (status) => {
    return status === "active"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-gray-100 text-gray-600 border-gray-200";
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error: </strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                Bonus Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and organize employee bonuses
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus size={20} />
                <span className="font-medium">Add New Bonus</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Upload size={20} />
                <span className="font-medium">Import Bonuses</span>
              </button>

              <button
                onClick={handleDownloadTemplate}
                disabled={isDownloadingTemplate}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isDownloadingTemplate ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span className="font-medium">Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    <span className="font-medium">Export Bonus Template</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bonuses</p>
                <p className="text-2xl font-bold text-gray-900">{bonuses.length}</p>
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
                  {bonuses.filter((a) => a.status === "active").length}
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
                  {bonuses.filter((a) => a.status === "inactive").length}
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
                <p className="text-sm font-medium text-gray-600">Bonus Types</p>
                <p className="text-2xl font-bold text-purple-600">{bonusTypes.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search bonuses by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Company Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Code</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Bonus Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden lg:table-cell">Company</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden lg:table-cell">Department</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden sm:table-cell">Amount</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden lg:table-cell">Type</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden sm:table-cell">Fixed Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden sm:table-cell">Start Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden sm:table-cell">End Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 hidden lg:table-cell">Status</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredBonuses.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-gray-100 rounded-full">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No bonuses found</p>
                        <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBonuses.map((bonus) => (
                    <tr key={bonus.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-20 rounded-xl flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">
                              {bonus.bonus_code}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {bonus.bonus_name}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 hidden sm:table-cell">
                        {bonus.company?.name || "Unknown Company"}
                      </td>

                      <td className="py-4 px-6 hidden lg:table-cell">
                        {bonus.department?.name || "—"}
                      </td>

                      <td className="py-4 px-6 hidden lg:table-cell">
                        LKR {parseFloat(bonus.amount || 0).toFixed(2)}
                      </td>

                      <td className="py-4 px-6 hidden lg:table-cell">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                            bonus.bonus_type === "fixed"
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : "bg-orange-100 text-orange-800 border-orange-200"
                          }`}
                        >
                          {bonus.bonus_type}
                        </span>
                      </td>

                      <td className="py-4 px-6 hidden sm:table-cell">
                        {bonus.bonus_type === "fixed"
                          ? formatDateForInput(bonus.fixed_date)
                          : "-"}
                      </td>

                      <td className="py-4 px-6 hidden sm:table-cell">
                        {bonus.bonus_type === "variable"
                          ? formatDateForInput(bonus.variable_from)
                          : "-"}
                      </td>

                      <td className="py-4 px-6 hidden sm:table-cell">
                        {bonus.bonus_type === "variable"
                          ? formatDateForInput(bonus.variable_to)
                          : "-"}
                      </td>

                      <td className="py-4 px-6 hidden lg:table-cell">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            bonus.status
                          )}`}
                        >
                          {bonus.status?.charAt(0).toUpperCase() + bonus.status?.slice(1)}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(bonus)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit Bonus"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(bonus)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Bonus"
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
                <h2 className="text-xl font-bold text-gray-900">Add New Bonus</h2>
                <p className="text-gray-600 text-sm mt-1">Create a new bonus entry</p>
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
                    Bonus Code
                  </label>
                  <input
                    type="text"
                    value={newBonus.bonus_code}
                    onChange={(e) => handleInputChange("bonus_code", e.target.value)}
                    className={`w-full px-4 py-3 border ${
                      formErrors.add.bonus_code ? "border-red-500" : "border-gray-200"
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="Enter bonus code"
                  />
                  {formErrors.add.bonus_code && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.add.bonus_code[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={newBonus.status}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bonus Name *
                </label>
                <input
                  type="text"
                  value={newBonus.bonus_name}
                  onChange={(e) => handleInputChange("bonus_name", e.target.value)}
                  className={`w-full px-4 py-3 border ${
                    formErrors.add.bonus_name ? "border-red-500" : "border-gray-200"
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="Enter bonus name"
                />
                {formErrors.add.bonus_name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.add.bonus_name[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bonus Type *
                </label>
                <select
                  value={newBonus.bonus_type}
                  onChange={(e) => handleInputChange("bonus_type", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {bonusTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date Configuration *
                </label>

                {newBonus.bonus_type === "fixed" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fixed Date
                    </label>
                    <input
                      type="date"
                      value={newBonus.fixed_date}
                      onChange={(e) => handleInputChange("fixed_date", e.target.value)}
                      className={`w-full px-4 py-3 border ${
                        formErrors.add.fixed_date ? "border-red-500" : "border-gray-200"
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all`}
                      required
                    />
                    {formErrors.add.fixed_date && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.add.fixed_date[0]}</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={newBonus.variable_from}
                        onChange={(e) => handleInputChange("variable_from", e.target.value)}
                        className={`w-full px-4 py-3 border ${
                          formErrors.add.variable_from ? "border-red-500" : "border-gray-200"
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all`}
                        required
                      />
                      {formErrors.add.variable_from && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.add.variable_from[0]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={newBonus.variable_to}
                        onChange={(e) => handleInputChange("variable_to", e.target.value)}
                        className={`w-full px-4 py-3 border ${
                          formErrors.add.variable_to ? "border-red-500" : "border-gray-200"
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all`}
                        required
                        min={newBonus.variable_from}
                      />
                      {formErrors.add.variable_to && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.add.variable_to[0]}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company *
                </label>
                <select
                  value={newBonus.company_id}
                  onChange={(e) => handleInputChange("company_id", e.target.value)}
                  className={`w-full px-4 py-3 border ${
                    formErrors.add.company_id ? "border-red-500" : "border-gray-200"
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all`}
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {formErrors.add.company_id && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.add.company_id[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={newBonus.department_id}
                  onChange={(e) => handleInputChange("department_id", e.target.value)}
                  className={`w-full px-4 py-3 border ${
                    formErrors.add.department_id ? "border-red-500" : "border-gray-200"
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all`}
                  disabled={!newBonus.company_id || filteredDepartments.length === 0}
                >
                  <option value="">None / Select Department</option>
                  {filteredDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>

                {newBonus.company_id && filteredDepartments.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    No departments available for selected company
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={closeAddModal}
                className="px-6 py-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleAddBonus}
                disabled={isProcessing}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all font-medium shadow-lg disabled:shadow-none flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  "Add Bonus"
                )}
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
                <h2 className="text-xl font-bold text-gray-900">Edit Bonus</h2>
                <p className="text-gray-600 text-sm mt-1">Modify bonus details</p>
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
                    Bonus Code
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-100 rounded-xl">
                    {editBonus.bonus_code}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={editBonus.status}
                    onChange={(e) => handleEditInputChange("status", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bonus Name *
                </label>
                <input
                  type="text"
                  value={editBonus.bonus_name}
                  onChange={(e) => handleEditInputChange("bonus_name", e.target.value)}
                  className={`w-full px-4 py-3 border ${
                    formErrors.edit.bonus_name ? "border-red-500" : "border-gray-200"
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all`}
                  placeholder="Enter bonus name"
                />
                {formErrors.edit.bonus_name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.edit.bonus_name[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bonus Type *
                </label>
                <select
                  value={editBonus.bonus_type}
                  onChange={(e) => handleEditInputChange("bonus_type", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all"
                >
                  {bonusTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date Configuration *
                  </label>

                  {editBonus.bonus_type === "fixed" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fixed Date
                      </label>
                      <input
                        type="date"
                        value={editBonus.fixed_date || ""}
                        onChange={(e) => handleEditInputChange("fixed_date", e.target.value)}
                        className={`w-full px-4 py-3 border ${
                          formErrors.edit.fixed_date ? "border-red-500" : "border-gray-200"
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all`}
                        required
                      />
                      {formErrors.edit.fixed_date && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.edit.fixed_date[0]}</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          From Date
                        </label>
                        <input
                          type="date"
                          value={editBonus.variable_from || ""}
                          onChange={(e) =>
                            handleEditInputChange("variable_from", e.target.value)
                          }
                          className={`w-full px-4 py-3 border ${
                            formErrors.edit.variable_from ? "border-red-500" : "border-gray-200"
                          } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all`}
                          required
                        />
                        {formErrors.edit.variable_from && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.edit.variable_from[0]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          To Date
                        </label>
                        <input
                          type="date"
                          value={editBonus.variable_to || ""}
                          onChange={(e) => handleEditInputChange("variable_to", e.target.value)}
                          className={`w-full px-4 py-3 border ${
                            formErrors.edit.variable_to ? "border-red-500" : "border-gray-200"
                          } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all`}
                          required
                          min={editBonus.variable_from}
                        />
                        {formErrors.edit.variable_to && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.edit.variable_to[0]}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  value={editBonus.amount}
                  onChange={(e) => handleEditInputChange("amount", e.target.value)}
                  className={`w-full px-4 py-3 border ${
                    formErrors.edit.amount ? "border-red-500" : "border-gray-200"
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all`}
                  placeholder="Enter bonus amount"
                />
                {formErrors.edit.amount && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.edit.amount[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company *
                </label>
                <select
                  value={editBonus.company_id}
                  onChange={(e) => handleEditInputChange("company_id", e.target.value)}
                  className={`w-full px-4 py-3 border ${
                    formErrors.edit.company_id ? "border-red-500" : "border-gray-200"
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all`}
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={editBonus.department_id}
                  onChange={(e) => handleEditInputChange("department_id", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-all"
                >
                  <option value="">None / Select Department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={closeEditModal}
                className="px-6 py-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleEditBonus}
                disabled={isProcessing}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all font-medium shadow-lg disabled:shadow-none flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  "Update Bonus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedBonus && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Bonus</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the bonus
                <span className="font-semibold text-gray-900"> "{selectedBonus.bonus_name}"</span>
                ? This action cannot be undone.
              </p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-6 py-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                  disabled={isProcessing}
                >
                  Cancel
                </button>

                <button
                  onClick={handleDeleteBonus}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 disabled:from-gray-300 disabled:to-gray-300 transition-all font-medium shadow-lg disabled:shadow-none flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Import Bonuses</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Upload an Excel file to import multiple bonuses
                </p>
              </div>

              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setImportErrors([]);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 mb-3">
                  {importFile
                    ? importFile.name
                    : "Drag and drop your Excel file here or click to browse"}
                </p>

                <input
                  type="file"
                  id="file-upload"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 cursor-pointer transition-colors"
                >
                  Browse Files
                </label>

                <p className="text-xs text-gray-500 mt-3">
                  Only Excel files (.xlsx, .xls) are accepted
                </p>
              </div>

              {importErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-700 mb-2">Import Errors:</h4>
                  <ul className="text-sm text-red-600 list-disc pl-5 space-y-1">
                    {importErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Download className="w-4 h-4" />
                <button
                  onClick={handleDownloadTemplate}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Download template file
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setImportErrors([]);
                }}
                className="px-6 py-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>

              <button
                onClick={handleImportSubmit}
                disabled={!importFile || isProcessing}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all font-medium shadow-lg disabled:shadow-none flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Importing...
                  </>
                ) : (
                  "Import Bonuses"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateNewBonus;