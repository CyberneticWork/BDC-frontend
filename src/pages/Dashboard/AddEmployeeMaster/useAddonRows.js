import { useEmployeeForm } from "@contexts/EmployeeFormContext";

/** Array field on the employee form (e.g. "qualifications") with add/remove/change helpers. */
export default function useAddonRows(field, emptyRow) {
  const { formData, setFormData } = useEmployeeForm();
  const rows = Array.isArray(formData[field]) ? formData[field] : [];

  const setRows = (updater) =>
    setFormData((prev) => ({
      ...prev,
      [field]: updater(Array.isArray(prev[field]) ? prev[field] : []),
    }));

  return {
    rows,
    add: () => setRows((current) => [...current, { ...emptyRow }]),
    remove: (index) => setRows((current) => current.filter((_, i) => i !== index)),
    change: (index, key, value) =>
      setRows((current) => current.map((row, i) => (i === index ? { ...row, [key]: value } : row))),
  };
}
