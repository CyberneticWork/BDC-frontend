import React from "react";
import { GraduationCap, BookOpen, Plus, Trash2, School, Award } from "lucide-react";
import { useEmployeeForm } from "@contexts/EmployeeFormContext";

const QUALIFICATION_TYPES = [
  "Certificate",
  "Diploma",
  "Higher Diploma",
  "Higher National Diploma",
  "Bachelors",
  "Bachelors Honours",
  "Postgraduate Certificate",
  "Post Graduate Diploma",
  "Masters by Course Work",
  "Masters with Course Work and a Research Component",
  "Master of Philosophy",
  "Doctorate",
];

const OL_GRADES = ["A*", "A", "B", "C", "D", "E", "S", "F", "W", "U"];

const AL_SYLLABUSES = ["National", "Cambridge", "AQA"];

const AL_STREAM_SUGGESTIONS = [
  "Physical Science (Mathematics)",
  "Biological Science",
  "Commerce",
  "Arts",
  "Engineering Technology",
  "Bio-systems Technology",
];

const emptySchoolResults = {
  ol: { englishGrade: "", mathsGrade: "", yearSat: "" },
  al: { syllabus: "", stream: "", yearSat: "" },
};

const emptyRow = (status) => ({
  status,
  qualificationType: "",
  courseName: "",
  instituteName: "",
  completionYear: "",
});

const currentYear = new Date().getFullYear();

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const QualificationSection = ({ title, subtitle, icon, status, yearLabel, yearRequired, rows, onAdd, onChange, onRemove }) => (
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
        onClick={() => onAdd(status)}
        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <Plus size={16} /> Add
      </button>
    </div>

    {rows.length === 0 && (
      <p className="text-sm text-gray-500 pl-7">None added.</p>
    )}

    <div className="space-y-3">
      {rows.map(({ row, index }, position) => (
        <div key={index} className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              #{position + 1}
            </span>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Qualification <span className="text-red-500">*</span>
              </label>
              <select
                className={inputClass}
                value={row.qualificationType}
                onChange={(e) => onChange(index, "qualificationType", e.target.value)}
              >
                <option value="">Select qualification</option>
                {QUALIFICATION_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Course / field</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. Accounting"
                value={row.courseName}
                onChange={(e) => onChange(index, "courseName", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Name of institute <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. University of Colombo"
                value={row.instituteName}
                onChange={(e) => onChange(index, "instituteName", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                {yearLabel} {yearRequired && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                className={inputClass}
                placeholder={String(currentYear)}
                min={1950}
                max={currentYear + 10}
                value={row.completionYear}
                onChange={(e) => onChange(index, "completionYear", e.target.value.slice(0, 4))}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SchoolCard = ({ title, subtitle, icon, children }) => (
  <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
    <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
      {icon}
      {title}
    </h2>
    <p className="text-gray-500 text-sm pl-7 mb-4">{subtitle}</p>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 rounded-lg border border-gray-200 bg-white p-3">
      {children}
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="mb-1 block text-xs font-semibold text-gray-600">{label}</label>
    {children}
  </div>
);

const YearInput = ({ value, onChange }) => (
  <input
    type="number"
    className={inputClass}
    placeholder={String(currentYear)}
    min={1950}
    max={currentYear + 1}
    value={value}
    onChange={(e) => onChange(e.target.value.slice(0, 4))}
  />
);

const GradeSelect = ({ value, onChange }) => (
  <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
    <option value="">Select grade</option>
    {OL_GRADES.map((grade) => (
      <option key={grade} value={grade}>{grade}</option>
    ))}
  </select>
);

const EmployeeQualifications = ({ onNext, onPrevious, packs = { qualifications: true } }) => {
  const { formData, setFormData } = useEmployeeForm();
  const all = Array.isArray(formData.qualifications) ? formData.qualifications : [];
  const school = {
    ol: { ...emptySchoolResults.ol, ...(formData.schoolResults?.ol || {}) },
    al: { ...emptySchoolResults.al, ...(formData.schoolResults?.al || {}) },
  };

  const setSchool = (level, field, value) =>
    setFormData((prev) => {
      const current = prev.schoolResults || emptySchoolResults;
      return {
        ...prev,
        schoolResults: {
          ...emptySchoolResults,
          ...current,
          [level]: { ...emptySchoolResults[level], ...(current[level] || {}), [field]: value },
        },
      };
    });

  const setRows = (updater) =>
    setFormData((prev) => ({
      ...prev,
      qualifications: updater(Array.isArray(prev.qualifications) ? prev.qualifications : []),
    }));

  const handleAdd = (status) => setRows((rows) => [...rows, emptyRow(status)]);
  const handleRemove = (index) => setRows((rows) => rows.filter((_, i) => i !== index));
  const handleChange = (index, field, value) =>
    setRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  const withIndex = all.map((row, index) => ({ row, index }));
  const completed = withIndex.filter(({ row }) => row.status !== "following");
  const following = withIndex.filter(({ row }) => row.status === "following");

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        {packs.ol && (
          <SchoolCard
            title="O/L results"
            subtitle="G.C.E. Ordinary Level results for English and Mathematics."
            icon={<School className="text-blue-500" size={20} />}
          >
            <Field label="English">
              <GradeSelect value={school.ol.englishGrade} onChange={(v) => setSchool("ol", "englishGrade", v)} />
            </Field>
            <Field label="Mathematics">
              <GradeSelect value={school.ol.mathsGrade} onChange={(v) => setSchool("ol", "mathsGrade", v)} />
            </Field>
            <Field label="Year sat">
              <YearInput value={school.ol.yearSat} onChange={(v) => setSchool("ol", "yearSat", v)} />
            </Field>
          </SchoolCard>
        )}

        {packs.al && (
          <SchoolCard
            title="A/L details"
            subtitle="G.C.E. Advanced Level syllabus, subject stream and year sat."
            icon={<Award className="text-blue-500" size={20} />}
          >
            <Field label="Syllabus">
              <select
                className={inputClass}
                value={school.al.syllabus}
                onChange={(e) => setSchool("al", "syllabus", e.target.value)}
              >
                <option value="">Select syllabus</option>
                {AL_SYLLABUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Subject stream">
              <input
                type="text"
                list="al-stream-options"
                className={inputClass}
                placeholder="e.g. Commerce"
                maxLength={100}
                value={school.al.stream}
                onChange={(e) => setSchool("al", "stream", e.target.value)}
              />
              <datalist id="al-stream-options">
                {AL_STREAM_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>
            <Field label="Year sat">
              <YearInput value={school.al.yearSat} onChange={(v) => setSchool("al", "yearSat", v)} />
            </Field>
          </SchoolCard>
        )}

        {packs.qualifications && (
          <>
            <QualificationSection
              title="Qualifications"
              subtitle="Add every completed qualification — for example 7 diplomas and 2 degrees."
              icon={<GraduationCap className="text-blue-500" size={20} />}
              status="completed"
              yearLabel="Completion year"
              yearRequired
              rows={completed}
              onAdd={handleAdd}
              onChange={handleChange}
              onRemove={handleRemove}
            />
            <QualificationSection
              title="Following qualifications"
              subtitle="Qualifications the employee is currently studying for."
              icon={<BookOpen className="text-blue-500" size={20} />}
              status="following"
              yearLabel="Expected completion year"
              yearRequired={false}
              rows={following}
              onAdd={handleAdd}
              onChange={handleChange}
              onRemove={handleRemove}
            />
          </>
        )}

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

export default EmployeeQualifications;
