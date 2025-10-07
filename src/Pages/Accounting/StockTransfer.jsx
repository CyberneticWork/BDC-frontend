import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ArrowRightLeft,
  CheckCircle,
  Clock,
  Truck,
  X,
  MapPin,
  User,
  MoreVertical
} from "lucide-react";
import { getStockTransfers, addStockTransfer, updateStockTransfer } from "../../services/AccountingService";

const StockTransfer = () => {
  const [stockTransfers, setStockTransfers] = useState([]);
  const [filteredTransfers, setFilteredTransfers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showNewTransferModal, setShowNewTransferModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
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
    const transfers = getStockTransfers();
    setStockTransfers(transfers);
    setFilteredTransfers(transfers);
  }, []);

  useEffect(() => {
    let filtered = stockTransfers;

    if (searchTerm) {
      filtered = filtered.filter(
        (transfer) =>
          transfer.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transfer.fromLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transfer.toLocation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((transfer) => transfer.status.toLowerCase() === statusFilter);
    }

    setFilteredTransfers(filtered);
  }, [searchTerm, statusFilter, stockTransfers]);

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in transit":
        return <Truck className="h-4 w-4 text-blue-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <ArrowRightLeft className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in transit":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const toggleMobileActions = (transferId) => {
    setShowMobileActions(prev => ({
      ...prev,
      [transferId]: !prev[transferId]
    }));
  };

  const summary = {
    total: filteredTransfers.reduce((sum, transfer) => sum + transfer.totalValue, 0),
    completed: filteredTransfers.filter(transfer => transfer.status.toLowerCase() === 'completed').reduce((sum, transfer) => sum + transfer.totalValue, 0),
    inTransit: filteredTransfers.filter(transfer => transfer.status.toLowerCase() === 'in transit').reduce((sum, transfer) => sum + transfer.totalValue, 0),
    count: filteredTransfers.length
  };

  const handleAddNewTransfer = (newTransferData) => {
    const addedTransfer = addStockTransfer(newTransferData);
    const updatedTransfers = getStockTransfers();
    setStockTransfers(updatedTransfers);
    setFilteredTransfers(updatedTransfers);
    setShowNewTransferModal(false);
  };

  const NewStockTransferModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
      fromLocation: '',
      toLocation: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      transferredBy: '',
      receivedBy: '',
      remarks: '',
      items: [{ productName: '', quantity: 1, unitPrice: 0, total: 0 }]
    });

    const [totalValue, setTotalValue] = useState(0);

    useEffect(() => {
      const newTotal = formData.items.reduce((sum, item) => sum + item.total, 0);
      setTotalValue(newTotal);
    }, [formData.items]);

    const handleInputChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleItemChange = (index, field, value) => {
      const updatedItems = [...formData.items];
      updatedItems[index][field] = value;
      
      // Recalculate total for this item
      if (field === 'quantity' || field === 'unitPrice') {
        updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
      }
      
      setFormData(prev => ({ ...prev, items: updatedItems }));
    };

    const addItem = () => {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { productName: '', quantity: 1, unitPrice: 0, total: 0 }]
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
      if (!formData.fromLocation || !formData.toLocation || !formData.transferredBy) {
        alert('Please fill in all required fields');
        return;
      }
      
      if (formData.items.some(item => !item.productName || item.quantity <= 0 || item.unitPrice <= 0)) {
        alert('Please fill in all item details correctly');
        return;
      }

      const transferData = {
        ...formData,
        totalValue
      };
      
      onSave(transferData);
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white">
            <h3 className="text-lg md:text-xl font-semibold">Create New Stock Transfer</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Location *</label>
                <input
                  type="text"
                  value={formData.fromLocation}
                  onChange={(e) => handleInputChange('fromLocation', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Location *</label>
                <input
                  type="text"
                  value={formData.toLocation}
                  onChange={(e) => handleInputChange('toLocation', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
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
                  <option value="In Transit">In Transit</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transferred By *</label>
                <input
                  type="text"
                  value={formData.transferredBy}
                  onChange={(e) => handleInputChange('transferredBy', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Received By</label>
                <input
                  type="text"
                  value={formData.receivedBy}
                  onChange={(e) => handleInputChange('receivedBy', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  placeholder="Leave empty if not yet received"
                />
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
                <h4 className="text-base md:text-lg font-medium text-gray-700">Transfer Items</h4>
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
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-left">Product Name *</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-center">Qty *</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-right">Price *</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-right">Total</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index}>
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
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full border-0 focus:ring-0 focus:outline-none text-center text-sm"
                            min="1"
                            required
                          />
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
                        <td className="border border-gray-300 px-2 md:px-4 py-2 text-right font-medium text-sm">
                          ${item.total.toFixed(2)}
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
                      <td colSpan="3" className="border border-gray-300 px-2 md:px-4 py-2 text-right text-sm">Total Value:</td>
                      <td className="border border-gray-300 px-2 md:px-4 py-2 text-right text-sm">${totalValue.toFixed(2)}</td>
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
                Create Stock Transfer
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const TransferViewModal = ({ transfer, onClose }) => {
    if (!transfer) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white">
            <h3 className="text-lg md:text-xl font-semibold">Stock Transfer - {transfer.transferNumber}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>

          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm md:text-base">Transfer Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Transfer Number:</strong> {transfer.transferNumber}</p>
                  <p><strong>Date:</strong> {new Date(transfer.date).toLocaleDateString()}</p>
                  <div className="flex items-center gap-2">
                    <strong>Status:</strong>
                    {getStatusIcon(transfer.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transfer.status)}`}>
                      {transfer.status}
                    </span>
                  </div>
                  <p><strong>Total Value:</strong> ${transfer.totalValue.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm md:text-base">Location & Personnel</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>From:</strong> {transfer.fromLocation}</p>
                  <p><strong>To:</strong> {transfer.toLocation}</p>
                  <p><strong>Transferred By:</strong> {transfer.transferredBy}</p>
                  <p><strong>Received By:</strong> {transfer.receivedBy}</p>
                  {transfer.remarks && <p><strong>Remarks:</strong> {transfer.remarks}</p>}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3 text-sm md:text-base">Transfer Items</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-left">Product</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-center">Qty</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-right">Price</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfer.items.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-2 md:px-4 py-2 text-sm">{item.productName}</td>
                        <td className="border border-gray-300 px-2 md:px-4 py-2 text-center text-sm">{item.quantity}</td>
                        <td className="border border-gray-300 px-2 md:px-4 py-2 text-right text-sm">${item.unitPrice.toFixed(2)}</td>
                        <td className="border border-gray-300 px-2 md:px-4 py-2 text-right text-sm">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan="3" className="border border-gray-300 px-2 md:px-4 py-2 text-right text-sm">Total Value:</td>
                      <td className="border border-gray-300 px-2 md:px-4 py-2 text-right text-sm">${transfer.totalValue.toFixed(2)}</td>
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

  const MobileTransferCard = ({ transfer }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">{transfer.transferNumber}</span>
        </div>
        <div className="relative">
          <button 
            onClick={() => toggleMobileActions(transfer.id)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {showMobileActions[transfer.id] && (
            <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
              <button
                onClick={() => {
                  setSelectedTransfer(transfer);
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
          <span className="text-gray-600">From:</span>
          <span className="font-medium">{transfer.fromLocation}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">To:</span>
          <span className="font-medium">{transfer.toLocation}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Date:</span>
          <span>{new Date(transfer.date).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Value:</span>
          <span className="font-medium">${transfer.totalValue.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Transferred By:</span>
          <span>{transfer.transferredBy}</span>
        </div>
        {transfer.receivedBy && (
          <div className="flex justify-between">
            <span className="text-gray-600">Received By:</span>
            <span>{transfer.receivedBy}</span>
          </div>
        )}
        {transfer.remarks && (
          <div className="flex justify-between items-start">
            <span className="text-gray-600">Remarks:</span>
            <span className="text-right text-xs flex-1 ml-2">{transfer.remarks}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Status:</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(transfer.status)}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transfer.status)}`}>
              {transfer.status}
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
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Stock Transfers</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Manage inter-location stock movements</p>
            </div>
            <button 
              onClick={() => setShowNewTransferModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm md:text-base w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5" />
              New Stock Transfer
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Transfers</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{summary.count}</p>
              </div>
              <ArrowRightLeft className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">${summary.total.toFixed(2)}</p>
              </div>
              <MapPin className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Completed</p>
                <p className="text-lg md:text-2xl font-bold text-green-600">${summary.completed.toFixed(2)}</p>
              </div>
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-lg md:text-2xl font-bold text-blue-600">${summary.inTransit.toFixed(2)}</p>
              </div>
              <Truck className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
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
                placeholder="Search stock transfers..."
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
                  <option value="in transit">In Transit</option>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value Range</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>Any Value</option>
                    <option>Under $100</option>
                    <option>$100 - $500</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stock Transfers Table/Cards */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isMobile ? (
            // Mobile Card View
            <div className="p-4">
              {filteredTransfers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No stock transfers found
                </div>
              ) : (
                filteredTransfers.map((transfer) => (
                  <MobileTransferCard key={transfer.id} transfer={transfer} />
                ))
              )}
            </div>
          ) : (
            // Desktop Table View
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer Number</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Location</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Location</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transferred By</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ArrowRightLeft className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{transfer.transferNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{transfer.fromLocation}</div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{transfer.toLocation}</div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transfer.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${transfer.totalValue.toFixed(2)}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transfer.transferredBy}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transfer.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transfer.status)}`}>
                            {transfer.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedTransfer(transfer);
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
          <TransferViewModal
            transfer={selectedTransfer}
            onClose={() => {
              setShowViewModal(false);
              setSelectedTransfer(null);
            }}
          />
        )}
        
        {showNewTransferModal && (
          <NewStockTransferModal
            onClose={() => setShowNewTransferModal(false)}
            onSave={handleAddNewTransfer}
          />
        )}
      </div>
    </div>
  );
};

export default StockTransfer;