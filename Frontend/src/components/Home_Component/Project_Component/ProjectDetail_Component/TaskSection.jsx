import { useState, useRef } from "react";
import {
  Search, Plus, LayoutGrid, List, SlidersHorizontal,
  Circle, Clock, CheckCircle2, AlertCircle,
  AlertTriangle, Calendar, ChevronLeft, ChevronRight,
} from "lucide-react";
import AssigneeCell from "./AssigneeCell";
import FilterPanel from "./FilterPanel";
import {
  TASK_STATUS_STYLE, PRIORITY_COLOR, PRIORITY_DOT,
  applyFilters, isOverdue, TASK_STATUS_LABEL,
} from "./constants";

const LIMIT = 10;

const STATUS_ICON = {
  todo:       <Circle size={14} className="text-zinc-500" />,
  inprogress: <Clock size={14} className="text-yellow-400" />,
  done:       <CheckCircle2 size={14} className="text-emerald-400" />,
  blocked:    <AlertCircle size={14} className="text-red-400" />,
};

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination = ({ page, total, limit, onChange }) => {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-1 pt-4">
      <span className="text-xs text-zinc-500">
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="cursor-pointer p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`cursor-pointer w-7 h-7 rounded-lg text-xs font-medium transition ${
              p === page
                ? "bg-blue-600 text-white"
                : "border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={page === pages}
          onClick={() => onChange(page + 1)}
          className="cursor-pointer p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// ─── Task Grid Card ───────────────────────────────────────────────────────────

const TaskGridCard = ({ task }) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition cursor-pointer">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {STATUS_ICON[task.status]}
        <p className={`text-sm font-medium truncate ${task.status === "done" ? "line-through text-zinc-500" : "text-white"}`}>
          {task.title}
        </p>
      </div>
      <span className={`text-[10px] px-2 py-0.5 rounded-md shrink-0 capitalize font-medium ${TASK_STATUS_STYLE[task.status]}`}>
        {TASK_STATUS_LABEL[task.status] ?? task.status}
      </span>
    </div>
    {task.description && (
      <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2">{task.description}</p>
    )}
    <div className="mt-3 flex items-center justify-between gap-2">
      <AssigneeCell assignees={task.assignees ?? []} />
      <div className="flex items-center gap-2 text-xs">
        <span className={`capitalize font-medium ${PRIORITY_COLOR[task.priority]}`}>{task.priority}</span>
        {task.dueDate && (
          <span className={`flex items-center gap-1 ${isOverdue(task) ? "text-red-400" : "text-zinc-500"}`}>
            <Calendar size={11} />{task.dueDate}
          </span>
        )}
      </div>
    </div>
  </div>
);

// ─── Task Table Row ───────────────────────────────────────────────────────────

const TaskTableRow = ({ task }) => (
  <tr className="border-b border-zinc-800/60 hover:bg-zinc-900/50 transition cursor-pointer">
    <td className="px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        {STATUS_ICON[task.status]}
        <span className={`font-medium ${task.status === "done" ? "line-through text-zinc-500" : "text-white"}`}>
          {task.title}
        </span>
      </div>
      {task.description && (
        <p className="text-xs text-zinc-600 mt-0.5 truncate max-w-xs ml-6">{task.description}</p>
      )}
    </td>
    <td className="px-5 py-3.5">
      <span className={`flex items-center gap-1.5 text-xs font-medium capitalize ${PRIORITY_COLOR[task.priority]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
        {task.priority}
      </span>
    </td>
    <td className="px-5 py-3.5">
      <span className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize ${TASK_STATUS_STYLE[task.status]}`}>
        {TASK_STATUS_LABEL[task.status] ?? task.status}
      </span>
    </td>
    <td className="px-5 py-3.5">
      <AssigneeCell assignees={task.assignees ?? []} />
    </td>
    <td className="px-5 py-3.5">
      <span className={`text-xs flex items-center gap-1 ${isOverdue(task) ? "text-red-400 font-medium" : "text-zinc-400"}`}>
        {isOverdue(task) && <AlertTriangle size={11} />}
        {task.dueDate ?? "—"}
      </span>
    </td>
  </tr>
);

// ─── Main TaskSection ─────────────────────────────────────────────────────────

/**
 * TaskSection
 *
 * Props:
 *  tasks         task[]
 *  teamMembers   [{ id, name }]
 *  org           { role }
 *  onAddTask     () => void
 *  initialFilters  object  — pre-applied filters (e.g. from stat card click)
 *  onFiltersChange (filters) => void  — lift filter state up if needed
 */
const TaskSection = ({
  tasks = [],
  teamMembers = [],
  org,
  onAddTask,
  initialFilters = {},
  onFiltersChange,
}) => {
  const [search, setSearch]     = useState("");
  const [filters, setFilters]   = useState(initialFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView]         = useState("list");
  const [page, setPage]         = useState(1);
  const filterRef               = useRef(null);

  const handleFilters = (f) => {
    setFilters(f);
    setPage(1);
    onFiltersChange?.(f);
  };

  const handleSearch = (v) => {
    setSearch(v);
    setPage(1);
  };

  const filtered = applyFilters(tasks, filters, search);
  const paged    = filtered.slice((page - 1) * LIMIT, page * LIMIT);
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex-1 min-w-0">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition"
          />
        </div>

        {/* Filter */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className={`cursor-pointer flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm transition ${
              activeCount > 0
                ? "border-blue-500/50 text-blue-400 bg-blue-500/10"
                : "border-zinc-800 text-zinc-400 bg-zinc-900 hover:border-zinc-600 hover:text-zinc-300"
            }`}
          >
            <SlidersHorizontal size={15} />
            {activeCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
          {filterOpen && (
            <FilterPanel
              filters={filters}
              onChange={handleFilters}
              members={teamMembers}
              onClose={() => setFilterOpen(false)}
            />
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 border border-zinc-800 rounded-lg p-1 bg-zinc-900">
          <button
            onClick={() => setView("list")}
            className={`cursor-pointer p-2 rounded-md transition ${view === "list" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <List size={15} />
          </button>
          <button
            onClick={() => setView("grid")}
            className={`cursor-pointer p-2 rounded-md transition ${view === "grid" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <LayoutGrid size={15} />
          </button>
        </div>

        {/* Add task */}
        {org?.role === "admin" && (
          <button
            onClick={onAddTask}
            className="cursor-pointer ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            <Plus size={16} />Add Task
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="text-xs text-zinc-500 mb-4 uppercase tracking-wider font-medium">
        {filtered.length} task{filtered.length !== 1 ? "s" : ""}{activeCount > 0 ? " (filtered)" : ""}
      </p>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-zinc-800 rounded-2xl bg-zinc-900/30">
          <Search size={28} className="text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-500">No tasks match your filters</p>
        </div>
      )}

      {/* Grid view */}
      {filtered.length > 0 && view === "grid" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paged.map((t) => <TaskGridCard key={t.id} task={t} />)}
          </div>
          <Pagination page={page} total={filtered.length} limit={LIMIT} onChange={setPage} />
        </>
      )}

      {/* List view */}
      {filtered.length > 0 && view === "list" && (
        <>
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                <tr className="text-left">
                  <th className="px-5 py-3.5 font-medium">Task</th>
                  <th className="px-5 py-3.5 font-medium">Priority</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Assignees</th>
                  <th className="px-5 py-3.5 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((t) => <TaskTableRow key={t.id} task={t} />)}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.length} limit={LIMIT} onChange={setPage} />
        </>
      )}
    </div>
  );
};

export default TaskSection;