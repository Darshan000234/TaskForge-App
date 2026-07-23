import { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Search } from "lucide-react";
import api from "../../../api/api.js";
import { useOutletContext } from "react-router-dom";

const INITIAL_FORM = {
  name: "",
  Description: "",
  status: "Active",
  priority: "Medium",
  endDate: "",
  managerEmail: null, // array of receiver_id
};

// ─── Reusable AssigneePicker (same as AddTaskModal) ───────────────────────────
const ManagerPicker = ({ teamMembers, selected, onChange }) => {
  const [query, setQuery] = useState("");

  const filtered = teamMembers.filter((m) =>
    m.receiver_email?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {selected && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2">
          <span className="text-sm text-blue-300 truncate">
            {selected.receiver_email}
          </span>

          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-blue-400 hover:text-blue-200 shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="relative">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search manager..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-2"
        />
      </div>

      <div className="max-h-44 overflow-y-auto rounded-lg border border-zinc-700">
        {filtered.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m)}
            className={`w-full text-left px-3 py-2 hover:bg-zinc-800 truncate ${selected?.id === m.id ? "bg-blue-500/10" : ""
              }`}
          >
            {m.receiver_email}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const NewProjectModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const { org } = useOutletContext();
  const [members, setMembers] = useState([]);
  const [errors, setErrors] = useState({});

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  useEffect(() => {
    const getMembers = async () => {
      const response = await api.get(`/orgs/${org.id}/members`);
      setMembers(response.data);
    };
    getMembers();
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Project name is required";
    if (!form.endDate) e.endDate = "End date is required";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }

    onCreated({
      name: form.name.trim(),
      Description: form.Description,
      status: form.status || "active",
      priority: form.priority || "low",
      endDate: form.endDate,
      managerEmail: form.managerEmail ?? null // same pattern as AddTaskModal
    });
  };

  const inputCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 px-3 text-[15px] text-zinc-200 focus:outline-none focus:border-zinc-500 transition";
  const selectCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 px-3 text-[15px] text-zinc-200 focus:outline-none focus:border-zinc-500 transition appearance-none cursor-pointer";
  const labelCls = "block text-sm text-zinc-300 mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 sm:p-6 w-full max-w-lg text-zinc-200 max-h-[90vh] overflow-y-auto">

        <div className="flex items-start justify-between mb-6 gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold">Create New Project</h2>
            <p className="text-sm text-zinc-400 mt-0.5 truncate">
              In workspace: <span className="text-blue-400 font-medium">{org.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition mt-0.5 cursor-pointer shrink-0">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelCls}>Project Name</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              type="text"
              placeholder="Enter project name"
              className={`${inputCls} ${errors.name ? "border-red-500 focus:border-red-500" : ""}`}
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={form.Description}
              onChange={(e) => set("Description", e.target.value)}
              placeholder="Describe your project"
              rows={2}
              className={`${inputCls} resize-y overflow-auto min-h-15 max-h-50`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Status</label>
              <div className="relative">
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className={selectCls}>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <div className="relative">
                <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className={selectCls}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
              className={`${inputCls} ${errors.endDate ? "border-red-500 focus:border-red-500" : ""}`}
            />
            {errors.endDate && <p className="text-xs text-red-400 mt-1">{errors.endDate}</p>}
          </div>
          {members.length > 0 && (
            <div>
              <label className={labelCls}>Members</label>
              <ManagerPicker
                teamMembers={members}
                selected={members.find((m) => m.receiver_email === form.managerEmail)}
                onChange={(member) => set("managerEmail", member?.receiver_email ?? null)}
              />
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="cursor-pointer px-5 py-2.5 rounded-lg border border-zinc-700 text-sm hover:border-zinc-500 transition">
              Cancel
            </button>
            <button type="submit" className="cursor-pointer px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium transition">
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;