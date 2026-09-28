import React from "react";
import { GraduationCap, BookOpen, School, Award } from "lucide-react";
import { useEmployeeForm } from "@contexts/EmployeeFormContext";
import AddonRowList from "./AddonRowList";
import useAddonRows from "./useAddonRows";

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

const LECTURE_TYPES = ["Weekday", "Weekend"];

const emptySchoolResults = {
  ol: { englishGrade: "", mathsGrade: "", yearSat: "" },
  al: { syllabus: "", stream: "", yearSat: "" },
};

const emptyQualification = {
  qualificationType: "",
  courseName: "",
  instituteName: "",
  completionYear: "",
};

const emptyFollowing = {
  qualificationName: "",
  instituteName: "",
  startMonth: "",
  endMonth: "",
  lectureType: "",
};

const currentYear = new Date().getFullYear();

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const Field = ({ label, required, children }) => (
  <div>
    <label className="mb-1 block text-xs font-semibold text-gray-600">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
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

const YearInput = ({ value, onChange, max = currentYear + 1 }) => (
  <input
    type="number"
    className={inputClass}
    placeholder={String(currentYear)}
    min={1950}
    max={max}
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
  const qualifications = useAddonRows("qualifications", emptyQualification);
  const following = useAddonRows("followingQualifications", emptyFollowing);
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
          <AddonRowList
            title="Qualifications"
            subtitle="Add every completed qualification — for example 7 diplomas and 2 degrees."
            icon={<GraduationCap className="text-blue-500" size={20} />}
            rows={qualifications.rows}
            onAdd={qualifications.add}
            onRemove={qualifications.remove}
            renderRow={(row, index) => (
              <>
                <Field label="Qualification" required>
                  <select
                    className={inputClass}
                    value={row.qualificationType}
                    onChange={(e) => qualifications.change(index, "qualificationType", e.target.value)}
                  >
                    <option value="">Select qualification</option>
                    {QUALIFICATION_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Course / field">
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Accounting"
                    value={row.courseName}
                    onChange={(e) => qualifications.change(index, "courseName", e.target.value)}
                  />
                </Field>
                <Field label="Name of institute" required>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. University of Colombo"
                    value={row.instituteName}
                    onChange={(e) => qualifications.change(index, "instituteName", e.target.value)}
                  />
                </Field>
                <Field label="Completion year" required>
                  <YearInput
                    value={row.completionYear}
                    max={currentYear + 10}
                    onChange={(v) => qualifications.change(index, "completionYear", v)}
                  />
                </Field>
              </>
            )}
          />
        )}

        {packs.following && (
          <AddonRowList
            title="Following qualifications"
            subtitle="Qualifications the employee is currently studying for."
            icon={<BookOpen className="text-blue-500" size={20} />}
            columns="lg:grid-cols-5"
            rows={following.rows}
            onAdd={following.add}
            onRemove={following.remove}
            renderRow={(row, index) => (
              <>
                <Field label="Name of the qualification" required>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. BSc in Management"
                    maxLength={191}
                    value={row.qualificationName}
                    onChange={(e) => following.change(index, "qualificationName", e.target.value)}
                  />
                </Field>
                <Field label="Institute" required>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. SLIIT"
                    maxLength={191}
                    value={row.instituteName}
                    onChange={(e) => following.change(index, "instituteName", e.target.value)}
                  />
                </Field>
                <Field label="Starting year & month" required>
                  <input
                    type="month"
                    className={inputClass}
                    value={row.startMonth}
                    onChange={(e) => following.change(index, "startMonth", e.target.value)}
                  />
                </Field>
                <Field label="Ending year & month">
                  <input
                    type="month"
                    className={inputClass}
                    min={row.startMonth || undefined}
                    value={row.endMonth}
                    onChange={(e) => following.change(index, "endMonth", e.target.value)}
                  />
                </Field>
                <Field label="Lecture type" required>
                  <select
                    className={inputClass}
                    value={row.lectureType}
                    onChange={(e) => following.change(index, "lectureType", e.target.value)}
                  >
                    <option value="">Select</option>
                    {LECTURE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>
              </>
            )}
          />
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
