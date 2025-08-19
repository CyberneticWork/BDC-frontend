import React, { useState, useEffect } from 'react';
import { Building2, Users, UserCheck, Calendar, Edit2, Trash2, Search, Filter, ChevronDown, ChevronRight, Plus, ChevronLeft } from 'lucide-react';
import {
  fetchCompanies,
  fetchDepartments,
  fetchSubDepartments,
  createCompany,
  updateCompany,
  deleteCompany,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createSubDepartment,
  updateSubDepartment,
  deleteSubDepartment,
} from '../../services/ApiDataService';
import Swal from "sweetalert2";

// EditModal
const EditModal = ({
  show,
  companyForm,
  setCompanyForm,
  editingCompany,
  setShowAddModal,
  setCompanies,
  companies,
  refreshAll
}) => {
  const [localForm, setLocalForm] = React.useState(companyForm);
  const [errors, setErrors] = React.useState({});

  const isAddMode = !editingCompany;

  React.useEffect(() => {
    if (show) setLocalForm(companyForm);
    setErrors({});
  }, [show, companyForm]);

  if (!show) return null;

  const validateEstablished = (value) => {
    if (value === undefined || value === null || String(value).trim() === "") return true;
    const year = Number(value);
    const currentYear = new Date().getFullYear();
    return /^\d{4}$/.test(String(value)) && year >= 1900 && year <= currentYear;
  };

  // Field-level validation
  const validateFields = () => {
    const newErrors = {};
    if (!localForm.name || !localForm.name.trim()) {
      newErrors.name = "Company name is required.";
    }
    if (!localForm.location || !localForm.location.trim()) {
      newErrors.location = "Location is required.";
    }
    if (
      localForm.established &&
      !validateEstablished(localForm.established)
    ) {
      newErrors.established = "Established year must be a valid 4-digit year, not in the future, and positive.";
    }
    return newErrors;
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {isAddMode ? "Add Company" : "Edit Company"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={localForm.name}
              onChange={e => setLocalForm({ ...localForm, name: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={localForm.location}
              onChange={e => setLocalForm({ ...localForm, location: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.location ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {errors.location && <div className="text-red-600 text-sm mt-1">{errors.location}</div>}
          </div>
          {/* Employees field hidden from UI */}
          <div style={{ display: "none" }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employees</label>
            <input
              type="number"
              value={localForm.employees === null || localForm.employees === "" ? 0 : localForm.employees}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Established</label>
            <input
              type="text"
              value={localForm.established}
              onChange={e => {
                // Only allow up to 4 digits, no non-numeric characters
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setLocalForm({ ...localForm, established: val });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. 2005"
              maxLength={4}
              inputMode="numeric"
              pattern="\d{4}"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setShowAddModal(false)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              const fieldErrors = validateFields();
              if (Object.keys(fieldErrors).length > 0) {
                setErrors(fieldErrors);
                return;
              }
              setErrors({});
              const payload = {
                ...localForm,
                established: localForm.established ? Number(localForm.established) : null,
              };
              try {
                if (editingCompany) {
                  await updateCompany(editingCompany.id, payload);
                  Swal.fire({
                    icon: "success",
                    title: "Company updated successfully!",
                    timer: 1500,
                    showConfirmButton: false,
                  });
                } else {
                  await createCompany(payload);
                  Swal.fire({
                    icon: "success",
                    title: "Company added successfully!",
                    timer: 1500,
                    showConfirmButton: false,
                  });
                }
                setShowAddModal(false);
                await refreshAll?.();
              } catch (error) {
                const res = error?.response?.data;
                if (res?.errors) {
                  setErrors({
                    ...fieldErrors,
                    ...res.errors
                  });
                } else if (res?.message) {
                  Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: res.message,
                  });
                } else {
                  Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "An unexpected error occurred.",
                  });
                }
              }
            }}
            className={`px-4 py-2 ${isAddMode ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors`}
          >
            {isAddMode ? "Add Company" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Department = () => {
  const [activeTab, setActiveTab] = useState('companies');
  // Separate search terms for each tab
  const [companySearch, setCompanySearch] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [subdepartmentSearch, setSubdepartmentSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [modalMode, setModalMode] = useState('add');
  const [editingCompany, setEditingCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    location: '',
    employees: '',
    established: ''
  });
  const [deptForm, setDeptForm] = useState({
    company_id: '',
    name: '',
    code: '',
    employees: ''
  });
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Subdepartment modal state
  const [showAddSubDeptModal, setShowAddSubDeptModal] = useState(false);
  const [showEditSubDeptModal, setShowEditSubDeptModal] = useState(false);
  const [editingSubDept, setEditingSubDept] = useState(null);

  // Pagination state
  const [companiesPage, setCompaniesPage] = useState(1);
  const [departmentsPage, setDepartmentsPage] = useState(1);
  const [subdepartmentsPage, setSubdepartmentsPage] = useState(1);
  const rowsPerPage = 7;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchCompanies(),
      fetchDepartments(),
      fetchSubDepartments()
    ]).then(([companiesData, departmentsData, subDepartmentsData]) => {
      setCompanies(companiesData);
      setDepartments(departmentsData);
      setSubDepartments(subDepartmentsData);
      setLoading(false);
    });
  }, []);

  // Merge subdepartments into departments
  const departmentsWithSubs = departments.map(dept => ({
    ...dept,
    subdepartments: subDepartments.filter(sub => sub.department_id === dept.id)
  }));

  // Merge departments into companies
  const companiesWithDeps = companies.map(company => ({
    ...company,
    departments: departmentsWithSubs.filter(dept => dept.company_id === company.id)
  }));

  function toggleRowExpansion(id) {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  }

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const ActionButton = ({ icon: Icon, onClick, variant = 'primary' }) => {
    const variants = {
      primary: 'text-blue-600 hover:bg-blue-50',
      danger: 'text-red-600 hover:bg-red-50'
    };
    return (
      <button
        onClick={onClick}
        className={`p-2 rounded-lg transition-colors ${variants[variant]}`}
      >
        <Icon className="w-4 h-4" />
      </button>
    );
  };

  // Helper to get/set search term based on active tab
  const getSearchTerm = () => {
    if (activeTab === 'companies') return companySearch;
    if (activeTab === 'departments') return departmentSearch;
    if (activeTab === 'subdepartments') return subdepartmentSearch;
    return '';
  };
  const setSearchTerm = (val) => {
    if (activeTab === 'companies') setCompanySearch(val);
    if (activeTab === 'departments') setDepartmentSearch(val);
    if (activeTab === 'subdepartments') setSubdepartmentSearch(val);
  };

  // Filtering logic per tab
  const normalize = (v) => String(v || '').toLowerCase().trim();
  const matchName = (name, term) => {
    const n = normalize(name);
    const t = normalize(term);
    if (!t) return true;
    if (t.length === 1) return n.charAt(0) === t;
    return n.includes(t);
  };

  const filteredCompanies = companySearch
    ? companies.filter(company => matchName(company.name, companySearch))
    : companies;

  const filteredDepartmentsData = departmentSearch
    ? departmentsWithSubs.filter(dept => matchName(dept.name, departmentSearch))
    : departmentsWithSubs;

  // Only include companies that have matching departments when filtering
  const filteredCompaniesWithDeps = companies.map(company => ({
     ...company,
     departments: filteredDepartmentsData.filter(dept => dept.company_id === company.id)
   })).filter(company => company.departments.length > 0);

  const filteredSubdepartments = subdepartmentSearch
    ? subDepartments.filter(subdept => matchName(subdept.name, subdepartmentSearch))
    : subDepartments;

  // Only include companies and departments that have matching subdepartments
  const filteredCompaniesWithSubdepts = companies.map(company => {
    const depts = departments.filter(dept => dept.company_id === company.id);
    return {
      ...company,
      departments: depts.map(dept => ({
         ...dept,
         subdepartments: filteredSubdepartments.filter(sub => sub.department_id === dept.id)
       })).filter(dept => dept.subdepartments.length > 0)
     };
   }).filter(company => company.departments.length > 0);

  const CompaniesTable = () => {
    // Paginate the data
    const paginatedCompanies = filteredCompanies.slice(
      (companiesPage - 1) * rowsPerPage,
      companiesPage * rowsPerPage
    );
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table header remains the same */}
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employees</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Established</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{company.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.employees}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.established}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <ActionButton
                        icon={Edit2}
                        onClick={() => {
                          setModalMode('edit');
                          setEditingCompany(company);
                          setCompanyForm({
                            name: company.name || '',
                            location: company.location || '',
                            employees: company.employees || '',
                            established: company.established || ''
                          });
                          setShowAddModal(true);
                        }}
                      />
                      <ActionButton
                        icon={Trash2}
                        onClick={async () => {
                          const result = await Swal.fire({
                            title: "Are you sure?",
                            text: "This action cannot be undone!",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#d33",
                            cancelButtonColor: "#3085d6",
                            confirmButtonText: "Yes, delete it!",
                          });
                          if (result.isConfirmed) {
                            await deleteCompany(company.id);
                            Swal.fire({
                              icon: "success",
                              title: "Deleted!",
                              text: "Company has been deleted.",
                              timer: 1500,
                              showConfirmButton: false,
                            });
                            await refreshAll(); // <-- refresh after delete
                          }
                        }}
                        variant="danger"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={companiesPage} 
          totalItems={filteredCompanies.length} 
          onPageChange={setCompaniesPage} 
        />
      </div>
    );
  };

  const DepartmentsTable = () => {
    // Get flattened departments for pagination
    const flattenedDepartments = filteredCompaniesWithDeps.flatMap(company => 
      company.departments.map(dept => ({ ...dept, companyName: company.name, companyId: company.id }))
    );
    
    // Paginate the data
    const paginatedDepartments = flattenedDepartments.slice(
      (departmentsPage - 1) * rowsPerPage,
      departmentsPage * rowsPerPage
    );
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                {/* <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th> */}
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employees</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subdepartments</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedDepartments.map((dept) => (
                <React.Fragment key={`${dept.companyId}-${dept.id}`}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleRowExpansion(`${dept.companyId}-${dept.id}`)}
                          className="mr-2 p-1 hover:bg-gray-200 rounded"
                        >
                          {expandedRows.has(`${dept.companyId}-${dept.id}`) ?
                            <ChevronDown className="w-4 h-4" /> :
                            <ChevronRight className="w-4 h-4" />
                          }
                        </button>
                        <Users className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{dept.name}</div>
                          <div className="text-sm text-gray-500">{dept.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.companyName}</td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.manager}</td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dept.employees}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.subdepartments.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <ActionButton icon={Edit2} onClick={() => {setEditingDept(dept);setShowEditDeptModal(true);}} />
                        <ActionButton
                          icon={Trash2}
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: "Are you sure?",
                              text: "This action cannot be undone!",
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#d33",
                              cancelButtonColor: "#3085d6",
                              confirmButtonText: "Yes, delete it!",
                            });
                            if (result.isConfirmed) {
                              try {
                                await deleteDepartment(dept.id);
                                Swal.fire({
                                  icon: "success",
                                  title: "Deleted!",
                                  text: "Department has been deleted.",
                                  timer: 1500,
                                  showConfirmButton: false,
                                });
                                await refreshAll(); // <-- refresh after delete
                              } catch (error) {
                                Swal.fire({
                                  icon: "error",
                                  title: "Error",
                                  text: error?.response?.data?.message || "Failed to delete department.",
                                });
                              }
                            }
                          }}
                          variant="danger"
                        />
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(`${dept.companyId}-${dept.id}`) && dept.subdepartments.map(subdept => (
                    <tr key={subdept.id} className="bg-gray-25 border-l-4 border-blue-200">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center pl-8">
                          <UserCheck className="w-4 h-4 text-gray-400 mr-3" />
                          <div className="text-sm font-medium text-gray-700">{subdept.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">-</td>
                      {/* <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{subdept.manager}</td> */}
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{subdept.employees}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">-</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium">
                        {/* Hide edit/delete for sub-departments shown inline under departments.
                            Full edit/delete remains available in the Subdepartments tab. */}
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">-</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={departmentsPage} 
          totalItems={flattenedDepartments.length} 
          onPageChange={setDepartmentsPage} 
        />
      </div>
    );
  };

  // Add Department Modal
  const AddDepartmentModal = () => {
    const [localDeptForm, setLocalDeptForm] = React.useState(deptForm);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
      if (showAddDeptModal) {
        setLocalDeptForm(deptForm);
        setError("");
      }
    }, [showAddDeptModal, deptForm]);

    if (!showAddDeptModal) return null;

    // Validation function
    const validate = () => {
      if (!localDeptForm.company_id) {
        return "Please select a company.";
      }
      if (!localDeptForm.name.trim()) {
        return "Department name is required.";
      }
      if (localDeptForm.name.trim().length < 2) {
        return "Department name must be at least 2 characters.";
      }
      if (localDeptForm.name.trim().length > 50) {
        return "Department name must be less than 50 characters.";
      }
      return "";
    };

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Add New Department</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select
                value={localDeptForm.company_id}
                onChange={e => setLocalDeptForm({ ...localDeptForm, company_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
              <input
                type="text"
                value={localDeptForm.name}
                onChange={e => setLocalDeptForm({ ...localDeptForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={50}
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAddDeptModal(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const validationError = validate();
                if (validationError) {
                  setError(validationError);
                  return;
                }
                setError("");
                try {
                  const newDept = await createDepartment({
                    company_id: localDeptForm.company_id,
                    name: localDeptForm.name,
                  });
                  setDepartments([...departments, newDept]);
                  setDeptForm({
                    company_id: '',
                    name: '',
                    code: '',
                    employees: ''
                  });
                  setShowAddDeptModal(false);
                  Swal.fire({
                    icon: "success",
                    title: "Department added successfully!",
                    timer: 1500,
                    showConfirmButton: false,
                  });
                  await refreshAll();
                } catch (error) {
                  Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error?.response?.data?.message || "Failed to add department.",
                  });
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Department
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Edit Department Modal
  const EditDepartmentModal = () => {
    const [localEditingDept, setLocalEditingDept] = React.useState(editingDept);

    React.useEffect(() => {
      if (showEditDeptModal && editingDept) setLocalEditingDept(editingDept);
    }, [showEditDeptModal, editingDept]);

    if (!showEditDeptModal || !localEditingDept) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Edit Department</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select
                value={localEditingDept.company_id}
                onChange={e => setLocalEditingDept({ ...localEditingDept, company_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
              <input
                type="text"
                value={localEditingDept.name}
                onChange={e => setLocalEditingDept({ ...localEditingDept, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
              <input
                type="text"
                value={localEditingDept.code}
                onChange={e => setLocalEditingDept({ ...localEditingDept, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employees</label>
              <input
                type="number"
                value={localEditingDept.employees}
                onChange={e => setLocalEditingDept({ ...localEditingDept, employees: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div> */}
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowEditDeptModal(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  const updatedDept = await updateDepartment(localEditingDept.id, {
                    company_id: localEditingDept.company_id,
                    name: localEditingDept.name,
                  });
                  setDepartments(departments.map(dept =>
                    dept.id === localEditingDept.id ? updatedDept : dept
                  ));
                  setShowEditDeptModal(false);
                  Swal.fire({
                    icon: "success",
                    title: "Department updated successfully!",
                    timer: 1500,
                    showConfirmButton: false,
                  });
                  await refreshAll(); // <-- refresh after edit
                } catch (error) {
                  Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error?.response?.data?.message || "Failed to update department.",
                  });
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Subdepartment Modals ---
  const AddSubDeptModal = ({
    show,
    companies,
    departments,
    onClose,
    onCreate,
  }) => {
    const [form, setForm] = React.useState({
      company_id: "",
      department_id: "",
      name: "",
    });
    const [error, setError] = React.useState("");

    React.useEffect(() => {
      if (!show) {
        setForm({ company_id: "", department_id: "", name: "" });
        setError("");
      }
    }, [show]);

    // Filter departments based on selected company
    const filteredDepartments = form.company_id
      ? departments.filter((d) => String(d.company_id) === String(form.company_id))
      : [];

    if (!show) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-opacity-30">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Add Sub Department</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select
                value={form.company_id}
                onChange={e => setForm({ ...form, company_id: e.target.value, department_id: "" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={form.department_id}
                onChange={e => setForm({ ...form, department_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={!form.company_id}
              >
                <option value="">Select Department</option>
                {filteredDepartments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub Department Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value.replace(/[^a-zA-Z0-9\s]/g, "") })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter sub department name"
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg">Cancel</button>
            <button
              onClick={async () => {
                if (!form.company_id || !form.department_id || !form.name.trim()) {
                  setError("All fields are required.");
                  return;
                }
                setError("");
                await onCreate(form);
                await refreshAll();
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg"
            >
              Add Sub Department
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EditSubDeptModal = ({
    show,
    companies,
    departments,
    subDept,
    onClose,
    onUpdate,
  }) => {
    const [form, setForm] = React.useState(subDept || {
      company_id: "",
      department_id: "",
      name: "",
    });
    const [error, setError] = React.useState("");

    React.useEffect(() => {
      if (show && subDept) setForm(subDept);
      if (!show) setError("");
    }, [show, subDept]);

    const filteredDepartments = form.company_id
      ? departments.filter((d) => String(d.company_id) === String(form.company_id))
      : [];

    if (!show) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Edit Sub Department</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select
                value={form.company_id}
                onChange={e => setForm({ ...form, company_id: e.target.value, department_id: "" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={form.department_id}
                onChange={e => setForm({ ...form, department_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!form.company_id}
              >
                <option value="">Select Department</option>
                {filteredDepartments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub Department Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value.replace(/[^a-zA-Z0-9\s]/g, "") })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter sub department name"
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!form.company_id || !form.department_id || !form.name.trim()) {
                  setError("All fields are required.");
                  return;
                }
                setError("");
                await onUpdate(form);
                await refreshAll(); // <-- refresh after edit
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Subdepartment handlers ---
  const refreshAll = async () => {
    const [companiesData, departmentsData, subDepartmentsData] = await Promise.all([
      fetchCompanies(),
      fetchDepartments(),
      fetchSubDepartments(),
    ]);
    setCompanies(companiesData);
    setDepartments(departmentsData);
    setSubDepartments(subDepartmentsData);
  };

  const handleCreateSubDept = async (form) => {
    try {
      // Check for duplicate sub department name in the same department of the same company
      const duplicate = subDepartments.some(
        (sd) =>
          String(sd.department_id) === String(form.department_id) &&
          sd.name.trim().toLowerCase() === form.name.trim().toLowerCase()
      );
      if (duplicate) {
        Swal.fire({
          icon: "error",
          title: "Duplicate Sub Department",
          text: "A sub department with this name already exists in the selected department.",
        });
        return;
      }

      const payload = {
        department_id: form.department_id,
        name: form.name,
      };
      await createSubDepartment(payload);
      await refreshAll();
      setShowAddSubDeptModal(false);
      Swal.fire({
        icon: "success",
        title: "Sub Department added successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to add sub department.",
      });
    }
  };

  const handleUpdateSubDept = async (form) => {
    try {
      const payload = {
        department_id: form.department_id,
        name: form.name,
      };
      await updateSubDepartment(form.id, payload);
      await refreshAll();
      setShowEditSubDeptModal(false);
      Swal.fire({
        icon: "success",
        title: "Sub Department updated successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to update sub department.",
      });
    }
  };

  const handleDeleteSubDept = async (id) => {
    try {
      await deleteSubDepartment(id);
      await refreshAll();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Sub Department has been deleted.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to delete sub department.",
      });
    }
  };

  // --- SubdepartmentsTable with working edit button ---
  const SubdepartmentsTable = () => {
    // Get flattened subdepartments for pagination
    const flattenedSubdepartments = filteredCompaniesWithSubdepts.flatMap(company =>
      company.departments.flatMap(dept =>
        dept.subdepartments.map(subdept => ({
          ...subdept,
          departmentName: dept.name,
          departmentCode: dept.code,
          companyName: company.name
        }))
      )
    );
    
    // Paginate the data
    const paginatedSubdepartments = flattenedSubdepartments.slice(
      (subdepartmentsPage - 1) * rowsPerPage,
      subdepartmentsPage * rowsPerPage
    );
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subdepartment</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NO Of Employees</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSubdepartments.map((subdept) => (
                <tr key={subdept.id} className="hover:bg-gray-50 transition-colors">
                  {/* Replace nested references with the flattened data */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserCheck className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{subdept.name}</div>
                        <div className="text-sm text-gray-500">SD{subdept.id.toString().padStart(3, '0')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{subdept.departmentName}</div>
                    <div className="text-sm text-gray-500">{subdept.departmentCode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subdept.companyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className=" px-8 py-1 text-sm text-gray-900">{subdept.employees}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      subdept.employees > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {subdept.employees > 0 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <ActionButton
                        icon={Edit2}
                        onClick={() => {
                          // The issue is here - we need to find the parent department using the department_id from subdept
                          const parentDept = departments.find(d => d.id === subdept.department_id);
                          if (parentDept) {
                            setEditingSubDept({
                              ...subdept,
                              company_id: parentDept.company_id,
                              department_id: subdept.department_id,
                            });
                            setShowEditSubDeptModal(true);
                          } else {
                            Swal.fire({
                              icon: "error",
                              title: "Error",
                              text: "Could not find parent department information.",
                            });
                          }
                        }}
                      />
                      <ActionButton
                        icon={Trash2}
                        onClick={async () => {
                          const result = await Swal.fire({
                            title: "Are you sure?",
                            text: "This action cannot be undone!",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#d33",
                            cancelButtonColor: "#3085d6",
                            confirmButtonText: "Yes, delete it!",
                          });
                          if (result.isConfirmed) {
                            try {
                              await deleteSubDepartment(subdept.id);
                              Swal.fire({
                                icon: "success",
                                title: "Deleted!",
                                text: "Sub Department has been deleted.",
                                timer: 1500,
                                showConfirmButton: false,
                              });
                              await refreshAll(); // <-- refresh after delete
                            } catch (error) {
                              Swal.fire({
                                icon: "error",
                                title: "Error",
                                text: error?.response?.data?.message || "Failed to delete sub department.",
                              });
                            }
                          }
                        }}
                        variant="danger"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={subdepartmentsPage} 
          totalItems={flattenedSubdepartments.length} 
          onPageChange={setSubdepartmentsPage} 
        />
      </div>
    );
  };

  const Pagination = ({ currentPage, totalItems, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(currentPage * rowsPerPage, totalItems)}
              </span>{" "}
              of <span className="font-medium">{totalItems}</span> results
            </p>
          </div>
          <div>
            <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 border ${
                    page === currentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  } text-sm font-medium`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    // Reset pagination when changing tabs
    setCompaniesPage(1);
    setDepartmentsPage(1);
    setSubdepartmentsPage(1);
  }, [activeTab]);

  // Also reset pagination when search terms change
  useEffect(() => {
    setCompaniesPage(1);
  }, [companySearch]);

  useEffect(() => {
    setDepartmentsPage(1);
  }, [departmentSearch]);

  useEffect(() => {
    setSubdepartmentsPage(1);
  }, [subdepartmentSearch]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Loading Spinner */}
      {loading && (
        <div className="flex items-center justify-center min-h-[300px]">
          <svg className="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
        </div>
      )}
      {!loading && (
        <>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Department Management</h1>
            <p className="text-gray-600">
              Manage your organization's structure including companies, departments, and subdepartments.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard 
              icon={Building2} 
              title="Total Companies" 
              value={companies.length} 
              color="bg-blue-500" 
            />
            <StatCard 
              icon={Users} 
              title="Total Departments" 
              value={departments.length} 
              color="bg-green-500" 
            />
            <StatCard 
              icon={UserCheck} 
              title="Subdepartments" 
              value={subDepartments.length} 
              color="bg-purple-500" 
            />
            {/* Stat card for employees */}
            <StatCard 
              icon={Calendar} 
              title="Total Employees" 
              value={companies.reduce((sum, c) => sum + (parseInt(c.employees) || 0), 0)} 
              color="bg-orange-500" 
            />
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-6">
            {[
              { key: 'companies', label: 'Companies', icon: Building2 },
              { key: 'departments', label: 'Departments', icon: Users },
              { key: 'subdepartments', label: 'Subdepartments', icon: UserCheck }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={getSearchTerm()}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {/* Close button */}
                {getSearchTerm() && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    onClick={() => setSearchTerm('')}
                    aria-label="Clear search"
                  >
                    &#10005;
                  </button>
                )}
              </div>
              {/* Search button (replaces Filter) */}
              {/* <button
                className="flex items-center px-3 py-2 bg-indigo-600 text-white border border-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                onClick={() => setSearchTerm(getSearchTerm())}
                type="button"
              >
                <Search className="w-4 h-4 mr-2 text-white" />
                Search
              </button> */}
              {/* Add buttons based on activeTab */}
              {activeTab === 'companies' && (
                <button
                  onClick={() => {
                    setModalMode('add');
                    setCompanyForm({ name: '', location: '', employees: '', established: '' });
                    setShowAddModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Company
                </button>
              )}
              {activeTab === 'departments' && (
                <button
                  onClick={() => setShowAddDeptModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Department
                </button>
              )}
              {activeTab === 'subdepartments' && (
                <button
                  onClick={() => setShowAddSubDeptModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Sub Department
                </button>
              )}
            </div>
          </div>
          {/* Tables */}
          {activeTab === 'companies' && <CompaniesTable />}
          {activeTab === 'departments' && <DepartmentsTable />}
          {activeTab === 'subdepartments' && <SubdepartmentsTable />}
          {/* Edit Modal */}
          <EditModal
            show={showAddModal}
            companyForm={companyForm}
            setCompanyForm={setCompanyForm}
            editingCompany={editingCompany}
            setShowAddModal={setShowAddModal}
            setCompanies={setCompanies}
            companies={companies}
            refreshAll={refreshAll} // <-- pass it
          />

          {/* Add Department Modal */}
          <AddDepartmentModal />

          {/* Edit Department Modal */}
          <EditDepartmentModal />

          {/* Add Subdepartment Modal */}
          <AddSubDeptModal
            show={showAddSubDeptModal}
            companies={companies}
            departments={departments}
            onClose={() => setShowAddSubDeptModal(false)}
            onCreate={handleCreateSubDept}
          />
          {/* Edit Subdepartment Modal */}
          <EditSubDeptModal
            show={showEditSubDeptModal}
            companies={companies}
            departments={departments}
            subDept={editingSubDept}
            onClose={() => {
              setShowEditSubDeptModal(false);
              setEditingSubDept(null);
            }}
            onUpdate={handleUpdateSubDept}
          />
        </>
      )}
    </div>
  );
};

export default Department;