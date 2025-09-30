import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  Upload,
  Filter,
  Calendar,
  DollarSign,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

const BankReconciliation = () => {
  const [reconciliations, setReconciliations] = useState([]);
  const [filteredReconciliations, setFilteredReconciliations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sample data - replace with actual API calls
  const sampleReconciliations = [
    {
      id: 1,
      bankAccount: "Commercial Bank - Current Account",
      accountNumber: "8001234567",
      reconciliationDate: "2024-09-30",
      statementBalance: 125000.00,
      bookBalance: 123500.00,
      difference: 1500.00,
      status: "pending",
      outstandingDeposits: 2500.00,
      outstandingChecks: 1000.00,
      createdBy: "John Doe",
      createdDate: "2024-09-30",
    },
    {
      id: 2,
      bankAccount: "Peoples Bank - Savings Account",
      accountNumber: "5001987654",
      reconciliationDate: "2024-09-29",
      statementBalance: 85000.00,
      bookBalance: 85000.00,
      difference: 0.00,
      status: "reconciled",
      outstandingDeposits: 0.00,
      outstandingChecks: 0.00,
      createdBy: "Jane Smith",
      createdDate: "2024-09-29",
    },
    {
      id: 3,
      bankAccount: "Bank of Ceylon - Current Account",
      accountNumber: "3007654321",
      reconciliationDate: "2024-09-28",
      statementBalance: 67500.00,
      bookBalance: 68200.00,
      difference: -700.00,
      status: "discrepancy",
      outstandingDeposits: 1200.00,
      outstandingChecks: 1900.00,
      createdBy: "Mike Johnson",
      createdDate: "2024-09-28",
    },
  ];

  useEffect(() => {
    // Initialize with sample data
    setReconciliations(sampleReconciliations);
    setFilteredReconciliations(sampleReconciliations);
  }, []);

  useEffect(() => {
    let filtered = reconciliations;

    if (searchTerm) {
      filtered = filtered.filter(
        (rec) =>
          rec.bankAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rec.accountNumber.includes(searchTerm) ||
          rec.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedBank) {
      filtered = filtered.filter((rec) => rec.bankAccount === selectedBank);
    }

    if (selectedStatus) {
      filtered = filtered.filter((rec) => rec.status === selectedStatus);
    }

    setFilteredReconciliations(filtered);
  }, [searchTerm, selectedBank, selectedStatus, reconciliations]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "reconciled":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "discrepancy":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "reconciled":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "discrepancy":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const uniqueBanks = [...new Set(reconciliations.map(rec => rec.bankAccount))];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bank Reconciliation</h1>
            <p className="text-gray-600">
              Reconcile bank statements with book records
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Reconciliation
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search reconciliations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Banks</option>
            {uniqueBanks.map(bank => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reconciled">Reconciled</option>
            <option value="discrepancy">Discrepancy</option>
          </select>
          <div className="flex gap-2">
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Reconciliations</p>
              <p className="text-2xl font-bold text-gray-900">{reconciliations.length}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reconciled</p>
              <p className="text-2xl font-bold text-green-600">
                {reconciliations.filter(r => r.status === 'reconciled').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {reconciliations.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Discrepancies</p>
              <p className="text-2xl font-bold text-red-600">
                {reconciliations.filter(r => r.status === 'discrepancy').length}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Reconciliations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bank Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reconciliation Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statement Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReconciliations.map((reconciliation) => (
                <tr key={reconciliation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {reconciliation.bankAccount}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reconciliation.accountNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(reconciliation.reconciliationDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(reconciliation.statementBalance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(reconciliation.bookBalance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${
                      reconciliation.difference === 0 
                        ? 'text-green-600' 
                        : reconciliation.difference > 0 
                          ? 'text-blue-600' 
                          : 'text-red-600'
                    }`}>
                      {formatCurrency(reconciliation.difference)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusClass(reconciliation.status)}`}>
                      {getStatusIcon(reconciliation.status)}
                      {reconciliation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reconciliation.createdBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedReconciliation(reconciliation)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredReconciliations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No bank reconciliations found.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal would go here */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">New Bank Reconciliation</h3>
            <p className="text-gray-600 mb-4">
              Bank reconciliation form would be implemented here.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankReconciliation;