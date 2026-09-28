import React from "react";
import { Plus, Trash2 } from "lucide-react";

const AddonRowList = ({ title, subtitle, icon, rows, onAdd, onRemove, renderRow, columns = "lg:grid-cols-4" }) => (
  <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
          {icon}
          {title}
          <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
            {rows.length}
          </span>
        </h2>
        <p className="text-gray-500 text-sm pl-7">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <Plus size={16} /> Add
      </button>
    </div>

    {rows.length === 0 && <p className="text-sm text-gray-500 pl-7">None added.</p>}

    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={index} className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">#{index + 1}</span>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
          <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${columns}`}>{renderRow(row, index)}</div>
        </div>
      ))}
    </div>
  </div>
);

export default AddonRowList;
