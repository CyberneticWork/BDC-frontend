import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  DollarSign
} from "lucide-react";
import { getPurchaseReturns, addPurchaseReturn } from "../../services/AccountingService";

const PurchaseReturn = () => {
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);

  useEffect(() => {
    const returns = getPurchaseReturns();
    setPurchaseReturns(returns);
    setFilteredReturns(returns);
  }, []);

  useEffect(() => {
    let filtered = purchaseReturns;

    if (searchTerm) {
      filtered = filtered.filter(
        (returnItem) =>
          returnItem.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          returnItem.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          returnItem.originalGRN.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((returnItem) => returnItem.status.toLowerCase() === statusFilter);
    }

    setFilteredReturns(filtered);
  }, [searchTerm, statusFilter, purchaseReturns]);

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RotateCcw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const summary = {
    total: filteredReturns.reduce((sum, returnItem) => sum + returnItem.totalAmount, 0),
    approved: filteredReturns.filter(returnItem => returnItem.status.toLowerCase() === 'approved').reduce((sum, returnItem) => sum + returnItem.totalAmount, 0),
    pending: filteredReturns.filter(returnItem => returnItem.status.toLowerCase() === 'pending').reduce((sum, returnItem) => sum + returnItem.totalAmount, 0),
    count: filteredReturns.length
  };

  const ReturnViewModal = ({ returnItem, onClose }) => {
    if (!returnItem) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Purchase Return Details - {returnItem.returnNumber}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Return Information</h4>
              <p><strong>Return Number:</strong> {returnItem.returnNumber}</p>
              <p><strong>Original GRN:</strong> {returnItem.originalGRN}</p>
              <p><strong>Date:</strong> {new Date(returnItem.date).toLocaleDateString()}</p>
              <p><strong>Reason:</strong> {returnItem.reason}</p>
              <div className="flex items-center gap-2 mt-2">
                <strong>Status:</strong>
                {getStatusIcon(returnItem.status)}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(returnItem.status)}`}>
                  {returnItem.status}
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Supplier Information</h4>
              <p><strong>Supplier:</strong> {returnItem.supplier}</p>
              <p><strong>Total Amount:</strong> ${returnItem.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-4">Return Items</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Quantity</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {returnItem.items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">{item.productName}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan="3" className="border border-gray-300 px-4 py-2 text-right">Total Amount:</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">${returnItem.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Purchase Returns</h1>
              <p className="text-gray-600 mt-1">Manage returns to suppliers</p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New Purchase Return
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Returns</p>
                <p className="text-2xl font-bold text-gray-900">{summary.count}</p>
              </div>
              <RotateCcw className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">${summary.total.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">${summary.approved.toFixed(2)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">${summary.pending.toFixed(2)}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search purchase returns..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Purchase Returns Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original GRN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReturns.map((returnItem) => (
                  <tr key={returnItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <RotateCcw className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{returnItem.returnNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{returnItem.supplier}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {returnItem.originalGRN}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(returnItem.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${returnItem.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {returnItem.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(returnItem.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(returnItem.status)}`}>
                          {returnItem.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedReturn(returnItem);
                            setShowViewModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
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
        </div>

        {/* Modals */}
        {showViewModal && (
          <ReturnViewModal
            returnItem={selectedReturn}
            onClose={() => {
              setShowViewModal(false);
              setSelectedReturn(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PurchaseReturn;