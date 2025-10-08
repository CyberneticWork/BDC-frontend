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
import { useResponsive } from '../../hooks/useResponsive';
import {
  ResponsivePageWrapper,
  ResponsiveCard,
  ResponsiveGrid,
  ResponsiveTable,
  ResponsiveTableHeader,
  ResponsiveTableHeaderCell,
  ResponsiveTableBody,
  ResponsiveTableRow,
  ResponsiveTableCell,
  ResponsiveButton,
  ResponsiveFormGroup,
  ResponsiveInput,
  ResponsiveSelect,
  ResponsiveLoadingSpinner,
  ResponsiveBadge,
  ResponsiveModal
} from '../../components/Accounting/ResponsiveAccountingComponents';

const BankReconciliation = () => {
  const responsive = useResponsive();
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

  const actions = (
    <ResponsiveButton 
      variant="primary" 
      size={responsive.isMobile ? 'sm' : 'md'}
      onClick={() => setShowAddModal(true)}
    >
      <Plus className="h-4 w-4" />
      {responsive.isMobile ? '' : 'New Reconciliation'}
    </ResponsiveButton>
  );

  return (
    <ResponsivePageWrapper 
      title="Bank Reconciliation" 
      subtitle="Reconcile bank statements with book records"
      actions={actions}
    >
      {/* Filters */}
      <ResponsiveCard className="mb-4 sm:mb-6">
        <ResponsiveGrid 
          cols={responsive.isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} 
          gap="gap-4"
        >
          <ResponsiveFormGroup>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <ResponsiveInput
                type="text"
                placeholder="Search reconciliations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </ResponsiveFormGroup>
          <ResponsiveFormGroup>
            <ResponsiveSelect
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
            >
              <option value="">All Banks</option>
              {uniqueBanks.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </ResponsiveSelect>
          </ResponsiveFormGroup>
          <ResponsiveFormGroup>
            <ResponsiveSelect
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reconciled">Reconciled</option>
              <option value="discrepancy">Discrepancy</option>
            </ResponsiveSelect>
          </ResponsiveFormGroup>
          <ResponsiveFormGroup>
            <div className="flex gap-2">
              <ResponsiveButton variant="outline" size="sm" className="flex-1">
                <Download className="h-4 w-4" />
                {responsive.isMobile ? '' : 'Export'}
              </ResponsiveButton>
              <ResponsiveButton variant="outline" size="sm" className="flex-1">
                <Upload className="h-4 w-4" />
                {responsive.isMobile ? '' : 'Import'}
              </ResponsiveButton>
            </div>
          </ResponsiveFormGroup>
        </ResponsiveGrid>
      </ResponsiveCard>

      {/* Statistics Cards */}
      <ResponsiveGrid 
        cols={responsive.isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} 
        gap="gap-4 sm:gap-6" 
        className="mb-4 sm:mb-6"
      >
        <ResponsiveCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Total Reconciliations</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{reconciliations.length}</p>
            </div>
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0 ml-2" />
          </div>
        </ResponsiveCard>
        <ResponsiveCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Reconciled</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                {reconciliations.filter(r => r.status === 'reconciled').length}
              </p>
            </div>
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0 ml-2" />
          </div>
        </ResponsiveCard>
        <ResponsiveCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Pending</p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-600 truncate">
                {reconciliations.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 flex-shrink-0 ml-2" />
          </div>
        </ResponsiveCard>
        <ResponsiveCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Discrepancies</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600 truncate">
                {reconciliations.filter(r => r.status === 'discrepancy').length}
              </p>
            </div>
            <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0 ml-2" />
          </div>
        </ResponsiveCard>
      </ResponsiveGrid>

      {/* Reconciliations Table */}
      <ResponsiveCard>
        {responsive.isMobile ? (
          /* Mobile View - Card Layout */
          <div className="space-y-4">
            {filteredReconciliations.map((reconciliation) => (
              <div key={reconciliation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {reconciliation.bankAccount}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {reconciliation.accountNumber}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <ResponsiveBadge 
                      variant={reconciliation.status === 'reconciled' ? 'success' : 
                              reconciliation.status === 'pending' ? 'warning' : 'danger'}
                      size="sm"
                    >
                      {getStatusIcon(reconciliation.status)}
                      {reconciliation.status}
                    </ResponsiveBadge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <p className="font-medium">{new Date(reconciliation.reconciliationDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Statement Balance:</span>
                    <p className="font-medium">{formatCurrency(reconciliation.statementBalance)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Book Balance:</span>
                    <p className="font-medium">{formatCurrency(reconciliation.bookBalance)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Difference:</span>
                    <p className={`font-medium ${
                      reconciliation.difference === 0 
                        ? 'text-green-600' 
                        : reconciliation.difference > 0 
                          ? 'text-blue-600' 
                          : 'text-red-600'
                    }`}>
                      {formatCurrency(reconciliation.difference)}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">By: {reconciliation.createdBy}</span>
                  <div className="flex space-x-2">
                    <ResponsiveButton
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReconciliation(reconciliation)}
                    >
                      <Edit className="h-3 w-3" />
                    </ResponsiveButton>
                    <ResponsiveButton
                      variant="danger"
                      size="sm"
                    >
                      <Trash2 className="h-3 w-3" />
                    </ResponsiveButton>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredReconciliations.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No bank reconciliations found.</p>
              </div>
            )}
          </div>
        ) : (
          /* Desktop View - Table Layout */
          <ResponsiveTable>
            <ResponsiveTableHeader>
              <ResponsiveTableHeaderCell>Bank Account</ResponsiveTableHeaderCell>
              <ResponsiveTableHeaderCell>Reconciliation Date</ResponsiveTableHeaderCell>
              <ResponsiveTableHeaderCell align="right">Statement Balance</ResponsiveTableHeaderCell>
              <ResponsiveTableHeaderCell align="right">Book Balance</ResponsiveTableHeaderCell>
              <ResponsiveTableHeaderCell align="right">Difference</ResponsiveTableHeaderCell>
              <ResponsiveTableHeaderCell>Status</ResponsiveTableHeaderCell>
              <ResponsiveTableHeaderCell>Created By</ResponsiveTableHeaderCell>
              <ResponsiveTableHeaderCell>Actions</ResponsiveTableHeaderCell>
            </ResponsiveTableHeader>
            <ResponsiveTableBody>
              {filteredReconciliations.map((reconciliation) => (
                <ResponsiveTableRow key={reconciliation.id}>
                  <ResponsiveTableCell>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {reconciliation.bankAccount}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reconciliation.accountNumber}
                      </div>
                    </div>
                  </ResponsiveTableCell>
                  <ResponsiveTableCell>
                    {new Date(reconciliation.reconciliationDate).toLocaleDateString()}
                  </ResponsiveTableCell>
                  <ResponsiveTableCell align="right">
                    {formatCurrency(reconciliation.statementBalance)}
                  </ResponsiveTableCell>
                  <ResponsiveTableCell align="right">
                    {formatCurrency(reconciliation.bookBalance)}
                  </ResponsiveTableCell>
                  <ResponsiveTableCell align="right">
                    <span className={`font-medium ${
                      reconciliation.difference === 0 
                        ? 'text-green-600' 
                        : reconciliation.difference > 0 
                          ? 'text-blue-600' 
                          : 'text-red-600'
                    }`}>
                      {formatCurrency(reconciliation.difference)}
                    </span>
                  </ResponsiveTableCell>
                  <ResponsiveTableCell>
                    <ResponsiveBadge 
                      variant={reconciliation.status === 'reconciled' ? 'success' : 
                              reconciliation.status === 'pending' ? 'warning' : 'danger'}
                      size="sm"
                    >
                      {getStatusIcon(reconciliation.status)}
                      {reconciliation.status}
                    </ResponsiveBadge>
                  </ResponsiveTableCell>
                  <ResponsiveTableCell>
                    {reconciliation.createdBy}
                  </ResponsiveTableCell>
                  <ResponsiveTableCell>
                    <div className="flex items-center gap-2">
                      <ResponsiveButton
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReconciliation(reconciliation)}
                      >
                        <Edit className="h-4 w-4" />
                      </ResponsiveButton>
                      <ResponsiveButton
                        variant="danger"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </ResponsiveButton>
                    </div>
                  </ResponsiveTableCell>
                </ResponsiveTableRow>
              ))}
            </ResponsiveTableBody>
          </ResponsiveTable>
        )}
      </ResponsiveCard>

      {/* Add/Edit Modal */}
      <ResponsiveModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="New Bank Reconciliation"
        size="md"
      >
        <p className="text-gray-600 mb-4">
          Bank reconciliation form would be implemented here.
        </p>
        <div className="flex justify-end gap-2">
          <ResponsiveButton
            variant="secondary"
            onClick={() => setShowAddModal(false)}
          >
            Cancel
          </ResponsiveButton>
          <ResponsiveButton variant="primary">
            Save
          </ResponsiveButton>
        </div>
      </ResponsiveModal>
    </ResponsivePageWrapper>
  );
};

export default BankReconciliation;