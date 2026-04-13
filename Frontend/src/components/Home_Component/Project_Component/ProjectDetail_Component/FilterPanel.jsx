import { useRef, useEffect } from "react";
import { X } from "lucide-react";
import CustomSelect from "../../../../utils/CustomSelect.jsx";
import { buildQueryString } from "./constants";

/* Click outside hook */
function useClickOutside(ref, cb) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        cb();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

const FilterPanel = ({ filters, onChange, members, onClose }) => {
  const ref = useRef(null);
  useClickOutside(ref, onClose);

  /* Centralized update */
  const handleChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  /* Config-driven filters */
  const filterConfig = [
    {
      label: "Status",
      field: "status",
      options: [
        { value: "todo", label: "To Do" },
        { value: "inprogress", label: "In Progress" },
        { value: "done", label: "Done" },
        { value: "blocked", label: "Blocked" },
      ],
    },
    {
      label: "Priority",
      field: "priority",
      options: [
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" },
      ],
    },
    {
      label: "Due",
      field: "due",
      options: [
        { value: "overdue", label: "Overdue" },
        { value: "today", label: "Due Today" },
        { value: "week", label: "Due This Week" },
      ],
    },
  ];

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-40 w-72 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Filters</span>
        <button
          onClick={onClose}
          className="cursor-pointer text-zinc-500 hover:text-zinc-300"
        >
          <X size={15} />
        </button>
      </div>

      {/* Dynamic Filters */}
      {filterConfig.map((item) => (
        <CustomSelect
          key={item.field}
          label={item.label}
          value={filters[item.field]}
          options={item.options}
          onChange={(val) => handleChange(item.field, val)}
        />
      ))}

      {/* Assignee */}
      <CustomSelect
        label="Assignee"
        value={filters.assigneeId}
        options={members.map((m) => ({
          value: m.id,
          label: m.name,
        }))}
        onChange={(val) => handleChange("assigneeId", val)}
      />

      {/* Sort */}
      <div className="grid grid-cols-2 gap-3">
        <CustomSelect
          label="Sort By"
          value={filters.sortBy}
          options={[
            { value: "dueDate", label: "Due Date" },
            { value: "priority", label: "Priority" },
            { value: "status", label: "Status" },
            { value: "createdAt", label: "Created" },
          ]}
          onChange={(val) => handleChange("sortBy", val)}
        />

        <CustomSelect
          label="Order"
          value={filters.order}
          options={[
            { value: "asc", label: "Asc" },
            { value: "desc", label: "Desc" },
          ]}
          onChange={(val) => handleChange("order", val)}
        />
      </div>

      {/* Clear */}
      <button
        onClick={() =>
          onChange({
            status: "",
            priority: "",
            due: "",
            assigneeId: "",
            sortBy: "",
            order: "",
          })
        }
        className="cursor-pointer w-full py-2 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-white hover:border-zinc-500"
      >
        Clear All
      </button>
    </div>
  );
};

export default FilterPanel;