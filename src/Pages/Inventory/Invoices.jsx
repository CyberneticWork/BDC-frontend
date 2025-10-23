import React, { useState, useEffect } from "react";
import {Plus,Trash2,CheckCircle,X} from "lucide-react";
import {getInvoiceData,addInvoice, getCustomers} from '../../services/Inventory/inventoryService';
import Payment from '../../components/Inventory/Payment';

const Invoices = () => {

  const [invoices, setInvoices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextInvoiceId, setNextInvoiceId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successText, setSuccessText] = useState("");

  useEffect(() => {
    // Load initial data from service
    const initialInvoices = getInvoiceData();
    setInvoices(initialInvoices);
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

  // No filters or status display; only creation form remains

  // Currency formatter for Sri Lankan Rupees
  const formatLKR = (value) => {
    try {
      return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(value || 0));
    } catch {
      // Fallback formatting
      const num = Number(value || 0).toFixed(2);
      return `LKR ${num}`;
    }
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
      amount: 0,
      productName: '',
      quantity: 0,
    });
    const [errors, setErrors] = useState({});
    const [items, setItems] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingInvoice, setPendingInvoice] = useState(null);
  const [customers, setCustomers] = useState([]);

    // Sync generated invoice id from parent into form
    useEffect(() => {
      setFormData(prev => ({ ...prev, id: nextInvoiceId }));
    }, [nextInvoiceId]);

    useEffect(() => {
      const fetchCustomers = async () => {
        try {
          const data = await getCustomers();
          setCustomers(data);
        } catch (error) {
          console.error('Error fetching customers:', error);
        }
      };
      fetchCustomers();
    }, []);

    // Demo center list (can be wired to service later)
    const centers = [
      'Main Center',
      'Branch A',
      'Branch B',
      'Warehouse 01'
    ];

    // Build customer options from fetched customers
    const availableCustomers = customers.map(c => ({ name: c.name, email: c.email }));

    // Compute table total (includes discount per unit * quantity)
    const tableTotal = React.useMemo(() => {
      return items.reduce((acc, it) => {
        const qty = Number(it.quantity) || 0;
        const unit = Number(it.unitPrice) || 0;
        const disc = (it.discountEnabled ? Number(it.discount) : 0) || 0; // per unit discount when enabled
        const lineTotal = unit * qty;
        const lineDiscount = disc * qty;
        return acc + (lineTotal - lineDiscount);
      }, 0);
    }, [items]);

    // Derive invoice amount from items (keep in sync with table total)
    useEffect(() => {
      setFormData(prev => ({ ...prev, amount: tableTotal }));
    }, [tableTotal]);

    const validateForm = () => {
      const newErrors = {};
      
      if (!formData.id) newErrors.id = 'Invoice number not generated';
      if (!formData.center.trim()) newErrors.center = 'Center is required';
      if (!formData.date) newErrors.date = 'Date is required';
      if (!formData.customer.trim()) newErrors.customer = 'Customer name is required';
      if (!formData.customerEmail.trim()) newErrors.customerEmail = 'Customer email is required';
      if ((items?.length || 0) === 0) {
        // If there are no line items, require inline product fields
        if (!formData.productName.trim()) newErrors.productName = 'Product name is required';
        if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
      }
      if (formData.amount <= 0 && (items?.length || 0) === 0) newErrors.amount = 'Amount must be greater than 0';
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleAddItem = () => {
      const name = (formData.productName || '').trim();
      const qty = Number(formData.quantity) || 0;
      if (!name) {
        setErrors(prev => ({ ...prev, productName: 'Product name is required' }));
        return;
      }
      if (qty <= 0) {
        setErrors(prev => ({ ...prev, quantity: 'Quantity must be greater than 0' }));
        return;
      }
      const newItem = {
        id: Date.now(),
        name,
        quantity: qty,
        unitPrice: 0,
        discount: 0,
        discountEnabled: false,
      };
      setItems(prev => [...prev, newItem]);
      // Clear entry fields for next add
      setFormData(prev => ({ ...prev, productName: '', quantity: 0 }));
      setErrors(prev => ({ ...prev, productName: undefined, quantity: undefined }));
    };

    const updateItemField = (id, field, value) => {
      setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
    };

    const deleteItem = (id) => {
      setItems(prev => prev.filter(it => it.id !== id));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      // Prepare invoice payload up to this point (without payment)
      const firstItem = items[0];
      const computedAmount = items.reduce((acc, it) => {
        const qty = Number(it.quantity) || 0;
        const unit = Number(it.unitPrice) || 0;
        const disc = (it.discountEnabled ? Number(it.discount) : 0) || 0; // per unit discount when enabled
        const lineTotal = unit * qty;
        const lineDiscount = disc * qty;
        return acc + (lineTotal - lineDiscount);
      }, 0);

      const invoiceData = {
        ...formData,
        amount: computedAmount || formData.amount,
        items,
        // keep backward-compatible fields for displays using single product
        productName: firstItem ? firstItem.name : formData.productName,
        quantity: firstItem ? firstItem.quantity : formData.quantity,
      };

      // Open Payment popup; finalize after payment is set
      setPendingInvoice(invoiceData);
      setShowPaymentModal(true);
    };

    const finalizeInvoiceWithPayment = async (paymentData) => {
      if (!pendingInvoice) return;
      setIsSubmitting(true);
      try {
        const newInvoice = addInvoice({ ...pendingInvoice, payment: paymentData });
        setInvoices(prev => [...prev, newInvoice]);
        // Reset form for next entry
        setErrors({});
        setFormData({
          id: '', // will be filled by effect
          center: '',
          customer: '',
          customerEmail: '',
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
          refNumber: '',
          amount: 0,
          productName: '',
          quantity: 0,
        });
        setItems([]);
        setPendingInvoice(null);
        setShowPaymentModal(false);
        setSuccessText(`Invoice ${newInvoice?.id || nextInvoiceId} created successfully.`);
        setShowSuccess(true);
      } catch (error) {
        console.error('Error creating invoice:', error);
      } finally {
        setIsSubmitting(false);
      }
    };
    

    return (
      <>

      {/* header section for INVOICE Number */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 uppercase">Invoice</h1>
              <div className="text-blue-600 font-semibold mt-2 text-lg sm:text-xl">
                Invoice Number : <span className="text-blue-600 font-semibold mt-2 text-lg sm:text-xl">{nextInvoiceId}</span>
              </div>
              <p className="text-slate-500 text-base">Manage and track your invoices</p>
            </div>
          </div>
        </div>

           {/* Invoice Form */}
        <div className="bg-slate-50 rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-6">Create New Invoice</h3>
          <form onSubmit={handleSubmit}>

            <div className="grid grid-cols-1 gap-4 mb-4 sm:mb-6">

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  aria-invalid={!!errors.date}
                  aria-describedby={errors.date ? 'date-error' : undefined}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 ${errors.date ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-slate-50'}`}
                />
                {errors.date && <p id="date-error" className="text-red-600 text-sm mt-2 font-medium">{errors.date}</p>}
              </div>
              

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Center *
                </label>
                <select
                  value={formData.center}
                  onChange={(e) => setFormData(prev => ({ ...prev, center: e.target.value }))}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 bg-white ${errors.center ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-slate-50'}`}
                >
                  <option value="">Select a center</option>
                  {centers.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.center && <p className="text-red-600 text-sm mt-2 font-medium">{errors.center}</p>}
              </div>


              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
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
                  aria-invalid={!!(errors.customer || errors.customerEmail)}
                  aria-describedby={(errors.customer || errors.customerEmail) ? 'customer-error' : undefined}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 bg-white ${(errors.customer || errors.customerEmail) ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-slate-50'}`}
                >
                  <option value="">Select customer </option>
                  {availableCustomers.map(c => (
                    <option key={c.email} value={c.email}>{`${c.name} (${c.email})`}</option>
                  ))}
                </select>
                {(errors.customer || errors.customerEmail) && (
                  <p id="customer-error" className="text-red-600 text-sm mt-2 font-medium">Customer details are required</p>
                )}
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Ref Number
                </label>
                <input
                  type="text"
                  value={formData.refNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, refNumber: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-slate-300 bg-slate-50 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
                  placeholder="Enter reference number"
                />
              </div>

            {/*total amount section*/}
              <div className="lg:place-self-end text-center bg-slate-100 rounded-lg p-6 border border-slate-200">
                <p className="text-lg font-semibold text-slate-700 mb-2">Total Amount</p>
                <p className="text-3xl font-bold text-slate-900">
                  {formatLKR(tableTotal)}
                </p>
              </div>
            </div>

            {/* Product Section */}
            <div className="mb-6 sm:mb-8 bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h4 className="text-lg sm:text-xl font-semibold text-slate-900 mb-6 border-b border-slate-200 pb-4">Product Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.productName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 ${errors.productName ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'}`}
                    placeholder="Enter product name"
                  />
                  {errors.productName && <p className="text-red-600 text-sm mt-2 font-medium">{errors.productName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 ${errors.quantity ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'}`}
                    placeholder="Enter quantity"
                  />
                  {errors.quantity && <p className="text-red-600 text-sm mt-2 font-medium">{errors.quantity}</p>}
                </div>

                {/* Removed global Special Request toggle; discount is now controlled per row */}



                <div className="flex items-end">
                  <button type="button" onClick={handleAddItem} className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-semibold flex items-center justify-center gap-2 shadow-md">
                    <Plus className="h-5 w-5" />
                    Add Item
                  </button>
                </div>

              </div>


          {/*/////////added table for product////////////*/}
              {items.length > 0 && (
                <div className="mt-6 overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden rounded-lg border-2 border-slate-200 shadow-sm">
                      <table className="min-w-[760px] w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100 sticky top-0 z-10">
                          <tr>
                            <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">No</th>
                            <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Product Name</th>
                            <th scope="col" className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Qty</th>
                            <th scope="col" className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Unit Price</th>
                            <th scope="col" className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider" title="Enable per-row discount">Disc On?</th>
                            <th scope="col" className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider" title="Per unit discount when enabled">Discount</th>
                            <th scope="col" className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Total</th>
                            <th scope="col" className="px-3 sm:px-4 py-4 text-right"></th>
                          </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-slate-100">

                          {items.map((it, idx) => {
                            const Discount = (Number(it.discount) || 0) * (Number(it.quantity) || 0);
                            const Total = (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0);
                            const rowTotal = Total - Discount;

                            return (
                              <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">{idx + 1}</td>
                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-900 font-semibold">{it.name}</td>
                                <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="1"
                                    value={it.quantity}
                                    onChange={(e) => updateItemField(it.id, 'quantity', parseInt(e.target.value) || 0)}
                                    aria-label={`Quantity for ${it.name}`}
                                    className="w-20 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white"
                                  />
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={it.unitPrice}
                                    onChange={(e) => updateItemField(it.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    aria-label={`Unit price for ${it.name}`}
                                    className="w-28 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white"
                                  />
                                </td>

                                {/*toggle button for discount enable*/}
                                <td className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={!!it.discountEnabled}
                                    aria-disabled={it.discountEnabled}
                                    disabled={it.discountEnabled}
                                    onClick={() => {
                                      if (it.discountEnabled) return; // one-time enable only
                                      setItems(prev => prev.map(row => (
                                        row.id === it.id
                                          ? { ...row, discountEnabled: true }
                                          : row
                                      )));
                                    }}
                                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${it.discountEnabled ? 'bg-slate-600 opacity-70 cursor-not-allowed' : 'bg-slate-300 hover:bg-slate-400'}`}
                                    title={it.discountEnabled ? 'Discount enabled (locked)' : 'Enable discount for this row'}
                                  >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${it.discountEnabled ? 'translate-x-6' : 'translate-x-1'}`}/>
                                    <span className="sr-only">Toggle discount</span>
                                  </button>
                                </td>


                                <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={it.discount}
                                    onChange={(e) => updateItemField(it.id, 'discount', parseFloat(e.target.value) || 0)}
                                    disabled={!it.discountEnabled}
                                    aria-label={`Per-unit discount for ${it.name}`}
                                    title={!it.discountEnabled ? 'Enable discount in this row to edit' : undefined}
                                    className={`w-24 px-3 py-2 border-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-60 ${!it.discountEnabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'border-slate-300 bg-slate-50 hover:bg-white'}`}
                                  />
                                </td>

                                 {/*total amount*/}
                                <td className="px-4 sm:px-6 py-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">{formatLKR(rowTotal)}</td> 


                                <td className="px-3 sm:px-4 py-4 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => deleteItem(it.id)}
                                    className="inline-flex items-center justify-center rounded-lg p-2 text-red-600 hover:text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors border border-red-200 hover:border-red-600"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            
            </div>

            <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center gap-3 shadow-lg w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Invoice...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Create Invoice
                  </>
                )}
              </button>
            </div>
            </div>
          </form>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowPaymentModal(false)}
              aria-hidden="true"
            />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h3 className="text-xl font-semibold text-slate-800">Set Payment</h3>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-500 hover:text-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors duration-200"
                  aria-label="Close payment modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 text-sm text-slate-600">
                  Total Payable: <span className="font-semibold text-slate-800">{formatLKR(pendingInvoice?.amount || tableTotal)}</span>
                </div>
                <Payment onSetPayment={finalizeInvoiceWithPayment} />
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Invoice created">
            <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-md border border-slate-200">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-7 w-7 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900">Success</h3>
                  <p className="mt-2 text-sm text-slate-700">{successText || "Invoice created successfully."}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSuccess(false)}
                  className="ml-2 text-slate-500 hover:text-slate-700 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSuccess(false)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-semibold"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Modal */}
        {isSubmitting && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" role="status" aria-live="polite">
            <div className="bg-white rounded-xl shadow-xl p-6 flex items-center gap-4 border border-slate-200">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-slate-800 font-medium">Creating invoice…</span>
            </div>
          </div>
        )}
      </>
    );
  };

    
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/*  Create New Invoice */}
        <section aria-label="Create new invoice">
          <InlineNewInvoiceForm nextInvoiceId={nextInvoiceId} />
        </section>


        {/* Filters and Search removed as requested */}


        {/* Invoices list and details sections removed */}
      </div>

      {/* Payment Modal (rendered at page level to avoid stacking context issues) */}
      {/* Note: The InlineNewInvoiceForm owns its own modal state; move modal here if lifting state up in future */}
    </div>
  );
};

export default Invoices;