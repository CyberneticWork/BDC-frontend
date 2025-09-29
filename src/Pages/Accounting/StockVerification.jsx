import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ClipboardCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Package,
  User,
  MapPin
} from "lucide-react";
import { getStockVerifications, addStockVerification, updateStockVerification } from "../../services/AccountingService";

const StockVerification = () => {
  const [stockVerifications, setStockVerifications] = useState([]);
  const [filteredVerifications, setFilteredVerifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showNewVerificationModal, setShowNewVerificationModal] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState(null);

  useEffect(() => {
    const verifications = getStockVerifications();
    setStockVerifications(verifications);
    setFilteredVerifications(verifications);
  }, []);

  useEffect(() => {
    let filtered = stockVerifications;

    if (searchTerm) {
      filtered = filtered.filter(
        (verification) =>
          verification.verificationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          verification.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          verification.verifiedBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((verification) => verification.status.toLowerCase() === statusFilter);
    }

    setFilteredVerifications(filtered);
  }, [searchTerm, statusFilter, stockVerifications]);

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "pending":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <ClipboardCheck className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVarianceColor = (variance) => {
    if (variance > 0) return "text-green-600";
    if (variance < 0) return "text-red-600";
    return "text-gray-600";
  };

  const summary = {
    totalVariance: filteredVerifications.reduce((sum, verification) => sum + (verification.totalVarianceValue || 0), 0),
    completed: filteredVerifications.filter(verification => verification.status.toLowerCase() === 'completed').length,
    inProgress: filteredVerifications.filter(verification => verification.status.toLowerCase() === 'in progress').length,
    count: filteredVerifications.length
  };

  const handleAddNewVerification = (newVerificationData) => {
    const addedVerification = addStockVerification(newVerificationData);
    const updatedVerifications = getStockVerifications();
    setStockVerifications(updatedVerifications);
    setFilteredVerifications(updatedVerifications);
    setShowNewVerificationModal(false);
  };

  const NewStockVerificationModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
      location: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      verifiedBy: '',
      remarks: '',
      items: [{ productName: '', systemQty: 0, physicalQty: 0, variance: 0, unitPrice: 0, varianceValue: 0 }]
    });

    const [totalVarianceValue, setTotalVarianceValue] = useState(0);

    useEffect(() => {
      const newTotal = formData.items.reduce((sum, item) => sum + (item.varianceValue || 0), 0);
      setTotalVarianceValue(newTotal);
    }, [formData.items]);

    const handleInputChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleItemChange = (index, field, value) => {
      const updatedItems = [...formData.items];
      updatedItems[index][field] = value;
      
      // Recalculate variance and variance value for this item
      if (field === 'systemQty' || field === 'physicalQty' || field === 'unitPrice') {
        const systemQty = field === 'systemQty' ? value : updatedItems[index].systemQty;
        const physicalQty = field === 'physicalQty' ? value : updatedItems[index].physicalQty;
        const unitPrice = field === 'unitPrice' ? value : updatedItems[index].unitPrice;
        
        updatedItems[index].variance = physicalQty - systemQty;
        updatedItems[index].varianceValue = updatedItems[index].variance * unitPrice;
      }
      
      setFormData(prev => ({ ...prev, items: updatedItems }));
    };

    const addItem = () => {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { productName: '', systemQty: 0, physicalQty: 0, variance: 0, unitPrice: 0, varianceValue: 0 }]
      }));
    };

    const removeItem = (index) => {
      if (formData.items.length > 1) {
        const updatedItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: updatedItems }));
      }
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Validate form
      if (!formData.location || !formData.verifiedBy) {
        alert('Please fill in all required fields');
        return;
      }
      
      if (formData.items.some(item => !item.productName || item.systemQty < 0 || item.physicalQty < 0 || item.unitPrice <= 0)) {
        alert('Please fill in all item details correctly');
        return;
      }

      const verificationData = {
        ...formData,
        totalVarianceValue
      };
      
      onSave(verificationData);
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Create New Stock Verification</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verified By *</label>
                <input
                  type="text"
                  value={formData.verifiedBy}
                  onChange={(e) => handleInputChange('verifiedBy', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enter any remarks"
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-gray-700">Verification Items</h4>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Product Name *</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">System Qty *</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Physical Qty *</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Variance</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Unit Price *</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Variance Value</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className={item.variance !== 0 ? 'bg-yellow-50' : ''}>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            type="text"
                            value={item.productName}
                            onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                            className="w-full border-0 focus:ring-0 focus:outline-none"
                            placeholder="Enter product name"
                            required
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            type="number"
                            value={item.systemQty}
                            onChange={(e) => handleItemChange(index, 'systemQty', parseInt(e.target.value) || 0)}
                            className="w-full border-0 focus:ring-0 focus:outline-none text-center"
                            min="0"
                            required
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            type="number"
                            value={item.physicalQty}
                            onChange={(e) => handleItemChange(index, 'physicalQty', parseInt(e.target.value) || 0)}
                            className="w-full border-0 focus:ring-0 focus:outline-none text-center"
                            min="0"
                            required
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <span className={`font-semibold ${
                            item.variance > 0 ? 'text-green-600' : 
                            item.variance < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {item.variance > 0 ? '+' : ''}{item.variance}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full border-0 focus:ring-0 focus:outline-none text-right"
                            step="0.01"
                            min="0"
                            required
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          <span className={`font-semibold ${
                            item.varianceValue > 0 ? 'text-green-600' : 
                            item.varianceValue < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            ${item.varianceValue > 0 ? '+' : ''}{item.varianceValue.toFixed(2)}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                            disabled={formData.items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan="5" className="border border-gray-300 px-4 py-2 text-right">Total Variance Value:</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        <span className={`${
                          totalVarianceValue > 0 ? 'text-green-600' : 
                          totalVarianceValue < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          ${totalVarianceValue > 0 ? '+' : ''}{totalVarianceValue.toFixed(2)}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Stock Verification
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const VerificationViewModal = ({ verification, onClose }) => {
    if (!verification) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Stock Verification Details - {verification.verificationNumber}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Verification Information</h4>
              <p><strong>Verification Number:</strong> {verification.verificationNumber}</p>
              <p><strong>Location:</strong> {verification.location}</p>
              <p><strong>Date:</strong> {new Date(verification.date).toLocaleDateString()}</p>
              <p><strong>Verified By:</strong> {verification.verifiedBy}</p>
              <div className="flex items-center gap-2 mt-2">
                <strong>Status:</strong>
                {getStatusIcon(verification.status)}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(verification.status)}`}>
                  {verification.status}
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Variance Summary</h4>
              <p><strong>Total Variance Value:</strong> 
                <span className={`ml-2 font-semibold ${getVarianceColor(verification.totalVarianceValue)}`}>
                  ${verification.totalVarianceValue ? verification.totalVarianceValue.toFixed(2) : '0.00'}
                </span>
              </p>
              {verification.remarks && <p className="mt-2"><strong>Remarks:</strong> {verification.remarks}</p>}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-4">Verification Items</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">System Qty</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Physical Qty</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Variance</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Variance Value</th>
                  </tr>
                </thead>
                <tbody>
                  {verification.items.map((item, index) => (
                    <tr key={index} className={item.variance !== 0 ? 'bg-yellow-50' : ''}>
                      <td className="border border-gray-300 px-4 py-2">{item.productName}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{item.systemQty}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {item.physicalQty !== null ? item.physicalQty : 'Pending'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {item.variance !== null ? (
                          <span className={`font-semibold ${getVarianceColor(item.variance)}`}>
                            {item.variance > 0 ? '+' : ''}{item.variance}
                          </span>
                        ) : 'Pending'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {item.varianceValue !== null ? (
                          <span className={`font-semibold ${getVarianceColor(item.varianceValue)}`}>
                            ${item.varianceValue > 0 ? '+' : ''}{item.varianceValue.toFixed(2)}
                          </span>
                        ) : 'Pending'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan="5" className="border border-gray-300 px-4 py-2 text-right">Total Variance Value:</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      <span className={`${getVarianceColor(verification.totalVarianceValue)}`}>
                        ${verification.totalVarianceValue ? 
                          (verification.totalVarianceValue > 0 ? '+' : '') + verification.totalVarianceValue.toFixed(2) : 
                          '0.00'}
                      </span>
                    </td>
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
              <h1 className="text-2xl font-bold text-gray-900">Stock Verification</h1>
              <p className="text-gray-600 mt-1">Verify physical stock against system records</p>
            </div>
            <button 
              onClick={() => setShowNewVerificationModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              New Stock Verification
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Verifications</p>
                <p className="text-2xl font-bold text-gray-900">{summary.count}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Variance</p>
                <p className={`text-2xl font-bold ${getVarianceColor(summary.totalVariance)}`}>
                  ${summary.totalVariance > 0 ? '+' : ''}{summary.totalVariance.toFixed(2)}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{summary.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{summary.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
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
                  placeholder="Search stock verifications..."
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
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Stock Verifications Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVerifications.map((verification) => (
                  <tr key={verification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ClipboardCheck className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{verification.verificationNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm font-medium text-gray-900">{verification.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(verification.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-500">{verification.verifiedBy}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={`${getVarianceColor(verification.totalVarianceValue)}`}>
                        ${verification.totalVarianceValue ? 
                          (verification.totalVarianceValue > 0 ? '+' : '') + verification.totalVarianceValue.toFixed(2) : 
                          '0.00'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(verification.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(verification.status)}`}>
                          {verification.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedVerification(verification);
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
          <VerificationViewModal
            verification={selectedVerification}
            onClose={() => {
              setShowViewModal(false);
              setSelectedVerification(null);
            }}
          />
        )}
        
        {showNewVerificationModal && (
          <NewStockVerificationModal
            onClose={() => setShowNewVerificationModal(false)}
            onSave={handleAddNewVerification}
          />
        )}
      </div>
    </div>
  );
};

export default StockVerification;