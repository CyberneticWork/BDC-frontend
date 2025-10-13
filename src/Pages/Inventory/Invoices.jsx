import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  DollarSign,
  Menu,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  getInvoiceData,
  addInvoice,
  updateInvoice,
  deleteInvoice
} from '../../services/Inventory/inventoryService';

const Invoices = () => {
  /**
   * Page structure (high-level)
   * 1) Create New Invoice: inline form with header (INVOICE, Invoice Number, tagline)
   * 2) Filters & Search: quick filters for list below
   * 3) Invoices Table (Desktop): tabular view for md+ screens
   * 4) Invoices List (Mobile): card view for small screens
   * 5) Empty State: when no invoices match filters
   * 6) View Modal: details modal for selected invoice
   */
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [nextInvoiceId, setNextInvoiceId] = useState('');

  useEffect(() => {
    // Load initial data from service
    const initialInvoices = getInvoiceData();
    setInvoices(initialInvoices);
    setFilteredInvoices(initialInvoices);
  }, []);

  // Compute next invoice id whenever invoices change
  useEffect(() => {
    const nums = invoices
      .map(inv => {
        const m = String(inv.id || '').match(/^INV-(\d{4})$/i);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter(n => n !== null);
    const next = (nums.length ? Math.max(...nums) + 1 : 1);
    setNextInvoiceId(`INV-${String(next).padStart(4, '0')}`);
  }, [invoices]);

  useEffect(() => {
    let filtered = invoices;

    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.customer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  }, [searchTerm, statusFilter, invoices]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const summary = {
    total: filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    paid: filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
    pending: filteredInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0),
    overdue: filteredInvoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0)
  };

  const InlineNewInvoiceForm = ({ nextInvoiceId }) => {
    const [formData, setFormData] = useState({
      id: '',
      center: '',
      customer: '',
      customerEmail: '',
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      refNumber: '',
      items: [{ description: '', quantity: 1, rate: 0, amount: 0 }]
    });
    const [errors, setErrors] = useState({});

    // Sync generated invoice id from parent into form
    useEffect(() => {
      setFormData(prev => ({ ...prev, id: nextInvoiceId }));
    }, [nextInvoiceId]);

    // Demo center list (can be wired to service later)
    const centers = [
      'Main Center',
      'Branch A',
      'Branch B',
      'Warehouse 01'
    ];

    // Build customer options from existing invoices as a convenience
    const availableCustomers = (() => {
      const map = new Map();
      invoices.forEach(inv => {
        const name = inv.customer;
        const email = inv.customerEmail;
        if (name && email && !map.has(email)) {
          map.set(email, { name, email });
        }
      });
      const list = Array.from(map.values());
      if (list.length === 0) {
        return [
          { name: 'John Doe', email: 'john@example.com' },
          { name: 'Jane Smith', email: 'jane@example.com' },
          { name: 'Acme Corp', email: 'billing@acme.test' }
        ];
      }
      return list;
    })();

    const addItem = () => {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
      }));
    };

    const removeItem = (index) => {
      if (formData.items.length > 1) {
        setFormData(prev => ({
          ...prev,
          items: prev.items.filter((_, i) => i !== index)
        }));
      }
    };

    const updateItem = (index, field, value) => {
      const newItems = [...formData.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Calculate amount if quantity or rate changed
      if (field === 'quantity' || field === 'rate') {
        newItems[index].amount = newItems[index].quantity * newItems[index].rate;
      }
      
      setFormData(prev => ({ ...prev, items: newItems }));
    };

    const calculateTotal = () => {
      return formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    const validateForm = () => {
      const newErrors = {};
      
      if (!formData.id) newErrors.id = 'Invoice number not generated';
      if (!formData.center.trim()) newErrors.center = 'Center is required';
      if (!formData.customer.trim()) newErrors.customer = 'Customer name is required';
      if (!formData.customerEmail.trim()) newErrors.customerEmail = 'Customer email is required';
      
      // Validate items
      formData.items.forEach((item, index) => {
        if (!item.description.trim()) {
          newErrors[`item_${index}_description`] = 'Description is required';
        }
        if (item.quantity <= 0) {
          newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
        }
        if (item.rate <= 0) {
          newErrors[`item_${index}_rate`] = 'Rate must be greater than 0';
        }
      });
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!validateForm()) {
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        const invoiceData = {
          ...formData,
          amount: calculateTotal()
        };
        
        const newInvoice = addInvoice(invoiceData);
        setInvoices(prev => [...prev, newInvoice]);
        setFilteredInvoices(prev => [...prev, newInvoice]);
        // Reset form for next entry
        setErrors({});
        setFormData({
          id: '', // will be filled by effect
          center: '',
          customer: '',
          customerEmail: '',
          date: new Date().toISOString().split('T')[0],
          dueDate: '',
          status: 'pending',
          items: [{ description: '', quantity: 1, rate: 0, amount: 0 }]
        });
      } catch (error) {
        console.error('Error creating invoice:', error);
      } finally {
        setIsSubmitting(false);
      }
    };
    
    const resetForm = () => {
      setErrors({});
      setFormData({
        id: '', // will be recomputed by effect
        center: '',
        customer: '',
        customerEmail: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        refNumber: '',
        items: [{ description: '', quantity: 1, rate: 0, amount: 0 }]
      });
    };

    return (
      <>

      {/* header section for INVOICE Number */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">INVOICE</h1>
              <div className="text-red-600 font-bold mt-1 text-md sm:text-base">
                Invoice Number : {nextInvoiceId}
              </div>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage and track your invoices</p>
            </div>
          </div>
        </div>

           {/* Invoice Form */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Create New Invoice</h3>
          <form onSubmit={handleSubmit}>

            <div className="grid grid-cols-1 gap-4 mb-4 sm:mb-6">

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Center *
                </label>
                <select
                  value={formData.center}
                  onChange={(e) => setFormData(prev => ({ ...prev, center: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.center ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select a center</option>
                  {centers.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.center && <p className="text-red-500 text-sm mt-1">{errors.center}</p>}
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Details*
                </label>
                <select
                  value={formData.customerEmail}
                  onChange={(e) => {
                    const selected = availableCustomers.find(c => c.email === e.target.value);
                    if (selected) {
                      setFormData(prev => ({ ...prev, customer: selected.name, customerEmail: selected.email }));
                    } else {
                      setFormData(prev => ({ ...prev, customer: '', customerEmail: '' }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select customer </option>
                  {availableCustomers.map(c => (
                    <option key={c.email} value={c.email}>{`${c.name} (${c.email})`}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ref Number
                </label>
                <input
                  type="text"
                  value={formData.refNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, refNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter reference number"
                />
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <h4 className="text-base sm:text-lg font-medium text-gray-900">Invoice Items</h4>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm w-full sm:w-auto justify-center"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Description *</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 text-center">Qty *</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 text-right">Rate *</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 text-right">Amount</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-2 sm:px-4 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className={`w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 text-sm ${errors[`item_${index}_description`] ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Item description"
                          />
                          {errors[`item_${index}_description`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_description`]}</p>
                          )}
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className={`w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 text-center text-sm ${errors[`item_${index}_quantity`] ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors[`item_${index}_quantity`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_quantity`]}</p>
                          )}
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            className={`w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 text-right text-sm ${errors[`item_${index}_rate`] ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors[`item_${index}_rate`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_rate`]}</p>
                          )}
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-2 text-right font-medium text-sm">
                          ${item.amount.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-2 text-center">
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan="3" className="border border-gray-300 px-2 sm:px-4 py-2 text-right text-sm">Total:</td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 text-right text-sm">${calculateTotal().toFixed(2)}</td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 order-2 sm:order-1"
                disabled={isSubmitting}
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Invoice
                  </>
                )}
              </button>
            </div>
            </div>
          </form>
        </div>
      </>
    );
  };

  const InvoiceViewModal = ({ invoice, onClose }) => {
    if (!invoice) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold">Invoice Details - {invoice.id}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">Invoice Information</h4>
              <p className="text-sm"><strong>Date:</strong> {new Date(invoice.date).toLocaleDateString()}</p>
              <p className="text-sm"><strong>Ref Number:</strong> {invoice.refNumber || 'N/A'}</p>
              <div className="flex items-center gap-2 mt-2">
                <strong className="text-sm">Status:</strong>
                {getStatusIcon(invoice.status)}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">Customer Information</h4>
              <p className="text-sm"><strong>Name:</strong> {invoice.customer}</p>
              <p className="text-sm"><strong>Email:</strong> {invoice.customerEmail}</p>
            </div>
          </div>

          <div className="mb-4 sm:mb-6">
            <h4 className="font-semibold text-gray-700 mb-4 text-sm sm:text-base">Invoice Items</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Description</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 text-center">Qty</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 text-right">Rate</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2">{item.description}</td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 text-center">{item.quantity}</td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 text-right">${item.rate.toFixed(2)}</td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 text-right">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan="3" className="border border-gray-300 px-2 sm:px-4 py-2 text-right text-sm">Total:</td>
                    <td className="border border-gray-300 px-2 sm:px-4 py-2 text-right text-sm">${invoice.amount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 order-2 sm:order-1">
              Close
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center order-1 sm:order-2">
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Mobile Invoice Card Component
  const MobileInvoiceCard = ({ invoice }) => {
    const isExpanded = expandedInvoice === invoice.id;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">{invoice.id}</span>
            </div>
            <div className="text-sm font-medium text-gray-900 mb-1">{invoice.customer}</div>
            <div className="text-sm text-gray-500 mb-2">${invoice.amount.toFixed(2)}</div>
            <div className="flex items-center gap-2">
              {getStatusIcon(invoice.status)}
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-sm text-gray-500">{new Date(invoice.date).toLocaleDateString()}</div>
            </div>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <div className="text-gray-500">Email</div>
                <div className="truncate">{invoice.customerEmail}</div>
              </div>
              <div>
                <div className="text-gray-500">Ref Number</div>
                <div>{invoice.refNumber || 'N/A'}</div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setShowViewModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-900 p-1"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button className="text-green-600 hover:text-green-900 p-1">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="text-red-600 hover:text-red-900 p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/*  Create New Invoice */}
        <section aria-label="Create new invoice">
          <InlineNewInvoiceForm nextInvoiceId={nextInvoiceId} />
        </section>


        {/* : Filters and Search */}
        <section aria-label="Invoice filters and search">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search invoices..."
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base flex-1"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
                <button className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm sm:text-base">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">More Filters</span>
                </button>
              </div>
            </div>
          </div>
        </section>


        {/*Invoices Table (Desktop) */}
        <section aria-label="Invoices table (desktop)" className="hidden md:block">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{invoice.id}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{invoice.customer}</div>
                          <div className="text-sm text-gray-500">{invoice.customerEmail}</div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${invoice.amount.toFixed(2)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(invoice.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
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
        </section>

        {/* SECTION 5: Mobile Invoices List */}
        <section aria-label="Invoices list (mobile)" className="md:hidden">
          {filteredInvoices.map((invoice) => (
            <MobileInvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </section>

        {/* SECTION 6: Empty State */}
        {filteredInvoices.length === 0 && (
          <section aria-label="Empty state">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-500 mb-4">
                {invoices.length === 0 ? "Get started by creating your first invoice." : "Try adjusting your search or filter criteria."}
              </p>
              {invoices.length === 0 && null}
            </div>
          </section>
        )}

        {/* SECTION 7: View Modal */}
        {showViewModal && (
          <InvoiceViewModal
            invoice={selectedInvoice}
            onClose={() => {
              setShowViewModal(false);
              setSelectedInvoice(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Invoices;