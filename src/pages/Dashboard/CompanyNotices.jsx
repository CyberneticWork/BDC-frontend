import React, { useEffect, useState } from "react";
import { Bell, Megaphone, Trash2 } from "lucide-react";
import { createHrNotice, deleteHrNotice, listHrNotices } from "../../services/BenefitPackService";
import { fetchDepartments } from "../../services/ApiDataService";

export default function CompanyNotices() {
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    scope: "all",
    department_id: "",
  });

  const load = async () => {
    try {
      const data = await listHrNotices();
      setItems(data.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Could not load notices");
    }
  };

  useEffect(() => {
    load();
    fetchDepartments().then((rows) => setDepartments(Array.isArray(rows) ? rows : [])).catch(() => setDepartments([]));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await createHrNotice(form);
      setMsg(res.message || "Notice sent");
      setForm({ title: "", body: "", scope: "all", department_id: "" });
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.message || "Could not send notice");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this notice from history?")) return;
    await deleteHrNotice(id);
    await load();
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Megaphone className="w-6 h-6 text-teal-700" /> Company notices
      </h1>
      <p className="text-sm text-slate-600">
        Send a message to all employees in this company, or only one department. It appears on the employee phone portal and as a push alert.
      </p>
      {msg && <div className="rounded-xl bg-teal-50 text-teal-900 px-4 py-3 text-sm">{msg}</div>}
      <form className="bg-white rounded-2xl border p-5 space-y-3" onSubmit={submit}>
        <input
          className="w-full border rounded-xl px-3 py-2"
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="w-full border rounded-xl px-3 py-2"
          required
          rows={4}
          placeholder="Message"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <select
            className="border rounded-xl px-3 py-2"
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value, department_id: "" })}
          >
            <option value="all">All employees</option>
            <option value="department">Selected department</option>
          </select>
          {form.scope === "department" && (
            <select
              className="border rounded-xl px-3 py-2"
              required
              value={form.department_id}
              onChange={(e) => setForm({ ...form, department_id: e.target.value })}
            >
              <option value="">Choose department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 text-white font-semibold" disabled={saving}>
          <Bell className="w-4 h-4" /> {saving ? "Sending…" : "Send notice & alert"}
        </button>
      </form>
      <div className="space-y-2">
        {items.map((row) => (
          <article key={row.id} className="bg-white rounded-2xl border p-4 flex justify-between gap-3">
            <div>
              <strong>{row.title}</strong>
              <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{row.body}</p>
              <p className="text-xs text-slate-400 mt-2">
                {row.scope === "department" ? row.department?.name || "Department" : "All employees"}
                {" · "}
                {row.created_at ? new Date(row.created_at).toLocaleString() : ""}
              </p>
            </div>
            <button type="button" onClick={() => remove(row.id)} className="text-red-600 hover:bg-red-50 rounded-lg p-2 h-fit">
              <Trash2 className="w-4 h-4" />
            </button>
          </article>
        ))}
        {!items.length && <p className="text-sm text-slate-500">No notices yet.</p>}
      </div>
    </div>
  );
}
