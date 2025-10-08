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
  MapPin,
  MoreVertical
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState({});

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const toggleMobileActions = (verificationId) => {
    setShowMobileActions(prev => ({
      ...prev,
      [verificationId]: !prev[verificationId]
    }));
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white">
            <h3 className="text-lg md:text-xl font-semibold">Create New Stock Verification</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verified By *</label>
                <input
                  type="text"
                  value={formData.verifiedBy}
                  onChange={(e) => handleInputChange('verifiedBy', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  rows="3"
                  placeholder="Enter any remarks"
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h4 className="text-base md:text-lg font-medium text-gray-700">Verification Items</h4>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-left">Product *</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-center">System</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-center">Physical</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-center">Var</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-right">Price *</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-right">Value</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className={item.variance !== 0 ? 'bg-yellow-50' : ''}>
                        <td className="border border-gray-300 px-2 md:px-4 py-2">
                          <input
                            type="text"
                            value={item.productName}
                            onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                            className="w-full border-0 focus:ring-0 focus:outline-none text-sm"
                            placeholder="Product name"
                            required
                          />
                        </td>
                        <td className="border border-gray-300 px-2 md:px-4 py-2">
                          <input
                            type="number"
                            value={item.systemQty}
                            onChange={(e) => handleItemChange(index, 'systemQty', parseInt(e.target.value) || 0)}
                            className="w-full border-0 focus:ring-0 focus:outline-none text-center text-sm"
                            min="0"
                            required
                          />
                        </td>
                        <td className="border border-gray-300 px-2 md:px-4 py-2">
                          <input
                            type="number"
                            value={item.physicalQty}
                            onChange={(e) => handleItemChange(index, 'physicalQty', parseInt(e.target.value) || 0)}
                            className="w-full border-0 focus:ring-0 focus:outline-none text-center text-sm"
                            min="0"
                            required
                          />
                        </td>
                        <td className="border border-gray-300 px-2 md:px-4 py-2 text-center">
                          <span className={`font-semibold text-sm ${
                            item.variance > 0 ? 'text-green-600' : 
                            item.variance < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {item.variance > 0 ? '+' : ''}{item.variance}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 md:px-4 py-2">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full border-0 focus:ring-0 focus:outline-none text-right text-sm"
                            step="0.01"
                            min="0"
                            required
                          />
                        </td>
                        <td className="border border-gray-300 px-2 md:px-4 py-2 text-right">
                          <span className={`font-semibold text-sm ${
                            item.varianceValue > 0 ? 'text-green-600' : 
                            item.varianceValue < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            ${item.varianceValue > 0 ? '+' : ''}{item.varianceValue.toFixed(2)}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 md:px-4 py-2 text-center">
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
                      <td colSpan="5" className="border border-gray-300 px-2 md:px-4 py-2 text-right text-sm">Total Variance Value:</td>
                      <td className="border border-gray-300 px-2 md:px-4 py-2 text-right text-sm">
                        <span className={`${
                          totalVarianceValue > 0 ? 'text-green-600' : 
                          totalVarianceValue < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          ${totalVarianceValue > 0 ? '+' : ''}{totalVarianceValue.toFixed(2)}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 md:px-4 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm md:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base order-1 sm:order-2"
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white">
            <h3 className="text-lg md:text-xl font-semibold">Stock Verification - {verification.verificationNumber}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>

          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm md:text-base">Verification Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Verification Number:</strong> {verification.verificationNumber}</p>
                  <p><strong>Location:</strong> {verification.location}</p>
                  <p><strong>Date:</strong> {new Date(verification.date).toLocaleDateString()}</p>
                  <p><strong>Verified By:</strong> {verification.verifiedBy}</p>
                  <div className="flex items-center gap-2">
                    <strong>Status:</strong>
                    {getStatusIcon(verification.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(verification.status)}`}>
                      {verification.status}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm md:text-base">Variance Summary</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Total Variance Value:</strong> 
                    <span className={`ml-2 font-semibold ${getVarianceColor(verification.totalVarianceValue)}`}>
                      ${verification.totalVarianceValue ? verification.totalVarianceValue.toFixed(2) : '0.00'}
                    </span>
                  </p>
                  {verification.remarks && <p><strong>Remarks:</strong> {verification.remarks}</p>}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3 text-sm md:text-base">Verification Items</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-left">Product</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-center">System</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-center">Physical</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-center">Var</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-right">Price</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verification.items.map((item, index) => (
                      <tr key={index} className={item.variance !== 0 ? 'bg-yellow-50' : ''}>
                        <td className="border border-gray-300 px-2 md:px-4 py-2 text-sm">{item.productName}</td>
                        <td className="border border-gray-300 px-2 md:px-4 py-2 text-center text-sm">{item.systemQty}</td>
                        <td className="border border-gray-300 px-2 md:px-4 py-2 text-center text-sm">
                          {item.physicalQty !== null ? item.physicalQty : 'Pending'}
                        </td>
                        <td className="border border-gray-300 px-2 md:px-4 py-2 text-center text-sm">
                          {item.variance !== null ? (
                            <span className={`font-semibold ${getVarianceColor(item.variance)}`}>
                              {item.variance > 0 ? '+' : ''}{item.variance}
                            </span>
                          ) : 'Pending'}
                        </td>
                        <td className="border border-gray-300 px-2 md:px-4 py-2 text-right text-sm">${item.unitPrice.toFixed(2)}</td>
                        <td className="border border-gray-300 px-2 md:px-4 py-2 text-right text-sm">
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
                      <td colSpan="5" className="border border-gray-300 px-2 md:px-4 py-2 text-right text-sm">Total Variance Value:</td>
                      <td className="border border-gray-300 px-2 md:px-4 py-2 text-right text-sm">
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

            <div className="flex justify-end">
              <button onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm md:text-base w-full sm:w-auto">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MobileVerificationCard = ({ verification }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">{verification.verificationNumber}</span>
        </div>
        <div className="relative">
          <button 
            onClick={() => toggleMobileActions(verification.id)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {showMobileActions[verification.id] && (
            <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
              <button
                onClick={() => {
                  setSelectedVerification(verification);
                  setShowViewModal(true);
                  setShowMobileActions({});
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
              >
                <Eye className="h-4 w-4" />
                View
              </button>
              <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-50">
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Location:</span>
          <span className="font-medium">{verification.location}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Date:</span>
          <span>{new Date(verification.date).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Verified By:</span>
          <span>{verification.verifiedBy}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Variance Value:</span>
          <span className={`font-semibold ${getVarianceColor(verification.totalVarianceValue)}`}>
            ${verification.totalVarianceValue ? 
              (verification.totalVarianceValue > 0 ? '+' : '') + verification.totalVarianceValue.toFixed(2) : 
              '0.00'}
          </span>
        </div>
        {verification.remarks && (
          <div className="flex justify-between items-start">
            <span className="text-gray-600">Remarks:</span>
            <span className="text-right text-xs flex-1 ml-2">{verification.remarks}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Status:</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(verification.status)}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(verification.status)}`}>
              {verification.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Stock Verification</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Verify physical stock against system records</p>
            </div>
            <button 
              onClick={() => setShowNewVerificationModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm md:text-base w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5" />
              New Stock Verification
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Verifications</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{summary.count}</p>
              </div>
              <ClipboardCheck className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Variance</p>
                <p className={`text-lg md:text-2xl font-bold ${getVarianceColor(summary.totalVariance)}`}>
                  ${summary.totalVariance > 0 ? '+' : ''}{summary.totalVariance.toFixed(2)}
                </p>
              </div>
              <Package className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Completed</p>
                <p className="text-lg md:text-2xl font-bold text-green-600">{summary.completed}</p>
              </div>
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-lg md:text-2xl font-bold text-blue-600">{summary.inProgress}</p>
              </div>
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search stock verifications..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                
                <button 
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 sm:hidden"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>
              
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm md:text-base hidden sm:flex">
                <Filter className="h-4 w-4" />
                More Filters
              </button>
            </div>

            {/* Mobile Additional Filters */}
            {showMobileFilters && (
              <div className="sm:hidden space-y-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>All Time</option>
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variance Range</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>Any Variance</option>
                    <option>Positive Only</option>
                    <option>Negative Only</option>
                    <option>No Variance</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stock Verifications Table/Cards */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isMobile ? (
            // Mobile Card View
            <div className="p-4">
              {filteredVerifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No stock verifications found
                </div>
              ) : (
                filteredVerifications.map((verification) => (
                  <MobileVerificationCard key={verification.id} verification={verification} />
                ))
              )}
            </div>
          ) : (
            // Desktop Table View
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification Number</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified By</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance Value</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVerifications.map((verification) => (
                    <tr key={verification.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ClipboardCheck className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{verification.verificationNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">{verification.location}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(verification.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">{verification.verifiedBy}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={`${getVarianceColor(verification.totalVarianceValue)}`}>
                          ${verification.totalVarianceValue ? 
                            (verification.totalVarianceValue > 0 ? '+' : '') + verification.totalVarianceValue.toFixed(2) : 
                            '0.00'}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(verification.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(verification.status)}`}>
                            {verification.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
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
          )}
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