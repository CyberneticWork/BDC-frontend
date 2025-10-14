import React, { useState, useEffect } from "react";
import {Plus,Trash2} from "lucide-react";
import {getInvoiceData,addInvoice} from '../../services/Inventory/inventoryService';

const Invoices = () => {

  const [invoices, setInvoices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextInvoiceId, setNextInvoiceId] = useState('');

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
      
      setIsSubmitting(true);
      
      try {
        // Prepare invoice payload
        const firstItem = items[0];
        // Compute amount consistent with table total (include discounts)
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
        
        const newInvoice = addInvoice(invoiceData);
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
      } catch (error) {
        console.error('Error creating invoice:', error);
      } finally {
        setIsSubmitting(false);
      }
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
                  aria-invalid={!!errors.date}
                  aria-describedby={errors.date ? 'date-error' : undefined}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.date ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.date && <p id="date-error" className="text-red-500 text-sm mt-1">{errors.date}</p>}
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
                  aria-invalid={!!(errors.customer || errors.customerEmail)}
                  aria-describedby={(errors.customer || errors.customerEmail) ? 'customer-error' : undefined}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${(errors.customer || errors.customerEmail) ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select customer </option>
                  {availableCustomers.map(c => (
                    <option key={c.email} value={c.email}>{`${c.name} (${c.email})`}</option>
                  ))}
                </select>
                {(errors.customer || errors.customerEmail) && (
                  <p id="customer-error" className="text-red-500 text-sm mt-1">Customer details are required</p>
                )}
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 mb-4 sm:mb-6">
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

            {/*total amount section*/}
              <div className="lg:place-self-end pr-65 text-center ">
                <p className="text-[18px]">Total Amount</p>
                <p className="text-[35px] font-medium">
                  {formatLKR(tableTotal)}
                </p>
              </div>
            </div>

            {/* Product Section */}
            <div className="mb-4 sm:mb-6">
              <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Product Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.productName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.productName ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter product name"
                  />
                  {errors.productName && <p className="text-red-500 text-sm mt-1">{errors.productName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.quantity ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter quantity"
                  />
                  {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                </div>

                {/* Removed global Special Request toggle; discount is now controlled per row */}



                <div className="flex items-end">
                  <button type="button" onClick={handleAddItem} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 ">
                    <Plus className="h-4 w-4" />
                    Add to List
                  </button>
                </div>

              </div>


          {/*/////////added table for product////////////*/}
              {items.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                      <table className="min-w-[760px] w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th scope="col" className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                            <th scope="col" className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Name</th>
                            <th scope="col" className="px-3 sm:px-4 py-2 text-right text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                            <th scope="col" className="px-3 sm:px-4 py-2 text-right text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Price</th>
                            <th scope="col" className="px-3 sm:px-4 py-2 text-center text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider" title="Enable per-row discount">Disc On?</th>
                            <th scope="col" className="px-3 sm:px-4 py-2 text-right text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider" title="Per unit discount when enabled">Discount</th>
                            <th scope="col" className="px-3 sm:px-4 py-2 text-right text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                            <th scope="col" className="px-2 sm:px-3 py-2 text-right"></th>
                          </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-100">

                          {items.map((it, idx) => {
                            const Discount = (Number(it.discount) || 0) * (Number(it.quantity) || 0);
                            const Total = (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0);
                            const rowTotal = Total - Discount;

                            return (
                              <tr key={it.id} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100/60">
                                <td className="px-3 sm:px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{idx + 1}</td>
                                <td className="px-3 sm:px-4 py-2 text-sm text-gray-900">{it.name}</td>
                                <td className="px-3 sm:px-4 py-2 text-right whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="1"
                                    value={it.quantity}
                                    onChange={(e) => updateItemField(it.id, 'quantity', parseInt(e.target.value) || 0)}
                                    aria-label={`Quantity for ${it.name}`}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </td>
                                <td className="px-3 sm:px-4 py-2 text-right whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={it.unitPrice}
                                    onChange={(e) => updateItemField(it.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    aria-label={`Unit price for ${it.name}`}
                                    className="w-28 px-2 py-1 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </td>

                                {/*toggle button for discount enable*/}
                                <td className="px-3 sm:px-4 py-2 text-center whitespace-nowrap">
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
                                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${it.discountEnabled ? 'bg-blue-600 opacity-60 cursor-not-allowed' : 'bg-gray-300'}`}
                                    title={it.discountEnabled ? 'Discount enabled (locked)' : 'Enable discount for this row'}
                                  >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${it.discountEnabled ? 'translate-x-5' : 'translate-x-1'}`}/>
                                    <span className="sr-only">Toggle discount</span>
                                  </button>
                                </td>


                                <td className="px-3 sm:px-4 py-2 text-right whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={it.discount}
                                    onChange={(e) => updateItemField(it.id, 'discount', parseFloat(e.target.value) || 0)}
                                    disabled={!it.discountEnabled}
                                    aria-label={`Per-unit discount for ${it.name}`}
                                    title={!it.discountEnabled ? 'Enable discount in this row to edit' : undefined}
                                    className={`w-24 px-2 py-1 border rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60 ${!it.discountEnabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'border-gray-300'}`}
                                  />
                                </td>

                                 {/*total amount*/}
                                <td className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-900 text-right whitespace-nowrap">{formatLKR(rowTotal)}</td> 


                                <td className="px-2 sm:px-3 py-2 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => deleteItem(it.id)}
                                    className="inline-flex items-center justify-center rounded-md p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                                    aria-label={`Remove ${it.name} from list`}
                                  >
                                    <Trash2 className="h-4 w-4" />
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

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2 w-full "
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

    
  

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/*  Create New Invoice */}
        <section aria-label="Create new invoice">
          <InlineNewInvoiceForm nextInvoiceId={nextInvoiceId} />
        </section>


        {/* Filters and Search removed as requested */}


        {/* Invoices list and details sections removed */}
      </div>
    </div>
  );
};

export default Invoices;