import { useRef, useEffect } from "react";
import { X } from "lucide-react";
import { buildQueryString } from "./constants";

function useClickOutside(ref, cb) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
}

const Sel = ({ label, field, options, filters, onChange }) => (
  <div>
    <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium block mb-1">
      {label}
    </label>
    <select
      value={filters[field] ?? ""}
      onChange={(e) => onChange({ ...filters, [field]: e.target.value })}
      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500 transition"
    >
      <option value="">All</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

/**
 * FilterPanel
 *
 * Props:
 *  filters    object  current filter state
 *  onChange   (filters) => void
 *  members    [{ id, name }]
 *  onClose    () => void
 */
const FilterPanel = ({ filters, onChange, members, onClose }) => {
  const ref = useRef(null);
  useClickOutside(ref, onClose);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-40 w-72 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Filters</span>
        <button onClick={onClose} className="cursor-pointer text-zinc-500 hover:text-zinc-300 transition">
          <X size={15} />
        </button>
      </div>

      <Sel label="Status" field="status" filters={filters} onChange={onChange} options={[
        { value: "todo",       label: "To Do"       },
        { value: "inprogress", label: "In Progress" },
        { value: "done",       label: "Done"        },
        { value: "blocked",    label: "Blocked"     },
      ]} />

      <Sel label="Priority" field="priority" filters={filters} onChange={onChange} options={[
        { value: "high",   label: "High"   },
        { value: "medium", label: "Medium" },
        { value: "low",    label: "Low"    },
      ]} />

      <Sel label="Due" field="due" filters={filters} onChange={onChange} options={[
        { value: "overdue", label: "Overdue"       },
        { value: "today",   label: "Due Today"     },
        { value: "week",    label: "Due This Week" },
      ]} />

      {/* Assignee */}
      <div>
        <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium block mb-1">
          Assignee
        </label>
        <select
          value={filters.assigneeId ?? ""}
          onChange={(e) => onChange({ ...filters, assigneeId: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500 transition"
        >
          <option value="">All Members</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div className="grid grid-cols-2 gap-3">
        <Sel label="Sort By" field="sortBy" filters={filters} onChange={onChange} options={[
          { value: "dueDate",   label: "Due Date"  },
          { value: "priority",  label: "Priority"  },
          { value: "status",    label: "Status"    },
          { value: "createdAt", label: "Created"   },
        ]} />
        <Sel label="Order" field="order" filters={filters} onChange={onChange} options={[
          { value: "asc",  label: "Asc"  },
          { value: "desc", label: "Desc" },
        ]} />
      </div>

      {/* Query string preview */}
      <div className="bg-zinc-800/60 rounded-lg p-2.5">
        <p className="text-[10px] text-zinc-500 font-mono break-all leading-relaxed">
          {buildQueryString(filters) || "No filters applied"}
        </p>
      </div>

      <button
        onClick={() => onChange({})}
        className="cursor-pointer w-full py-2 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-white hover:border-zinc-500 transition"
      >
        Clear All
      </button>
    </div>
  );
};

export default FilterPanel;