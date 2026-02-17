import React from "react";
import { X } from "lucide-react";

/**
 * Generic modal shell for Inventory pages.
 * Provides a consistent overlay, header, and optional footer slot.
 */
const InventoryPopup = ({
  isOpen,
  title,
  subtitle,
  children,
  footer = null,
  onClose,
  widthClass = "max-w-3xl",
  closeOnOverlay = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (closeOnOverlay) onClose?.();
        }}
        aria-hidden="true"
      />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full mx-4 ${widthClass}`} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            {title && <h3 className="text-xl font-semibold text-slate-800">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors duration-200"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
        {footer && (
          <div className="px-6 pb-6 border-t border-slate-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPopup;
