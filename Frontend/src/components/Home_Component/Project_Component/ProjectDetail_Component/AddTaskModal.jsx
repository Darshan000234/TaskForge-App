import { useState, useEffect, useRef } from "react";
import { X, Plus, Calendar, Flag, AlignLeft, Type, Search } from "lucide-react";
import api from "../../../../api/api";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do", dot: "bg-zinc-500" },
  { value: "inprogress", label: "In Progress", dot: "bg-yellow-400" },
  { value: "done", label: "Done", dot: "bg-emerald-400" },
  { value: "blocked", label: "Blocked", dot: "bg-red-400" },
];

const PRIORITY_OPTIONS = [
  { value: "high", label: "High", dot: "bg-red-400" },
  { value: "medium", label: "Medium", dot: "bg-yellow-400" },
  { value: "low", label: "Low", dot: "bg-emerald-400" },
];

const DEFAULT_FORM = {
  name: "",
  Description: "",
  Status: "todo",
  priority: "medium",
  dueDate: "",
  assignees: [],
};

const SegmentedPicker = ({ options, value, onChange }) => (
  <div className="flex gap-1.5 flex-wrap">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${value === o.value
          ? "bg-zinc-700 border-zinc-600 text-white"
          : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 bg-transparent"
          }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${o.dot}`} />
        {o.label}
      </button>
    ))}
  </div>
);


const AssigneePicker = ({ teamMembers, selected, onChange }) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const toggle = (member) => {
    const exists = selected.some((a) => a.id === member.id);
    onChange(exists ? selected.filter((a) => a.id !== member.id) : [...selected, member]);
  };
  const removeSelected = (id) => onChange(selected.filter((a) => a.id !== id));

  const filtered = teamMembers.filter((m) =>
    m.receiver_email?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((m) => (
            <span
              key={m.id}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-300"
            >
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {m.receiver_email?.[0]?.toUpperCase()}
              </div>
              {m.receiver_email}
              <button
                type="button"
                onClick={() => removeSelected(m.id)}
                className="cursor-pointer ml-0.5 text-blue-400/60 hover:text-blue-200 transition"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div className="max-h-44 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800/60">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-xs text-zinc-600 text-center">No members found</p>
        ) : (
          filtered.map((m) => {
            const active = selected.some((a) => a.id === m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(m)}
                className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition ${active ? "bg-blue-500/8 hover:bg-blue-500/12" : "hover:bg-zinc-800/60"
                  }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${active ? "bg-blue-500 text-white" : "bg-zinc-700 text-zinc-400"
                  }`}>
                  {m.receiver_email?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">

                  <p className="text-[12px] text-zinc-500 truncate">{m.receiver_email
                  }</p>
                </div>

                {active && (
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {selected.length > 0 && (
        <p className="text-[10px] text-zinc-600">
          {selected.length} member{selected.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
};

const Field = ({ icon: Icon, label, children, required }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium text-zinc-500">
      {Icon && <Icon size={11} />}
      {label}
      {required && <span className="text-red-400 text-xs">*</span>}
    </label>
    {children}
  </div>
);

const AddTaskModal = ({ open, onClose, onSubmit, org_id, id }) => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const titleRef = useRef(null);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const fetchTeamembers = async () => {
      try {
        const res = await api.post(`/orgs/proj/members/${id}`, { org_id });
        setTeamMembers(res.data.data);
      } catch (error) {
        toast.error(error.message);
      }
    }
    fetchTeamembers();
  }, [org_id]);

  useEffect(() => {
    if (open) {
      setForm(DEFAULT_FORM);
      setErrors({});
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Title is required";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) {
      setErrors(e2);
      return;
    }
    const payload = {
      ...form,
      title: form.name.trim(),
      assignees: form.assignees.map(m => m.receiver_id)
    };
    onSubmit?.(payload);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600/15 flex items-center justify-center">
              <Plus size={15} className="text-blue-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Add New Task</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-5">

            <Field icon={Type} label="Task Title" required>
              <input
                ref={titleRef}
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Set up CI/CD pipeline"
                className={`w-full bg-zinc-900 border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition ${errors.name
                  ? "border-red-500/60 focus:border-red-500"
                  : "border-zinc-800 focus:border-zinc-600"
                  }`}
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name}</p>
              )}
            </Field>

            <Field icon={AlignLeft} label="Description">
              <textarea
                value={form.Description}
                onChange={(e) => set("Description", e.target.value)}
                placeholder="Short context or notes..."
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition resize-none"
              />
            </Field>

            <Field label="Status">
              <SegmentedPicker
                options={STATUS_OPTIONS}
                value={form.Status}
                onChange={(v) => set("Status", v)}
              />
            </Field>

            <Field icon={Flag} label="Priority">
              <SegmentedPicker
                options={PRIORITY_OPTIONS}
                value={form.priority}
                onChange={(v) => set("priority", v)}
              />
            </Field>

            <Field icon={Calendar} label="Due Date">
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 transition scheme-dark"
              />
            </Field>

            {teamMembers.length > 0 && (
              <Field label="Assignees">
                <AssigneePicker
                  teamMembers={teamMembers}
                  selected={form.assignees}
                  onChange={(v) => set("assignees", v)}
                />
              </Field>
            )}
          </div>

          <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2 rounded-lg border border-zinc-800 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white transition"
            >
              <Plus size={15} />
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;