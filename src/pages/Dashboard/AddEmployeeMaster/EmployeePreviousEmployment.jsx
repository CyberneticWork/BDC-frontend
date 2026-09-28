import React from "react";
import { Briefcase } from "lucide-react";
import AddonRowList from "./AddonRowList";
import useAddonRows from "./useAddonRows";

const COMMENT_WORD_LIMIT = 50;

const emptyEmployment = {
  organizationName: "",
  lastDesignation: "",
  joinDate: "",
  lastDate: "",
  comments: "",
};

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const countWords = (text) => String(text || "").trim().split(/\s+/).filter(Boolean).length;

const limitWords = (text) => {
  if (countWords(text) <= COMMENT_WORD_LIMIT) return text;
  return String(text).trim().split(/\s+/).slice(0, COMMENT_WORD_LIMIT).join(" ");
};

const Field = ({ label, required, className = "", children }) => (
  <div className={className}>
    <label className="mb-1 block text-xs font-semibold text-gray-600">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const EmployeePreviousEmployment = ({ onNext, onPrevious }) => {
  const employments = useAddonRows("previousEmployments", emptyEmployment);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <AddonRowList
          title="Previous employment information"
          subtitle="Organizations the employee worked for before joining."
          icon={<Briefcase className="text-blue-500" size={20} />}
          rows={employments.rows}
          onAdd={employments.add}
          onRemove={employments.remove}
          renderRow={(row, index) => {
            const words = countWords(row.comments);
            return (
              <>
                <Field label="Organization name" required>
                  <input
                    type="text"
                    className={inputClass}
                    maxLength={191}
                    value={row.organizationName}
                    onChange={(e) => employments.change(index, "organizationName", e.target.value)}
                  />
                </Field>
                <Field label="Last designation">
                  <input
                    type="text"
                    className={inputClass}
                    maxLength={191}
                    value={row.lastDesignation}
                    onChange={(e) => employments.change(index, "lastDesignation", e.target.value)}
                  />
                </Field>
                <Field label="Join date">
                  <input
                    type="date"
                    className={inputClass}
                    value={row.joinDate}
                    onChange={(e) => employments.change(index, "joinDate", e.target.value)}
                  />
                </Field>
                <Field label="Last date">
                  <input
                    type="date"
                    className={inputClass}
                    min={row.joinDate || undefined}
                    value={row.lastDate}
                    onChange={(e) => employments.change(index, "lastDate", e.target.value)}
                  />
                </Field>
                <Field label="Comments" className="md:col-span-2 lg:col-span-4">
                  <textarea
                    rows={2}
                    className={inputClass}
                    placeholder="e.g. Reason for leaving, key responsibilities"
                    value={row.comments}
                    onChange={(e) => employments.change(index, "comments", limitWords(e.target.value))}
                  />
                  <p className={`mt-1 text-right text-xs ${words >= COMMENT_WORD_LIMIT ? "text-red-600" : "text-gray-500"}`}>
                    {words} / {COMMENT_WORD_LIMIT} words
                  </p>
                </Field>
              </>
            );
          }}
        />

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between space-x-4">
          <button
            type="button"
            onClick={onPrevious}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeePreviousEmployment;
