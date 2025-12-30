import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { X, Download, Printer, FileText, CheckCircle, ExternalLink } from "lucide-react";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Modal Component for PDF Preview
function PdfPreviewModal({
  isOpen,
  onClose,
  pdfBlob,
  orderNumber,
  onDownload,
  onPrint,
  documentLabel = "Sales Order",
}) {
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pdfBlob]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4"
      onClick={(e) => {
        // Close when clicking the backdrop (but not when clicking inside the modal)
        if (e.target === e.currentTarget) onClose && onClose();
      }}
    >
      <div className="relative flex flex-col lg:flex-row w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        {/* Always-visible close button (top-right) */}
        <button
          onClick={onClose}
          aria-label="Close preview"
          className="absolute top-3 right-3 z-50 p-2 sm:p-2.5 bg-white/95 hover:bg-white rounded-full shadow-lg border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <X className="w-5 h-5" />
        </button>
        {/* Left Panel - Preview */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Generated {documentLabel}
                </h3>
                <p className="text-sm text-slate-600">Number: {orderNumber}</p>
              </div>
            </div>
            {/* header actions (close button moved to top-right for consistent visibility) */}
          </div>
          
          <div className="flex-1 p-2 sm:p-3 overflow-auto">
            <div className="w-full h-[36vh] sm:h-[46vh] md:h-[50vh] lg:h-[54vh] xl:h-[58vh] border-2 border-dashed border-slate-300 rounded-xl overflow-hidden">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full min-h-[200px] sm:min-h-[320px]"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Actions */}
        <div className="w-full sm:w-80 md:w-80 lg:w-80 xl:w-96 bg-gradient-to-b from-white to-slate-50 p-4 sm:p-6">
          <div className="sticky top-6 space-y-6">
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h4 className="font-bold text-green-900 text-lg">PDF Ready!</h4>
              <p className="text-sm text-green-700 mt-1">
                Your {documentLabel.toLowerCase()} has been generated successfully
              </p>
            </div>

            <div className="space-y-4">
              <h5 className="font-semibold text-slate-900">Available Actions</h5>
              
              <button
                onClick={onDownload}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-xl transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                    <Download className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-blue-900">Download PDF</p>
                    <p className="text-sm text-blue-700">Save to your device</p>
                  </div>
                </div>
                <span className="text-xs font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  Recommended
                </span>
              </button>

              <button
                onClick={onPrint}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border border-slate-200 rounded-xl transition-all duration-200"
              >
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Printer className="w-5 h-5 text-slate-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Print Directly</p>
                  <p className="text-sm text-slate-700">Send to printer</p>
                </div>
              </button>

              <button
                onClick={() => {
                  if (pdfUrl) {
                    window.open(pdfUrl, '_blank');
                  }
                }}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 border border-purple-200 rounded-xl transition-all duration-200"
              >
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ExternalLink className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-purple-900">Open in New Tab</p>
                  <p className="text-sm text-purple-700">View in browser</p>
                </div>
              </button>

              {/* Share button removed per request */}
            </div>

            <div className="pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-4">
                The PDF will be automatically saved to your device. You can also:
              </p>
            
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SuccessPdfView({
  orderData,
  pdfUrl,
  onGeneratePdf,
  isGeneratingPdf,
  documentType,
}) {
  const [localGenerating, setLocalGenerating] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);
  const [generationComplete, setGenerationComplete] = useState(false);

  const generating = typeof isGeneratingPdf === "boolean" ? isGeneratingPdf : localGenerating;
  const resolvedDocumentType =
    documentType ?? orderData?.documentType ?? "Sales Order";
  const docLabel = String(resolvedDocumentType || "Sales Order").trim() || "Sales Order";
  const isInvoice = docLabel.toLowerCase() === "invoice";
  const isPurchaseOrder = docLabel.toLowerCase() === "purchase order";
  const isPurchaseReturn = docLabel.toLowerCase() === "purchase return";
  const isSupplierDocument =
    isPurchaseOrder ||
    isPurchaseReturn ||
    ["grn", "goods received note", "goods received note (grn)"]
      .includes(docLabel.toLowerCase());
  const paidAmountSource =
    orderData?.paidAmount ??
    orderData?.payment?.amount ??
    orderData?.payment?.paidAmount ??
    orderData?.payment?.paid;
  const paidAmountValue = Number(paidAmountSource ?? 0);
  const showPaidAmount = isInvoice && paidAmountSource != null && Number.isFinite(paidAmountValue);
  const hasOrder = Boolean(orderData && orderData.items?.length);
  const items = orderData?.items || [];
  const formatCurrency =
    orderData?.currencyFormat ??
    ((value) => `LKR ${Number(value || 0).toFixed(2)}`);
  const discountLevelLabel =
    orderData?.discountLevelLabel || orderData?.discountLevel?.name ||
    orderData?.discountLevel?.label ||
    "Standard";
  
  // For supplier documents (Purchase Order, GRN), use supplier info; otherwise use customer info
  const partyLabel = isSupplierDocument ? "Supplier" : "Customer";
  const partyName = isSupplierDocument
    ? (orderData?.supplier ||
       orderData?.supplierName ||
       orderData?.supplier_name ||
       orderData?.vendorName ||
       orderData?.vendor ||
       "—")
    : (orderData?.customer ||
       orderData?.customerName ||
       orderData?.name ||
       orderData?.customer_full_name ||
       orderData?.customerDisplayName ||
       orderData?.companyName ||
       "—");
  const partyPhone = isSupplierDocument
    ? (orderData?.supplierPhone ||
       orderData?.supplierTelephone ||
       orderData?.supplier_phone ||
       orderData?.phone_number ||
       orderData?.vendorPhone ||
       "—")
    : (orderData?.customerTelephone ||
       orderData?.customerPhone ||
       orderData?.telephone ||
       orderData?.phone ||
       orderData?.contactNumber ||
       orderData?.mobile ||
       "—");
    const partyAddress = isSupplierDocument
     ? (
       orderData?.supplierAddress ||
       [orderData?.address1, orderData?.address2].filter(Boolean).join(", ") ||
       orderData?.supplier_address ||
       orderData?.vendorAddress ||
       "—"
      )
    : (orderData?.customerAddress ||
       orderData?.billingAddress ||
       orderData?.address ||
       "—");
  

  const orderNumber = orderData?.orderNumber || "—";
  const referenceNumber = orderData?.refNumber || "—";
  const totalAmount = formatCurrency(orderData?.totalAmount);
  const discountAmount = Number(
    orderData?.discountTotal ?? orderData?.discountAmount ?? 0
  );
  const formattedDiscount = formatCurrency(discountAmount);

  const generatePdf = async () => {
    if (!orderData) return;
    
    if (typeof onGeneratePdf === "function") {
      return onGeneratePdf(orderData);
    }

    try {
      setLocalGenerating(true);
      setGenerationComplete(false);
      
      // Generate PDF
      const order = orderData;
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const headerTop = 40;
      const leftX = margin;
      
      // Header
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text(("INVENTORY").toUpperCase(), leftX, headerTop);
      doc.setFontSize(18);
      doc.setTextColor(20);
      doc.text(docLabel, leftX, headerTop + 18);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(`Number: ${order.orderNumber || "—"}`, leftX, headerTop + 36);
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.text(`Discount Level: ${order.discountLevelLabel || "Standard"}`, leftX, headerTop + 52);
      doc.text(`Reference Number: ${order.refNumber || "—"}`, leftX, headerTop + 64);
      
      // Customer/Supplier on right
      const customerBlockWidth = 220;
      const rightBlockX = pageWidth - margin - customerBlockWidth;
      const rightTextX = rightBlockX + customerBlockWidth;
      const custY = headerTop;
      // Render address as a single line (collapse whitespace)
      const addrOneLine = String(partyAddress || "—").replace(/\s+/g, " ").trim();
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.text(`${partyLabel} Details:`, rightTextX, custY, { align: "right" });
      doc.text(`${partyName}`, rightTextX, custY + 12, { align: "right" });
      doc.setFont(undefined, "normal");
      doc.text(addrOneLine, rightTextX, custY + 24, { align: "right" });
      doc.text(`Tel: ${partyPhone}`, rightTextX, custY + 36, { align: "right" });

      // Table
      const tableRows = (order.items || []).map((item, index) => {
        const qty = item.quantity ?? 0;
        const unitPrice = item.unitPrice ?? 0;
        const discount =
          item.lineDiscountAmount ??
          item.lineDiscount ??
          item.discountAmount ??
          item.discount ??
          0;
        const lineTotal = item.lineNet ?? item.total ?? item.lineTotal ?? 0;
        const fmt = order.currencyFormat || ((v) => `LKR ${Number(v || 0).toFixed(2)}`);
        return [
          index + 1,
          item.productName || "—",
          qty,
          fmt(unitPrice),
          fmt(discount),
          fmt(lineTotal),
        ];
      });

      // Add total amount inside the table
      tableRows.push([
        "",
        "",
        "",
        "",
        "Total Anmount",
        (order.currencyFormat || ((v) => `LKR ${Number(v || 0).toFixed(2)}`))(
          order.totalAmount ?? 0
        ),
      ]);

      const table = autoTable(doc, {
        head: [["#", "Product", "Qty", "Unit", "Discount", "Total"]],
        body: tableRows,
        startY: headerTop + 80,
        theme: "striped",
        headStyles: { fillColor: [200, 200, 200], textColor: 20, fontSize: 10 },
        styles: { fontSize: 10 },
      });

      // Totals
      const totalY = (table?.finalY || headerTop + 80) + 80;
      const discountAmount = Number(order.discountTotal ?? order.discountAmount ?? order.totalDiscount ?? 0);
      const totalValue = Number(order.totalAmount ?? 0);
      const rightX = pageWidth - margin;
      doc.setFontSize(10);
      doc.setTextColor(20);
      doc.setFont(undefined, "normal");
      const formatLKR = (v) => {
        try { return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(v||0)); } catch { return `LKR ${Number(v||0).toFixed(2)}`; }
      };
      doc.text(`Discount: ${formatLKR(discountAmount)}`, rightX, totalY, { align: 'right' });
      let summaryY = totalY + 18;
      if (showPaidAmount) {
        doc.text(`Paid Amount: ${formatLKR(paidAmountValue)}`, rightX, summaryY, { align: 'right' });
        summaryY += 18;
      }
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(`Total: ${formatLKR(totalValue)}`, rightX, summaryY, { align: 'right' });

      // Footer credit
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text('Implemented by Cybernetic', pageWidth / 2, (doc.internal.pageSize.getHeight() - 30), { align: 'center' });

      // Get PDF as blob for preview
      const pdfBlob = doc.output('blob');
      setGeneratedPdfBlob(pdfBlob);
      setGenerationComplete(true);

      // Show preview modal (no auto-download)
      setTimeout(() => {
        setShowPdfPreview(true);
      }, 300);
      
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setLocalGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedPdfBlob) {
      const url = URL.createObjectURL(generatedPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      const downloadLabel = docLabel.replace(/\s+/g, "-") || "Sales-Order";
      a.download = `${downloadLabel}-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    if (generatedPdfBlob) {
      const url = URL.createObjectURL(generatedPdfBlob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 100);
      };
    }
  };

  return (
    <>
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-4 text-slate-900 shadow-xl">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm lg:flex-row lg:items-start">
          <div className="lg:flex-1">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              INVENTORY
            </p>
            <h2 className="text-3xl font-bold text-slate-900">
              {orderData ? docLabel : "Preview"}
            </h2>
            <p className="mt-1 text-lg font-semibold text-slate-700">
              Number: {orderNumber}
            </p>
            <div className="mt-3 grid gap-2 text-xs">
              <div>
                <p className="text-[0.6rem] uppercase text-slate-500">Discount Level</p>
                <p className="font-semibold text-slate-900">{discountLevelLabel}</p>
              </div>
              <div>
                <p className="text-[0.6rem] uppercase text-slate-500">Reference Number</p>
                <p className="font-semibold text-slate-900">{referenceNumber}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:w-1/3 lg:items-end">
            <div className="relative">
              <button
                type="button"
                onClick={generatePdf}
                disabled={!orderData || generating}
                className="group relative self-stretch rounded-full border border-slate-200 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed lg:self-end overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Generating PDF…
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Generate PDF
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              
              {generationComplete && !showPdfPreview && (
                <div className="absolute -top-2 -right-2">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping bg-green-400 rounded-full opacity-75"></div>
                    <div className="relative p-1 bg-green-500 rounded-full">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="w-full p-4 text-sm text-slate-800">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-500">
                  {partyLabel}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {partyName}
                </p>
                <p className="text-xs text-slate-500">{partyAddress}</p>
                <p className="text-xs text-slate-500">{partyPhone}</p>
              </div>
              {showPaidAmount && (
                <div className="mt-4">
                  <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-500">
                    Paid Amount
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatCurrency(paidAmountValue)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {hasOrder ? (
          <>
            <div className="border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead>
                    <tr className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Discount</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => {
                      const qty = item.quantity ?? 0;
                      const unitPrice = item.unitPrice ?? 0;
                      const discount =
                        item.lineDiscountAmount ??
                        item.lineDiscount ??
                        item.discountAmount ??
                        item.discount ??
                        0;
                      const lineTotal = item.lineNet ?? item.total ?? item.lineTotal ?? 0;
                      return (
                        <tr
                          key={item.id ?? index}
                          className="even:bg-white odd:bg-slate-50 hover:bg-slate-100/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {item.productName}
                          </td>
                          <td className="px-4 py-3">{qty}</td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            {formatCurrency(unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            {formatCurrency(discount)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {formatCurrency(lineTotal)}
                          </td>
                        </tr>
                      );
                    })}

                   
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="mt-4 px-6 py-5 text-right font-bold text-black">
                <p className="text-xs uppercase tracking-[0.2em] text-black-300">Discount : {formattedDiscount}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-black-300">Total Amount</p>
                <p className="text-3xl font-bold">{totalAmount}</p>
                {showPaidAmount && (
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-black-300">
                    Paid Amount : {formatCurrency(paidAmountValue)}
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-600">
            <p className="font-semibold text-slate-900">No order data provided.</p>
            <p className="mt-2">Use the <code>?url=/path/to/file.pdf</code> query to load a PDF preview.</p>
            {pdfUrl && (
              <div className="mt-4">
                  <iframe
                    title="success-pdf-iframe"
                    src={pdfUrl}
                    className="h-48 w-full rounded-xl border border-slate-200"
                  />
                </div>
            )}
          </div>
        )}

        <p className="text-center text-xs font-medium uppercase tracking-[0.4em] text-slate-500">
          Implemented by Cybernetic
        </p>
      </div>

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        pdfBlob={generatedPdfBlob}
        orderNumber={orderNumber}
        onDownload={handleDownload}
        onPrint={handlePrint}
        documentLabel={docLabel}
      />
    </>
  );
}

// Add CSS animations
const styles = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default function SuccessPdf() {
  const query = useQuery();
  const pdfUrl = query.get("url");
  return <SuccessPdfView pdfUrl={pdfUrl} />;
}