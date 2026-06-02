import { useState } from 'react';
import { Check,Loader2,Pencil,X } from 'lucide-react';

const STATUS_STYLE = {
  todo:       "bg-zinc-700/50 text-zinc-300 border border-zinc-600",
  inprogress: "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/20",
  done:       "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  blocked:    "bg-red-500/15 text-red-400 border border-red-500/30",
};

const PRIORITY_STYLE = {
  high:   "bg-red-500/15 text-red-400 border border-red-500/30 shadow-sm shadow-red-500/20",
  medium: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  low:    "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
};

const STATUS_OPTIONS   = ["todo", "inprogress", "done", "blocked"];
const PRIORITY_OPTIONS = ["low", "medium", "high"];

const EditModal = ({ task, onClose, onSave }) => {
  const [form, setForm] = useState({
    name:        task.name        ?? "",
    Description: task.Description ?? "",
    Status:      task.Status      ?? "todo",
    priority:    task.priority    ?? "medium",
    dueDate:     task.dueDate
      ? new Date(task.dueDate).toISOString().slice(0, 10)
      : "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  const Label = ({ children }) => (
    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-1.5">{children}</p>
  );

  const inputCls =
    "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition";

  const SegmentedGroup = ({ options, field, styleMap }) => (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => set(field, opt)}
          className={`cursor-pointer px-3.5 py-1.5 rounded-full text-[11px] font-semibold border capitalize transition ${
            form[field] === opt
              ? styleMap?.[opt] ?? "bg-blue-600 text-white border-blue-600"
              : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Pencil size={15} className="text-zinc-400" />
            <h3 className="text-sm font-semibold text-white">Edit Task</h3>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          <div>
            <Label>Task Name</Label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Enter task name"
              className={inputCls}
            />
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              value={form.Description}
              onChange={(e) => set("Description", e.target.value)}
              placeholder="Describe the task..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <Label>Status</Label>
            <SegmentedGroup options={STATUS_OPTIONS} field="Status" styleMap={STATUS_STYLE} />
          </div>

          <div>
            <Label>Priority</Label>
            <SegmentedGroup options={PRIORITY_OPTIONS} field="priority" styleMap={PRIORITY_STYLE} />
          </div>

          <div>
            <Label>Due Date</Label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
              className={`${inputCls} scheme-dark`}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="cursor-pointer flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};


export default EditModal