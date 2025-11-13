import React, { useEffect, useState } from "react";
import { getPendingInvoices, approveInvoice, rejectInvoice } from "../../services/Inventory/pendingService";

const Pending = () => {
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState(new Set());

  useEffect(() => {
    const loadPendingInvoices = () => {
      const data = getPendingInvoices();
      setPendingInvoices(data);
    };
    loadPendingInvoices();
  }, []);

  const handleApprove = (id) => {
    approveInvoice(id);
    setPendingInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'approved' } : inv));
  };

  const handleReject = (id) => {
    rejectInvoice(id);
    setPendingInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'rejected' } : inv));
  };

  const toggleExpanded = (id) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredInvoices = pendingInvoices.filter(inv =>
    inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Pending Approvals
          </h1>
          <p className="text-gray-600 text-lg">Manage and review pending invoice requests</p>
        </div>

        {/* Search and Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all bg-purple-50"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg font-semibold">
                Pending: {filteredInvoices.filter(inv => !inv.status).length}
              </div>
              <div className="bg-gradient-to-r from-green-400 to-green-600 text-white px-4 py-2 rounded-lg font-semibold">
                Approved: {filteredInvoices.filter(inv => inv.status === 'approved').length}
              </div>
              <div className="bg-gradient-to-r from-red-400 to-red-600 text-white px-4 py-2 rounded-lg font-semibold">
                Rejected: {filteredInvoices.filter(inv => inv.status === 'rejected').length}
              </div>
            </div>
          </div>
        </div>

        {/* Compact Invoice Rows */}
        <div className="space-y-4">
          {filteredInvoices.map((inv, index) => (
            <div key={inv.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
              {/* Compact Row Header */}
              <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-lg font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{inv.id}</h3>
                      <p className="text-purple-100 text-sm">{inv.customer} • {new Date(inv.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xl font-bold">${inv.amount}</div>
                      <div className="text-purple-100 text-sm">{inv.quantity} items</div>
                    </div>
                    <button
                      onClick={() => toggleExpanded(inv.id)}
                      className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
                    >
                      <svg
                        className={`w-5 h-5 transition-transform duration-200 ${expandedItems.has(inv.id) ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status and Actions Row */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      inv.status === 'approved' ? 'bg-green-100 text-green-800' :
                      inv.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {inv.status || 'Pending Review'}
                    </span>
                    <span className="text-sm text-gray-500">Center: {inv.center}</span>
                    <span className="text-sm text-gray-500">Ref: {inv.refNumber || 'N/A'}</span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleApprove(inv.id)}
                      disabled={inv.status !== null}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleReject(inv.id)}
                      disabled={inv.status !== null}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable Details Section */}
              {expandedItems.has(inv.id) && (
                <div className="px-6 py-6 bg-white border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-semibold text-purple-800">Customer</span>
                      </div>
                      <p className="text-gray-700 font-medium">{inv.customer}</p>
                      <p className="text-sm text-gray-500">Ref: {inv.refNumber || 'N/A'}</p>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold text-blue-800">Date & Center</span>
                      </div>
                      <p className="text-gray-700 font-medium">{new Date(inv.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">Center: {inv.center}</p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-semibold text-green-800">Payment</span>
                      </div>
                      <p className="text-gray-700 font-medium capitalize">{inv.payment.mode}</p>
                      <p className="text-sm text-gray-500">${inv.payment.amount}</p>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-semibold text-orange-800">Created By</span>
                      </div>
                      <p className="text-gray-700 font-medium">User ID: {inv.created_by}</p>
                      <p className="text-sm text-gray-500">Product: {inv.productName}</p>
                    </div>
                  </div>

                  {/* Items Section */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Items Details ({inv.items.length})
                    </h4>
                    <div className="space-y-3">
                      {inv.items.map((item, itemIndex) => (
                        <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                                  {itemIndex + 1}
                                </span>
                                <span className="font-semibold text-gray-800">{item.name}</span>
                              </div>
                              <div className="text-sm text-gray-600 ml-8">
                                Product ID: {item.productId} | Item ID: {item.id}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">${item.unitPrice}</div>
                              <div className="text-sm text-gray-500">per unit</div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">Qty: {item.quantity}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">Discount: ${item.discount}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className={`w-4 h-4 ${item.discountEnabled ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className={`text-sm font-medium ${item.discountEnabled ? 'text-green-700' : 'text-gray-500'}`}>
                                  Discount {item.discountEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Subtotal</div>
                              <div className="text-lg font-bold text-purple-600">
                                ${(item.unitPrice * item.quantity - item.discount).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending approvals found</h3>
            <p className="text-gray-600">All invoices have been processed or try adjusting your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pending;