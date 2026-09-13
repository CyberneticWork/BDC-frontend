import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Eye, Download, Filter, ChevronDown } from 'lucide-react';
import { fetchCompanies, fetchDepartmentsById } from '@services/ApiDataService';
import { getProcessedSalaries } from '@services/SalaryProcessService';
import Swal from 'sweetalert2';
import { downloadPayslip, downloadPayslips } from '../../utils/payslipPdf';

const notify = {
  success: (title, text) => Swal.fire({ icon: 'success', title, text, confirmButtonColor: '#3085d6' }),
  error: (title, text) => Swal.fire({ icon: 'error', title, text, confirmButtonColor: '#d33' }),
  warning: (title, text) => Swal.fire({ icon: 'warning', title, text, confirmButtonColor: '#f59e0b' }),
  info: (title, text) => Swal.fire({ icon: 'info', title, text, confirmButtonColor: '#3085d6' }),
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SalaryRecords = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    loadSalaryRecords();
  }, []);


  const loadCompanies = async () => {
    try {
      const data = await fetchCompanies();
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleCompanyChange = async (e) => {
    const companyId = e.target.value;
    setSelectedCompany(companyId);
    setSelectedDepartment('');
    
    if (companyId) {
      try {
        const depts = await fetchDepartmentsById(companyId);
        setDepartments(depts || []);
      } catch (error) {
        console.error('Error loading departments:', error);
      }
    } else {
      setDepartments([]);
    }
  };

  const loadSalaryRecords = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedCompany) params.company_name = companies.find(c => c.id == selectedCompany)?.name || '';
      if (selectedDepartment) params.department_name = departments.find(d => d.id == selectedDepartment)?.name || '';
      if (searchTerm) params.search = searchTerm;

      const data = await getProcessedSalaries(params);
      const salaryRecords = (data?.data || data || []).map((emp) => ({
        id: emp.id,
        emp_no: emp.emp_no || emp.employee_no || 'N/A',
        full_name: emp.full_name || 'N/A',
        company_name: emp.company_name || 'N/A',
        department_name: emp.department_name || 'N/A',
        basic_salary: parseFloat(emp.basic_salary || 0),
        status: emp.status || 'Active',
        net_salary: parseFloat(emp.salary_breakdown?.net_salary || 0),
        gross_salary: parseFloat(emp.salary_breakdown?.gross_salary || 0),
        total_deductions: parseFloat(emp.salary_breakdown?.total_deductions || 0),
        salary_breakdown: emp.salary_breakdown || {},
        compensation: emp.compensation || {},
      }));

      setRecords(salaryRecords);
      setFilteredRecords(salaryRecords);
    } catch (error) {
      console.error('Error loading salary records:', error);
      notify.error('Load Failed', 'Error loading salary records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const filtered = records.filter((record) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        record.emp_no.toLowerCase().includes(searchLower) ||
        record.full_name.toLowerCase().includes(searchLower)
      );
    });
    setFilteredRecords(filtered);
  }, [searchTerm, records]);

  const handleViewDetails = (record) => {
    Swal.fire({
      title: `${record.full_name} - Salary Details`,
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p><strong>Employee ID:</strong> ${record.emp_no}</p>
          <p><strong>Company:</strong> ${record.company_name}</p>
          <p><strong>Department:</strong> ${record.department_name}</p>
          <p><strong>Basic Salary:</strong> Rs. ${record.basic_salary.toLocaleString()}</p>
          <p><strong>Gross Salary:</strong> Rs. ${record.gross_salary.toLocaleString()}</p>
          <p><strong>Total Deductions:</strong> Rs. ${record.total_deductions.toLocaleString()}</p>
          <p><strong>Net Salary:</strong> Rs. ${record.net_salary.toLocaleString()}</p>
          <p><strong>Status:</strong> ${record.status}</p>
        </div>
      `,
      confirmButtonText: 'Close',
    });
  };

  const handleDownloadPayslip = (record) => {
    try {
      downloadPayslip(record);
      notify.success('Success', 'Payslip downloaded (half A4, left side)');
    } catch (error) {
      console.error('Error generating payslip:', error);
      notify.error('Download Failed', 'Error generating payslip');
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Salary Records</h1>
          <p className="text-gray-600">View and manage employee salary records</p>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Records
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Company Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              <select
                value={selectedCompany}
                onChange={handleCompanyChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Companies</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={!selectedCompany}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {months.map((m) => (
                  <option key={m.value} value={parseInt(m.value)}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={loadSalaryRecords}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Employee</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Company/Dept</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Basic Salary</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Net Salary</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRecords.map((record, index) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{record.full_name}</p>
                          <p className="text-sm text-gray-500">{record.emp_no}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{record.company_name}</p>
                          <p className="text-sm text-gray-500">{record.department_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-gray-900">Rs. {record.basic_salary.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-green-600">Rs. {record.net_salary.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(record)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPayslip(record)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download Payslip"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 text-lg">No salary records found</p>
              <p className="text-gray-400 text-sm mt-2">Select filters and click Refresh to load records</p>
            </div>
          )}
        </div>

        {/* Summary */}
        {filteredRecords.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <p className="text-sm text-gray-600 mb-2">Total Records</p>
              <p className="text-3xl font-bold text-gray-900">{filteredRecords.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <p className="text-sm text-gray-600 mb-2">Total Basic Salary</p>
              <p className="text-3xl font-bold text-blue-600">
                Rs. {filteredRecords.reduce((sum, r) => sum + r.basic_salary, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <p className="text-sm text-gray-600 mb-2">Total Net Salary</p>
              <p className="text-3xl font-bold text-green-600">
                Rs. {filteredRecords.reduce((sum, r) => sum + r.net_salary, 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryRecords;
