import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, SlidersHorizontal, X, AlertTriangle,
  ChevronDown, Check, Circle, Loader2,
  CheckCircle2, Ban, ChevronLeft, ChevronRight,
} from "lucide-react";
import api from "../../api/api.js";
import AssigneeCell from "./Project_Component/ProjectDetail_Component/AssigneeCell.jsx";
import { useNavigate, useOutletContext } from "react-router-dom";
import useDebounce from "../../utils/debounce.js"
const STATUS_ICON = {
  todo: <Circle size={14} className="text-zinc-500" />,
  inprogress: <Loader2 size={14} className="text-blue-400 animate-spin" />,
  done: <CheckCircle2 size={14} className="text-emerald-500" />,
  blocked: <Ban size={14} className="text-red-400" />,
};

const PRIORITY_COLOR = {
  high: "text-red-400",
  medium: "text-amber-400",
  low: "text-zinc-400",
};

const PRIORITY_DOT = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-zinc-500",
};

const TASK_STATUS_STYLE = {
  todo: "bg-zinc-800 text-zinc-400",
  inprogress: "bg-blue-500/15 text-blue-400",
  done: "bg-emerald-500/15 text-emerald-400",
  blocked: "bg-red-500/15 text-red-400",
};

const TASK_STATUS_LABEL = {
  todo: "To Do",
  inprogress: "In Progress",
  done: "Done",
  blocked: "Blocked",
};

const isOverdue = (task) =>
  task.dueDate && task.Status !== "done" && new Date(task.dueDate) < new Date();

const EMPTY_FILTERS = {
  status: "",
  priority: "",
  due: "",
  assigneeId: "",
  projectId: "",
};

const CustomSelect = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div ref={ref} className="relative">
      <p className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-medium">
        {label}
      </p>
      <button
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer w-full flex items-center justify-between px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:border-zinc-600 transition"
      >
        <span className={selected ? "text-white" : "text-zinc-500"}>
          {selected ? selected.label : "Any"}
        </span>
        <ChevronDown size={13} className="text-zinc-500" />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
          <div
            onClick={() => { onChange(""); setOpen(false); }}
            className="flex items-center justify-between px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-700 cursor-pointer"
          >
            Any
            {!value && <Check size={13} className="text-blue-400" />}
          </div>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="flex items-center justify-between px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 cursor-pointer"
            >
              {opt.label}
              {String(value) === String(opt.value) && (
                <Check size={13} className="text-blue-400" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FilterPanel = ({ filters, onChange, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const set = (field, value) => onChange({ ...filters, [field]: value });

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-40 w-72 max-w-[calc(100vw-2rem)] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Filters</span>
        <button onClick={onClose} className="cursor-pointer text-zinc-500 hover:text-zinc-300">
          <X size={15} />
        </button>
      </div>

      <CustomSelect
        label="Status"
        value={filters.status}
        options={[
          { value: "todo", label: "To Do" },
          { value: "inprogress", label: "In Progress" },
          { value: "done", label: "Done" },
          { value: "blocked", label: "Blocked" },
        ]}
        onChange={(v) => set("status", v)}
      />

      <CustomSelect
        label="Priority"
        value={filters.priority}
        options={[
          { value: "high", label: "High" },
          { value: "medium", label: "Medium" },
          { value: "low", label: "Low" },
        ]}
        onChange={(v) => set("priority", v)}
      />

      <CustomSelect
        label="Due"
        value={filters.due}
        options={[
          { value: "overdue", label: "Overdue" },
          { value: "today", label: "Due Today" },
          { value: "week", label: "Due This Week" },
        ]}
        onChange={(v) => set("due", v)}
      />

      <button
        onClick={() => onChange({ ...EMPTY_FILTERS })}
        className="cursor-pointer w-full py-2 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-white hover:border-zinc-500 transition"
      >
        Clear All
      </button>
    </div>
  );
};

const TaskTableRow = ({ task, isLast, click, onAssigneesLoaded, assignees, assigneeCount }) => (
  <tr onClick={() => click(task)} className="group border-b border-zinc-800/60 last:border-b-0">
    <td className={`px-4 sm:px-5 py-3.5 bg-zinc-900 group-hover:bg-zinc-900/50 ${isLast ? "rounded-bl-xl" : ""}`}>
      <div className="flex items-center gap-2.5">
        {STATUS_ICON[task.Status]}
        <span className={`font-medium ${task.Status === "done" ? "line-through text-zinc-500" : "text-white"}`}>
          {task.name}
        </span>
      </div>
      {task.Description && (
        <p className="text-xs text-zinc-600 mt-0.5 truncate max-w-xs ml-6">{task.Description}</p>
      )}
    </td>

    <td className="px-4 sm:px-5 py-3.5 bg-zinc-900 group-hover:bg-zinc-900/50">
      <span className={`flex items-center gap-1.5 text-xs font-medium capitalize ${PRIORITY_COLOR[task.priority]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
        {task.priority}
      </span>
    </td>

    <td className="px-4 sm:px-5 py-3.5 bg-zinc-900 group-hover:bg-zinc-900/50">
      <span className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize ${TASK_STATUS_STYLE[task.Status]}`}>
        {TASK_STATUS_LABEL[task.Status] ?? task.Status}
      </span>
    </td>

    <td onClick={(e) => e.stopPropagation()} className="px-4 sm:px-5 py-3.5 bg-zinc-900 group-hover:bg-zinc-900/50">
      {task.assigneeCount > 0 ? (
        <div>
          <AssigneeCell
            taskId={task.id}
            assignees={task.assignees ?? null}
            assigneeCount={task.assigneeCount}
            onAssigneesLoaded={onAssigneesLoaded}
          />
        </div>
      ) : (
        <span className="text-zinc-600 text-xs">—</span>
      )}
    </td>

    <td className="px-4 sm:px-5 py-3.5 bg-zinc-900 group-hover:bg-zinc-900/50">
      <span className={`text-xs flex items-center gap-1 whitespace-nowrap ${isOverdue(task) ? "text-red-400 font-medium" : "text-zinc-400"}`}>
        {isOverdue(task) && <AlertTriangle size={11} />}
        {task.dueDate
          ? new Date(task.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
          : "—"}
      </span>
    </td>

    <td className={`px-4 sm:px-5 py-3.5 bg-zinc-900 group-hover:bg-zinc-900/50 ${isLast ? "rounded-br-xl" : ""}`}>
      <span className="text-xs text-zinc-500 truncate max-w-35 block">
        {task.project?.name ?? "—"}
      </span>
    </td>
  </tr>
);

const LIMIT = 20;

const Task = () => {
  const { org } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [filterOpen, setFilterOpen] = useState(false);
  const [cursorStack, setCursorStack] = useState([undefined]);
  const [currentPage, setCurrentPage] = useState(0);
  const [nextCursor, setNextCursor] = useState(null);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const filterRef = useRef(null);
  const activeCount = Object.values(filters).filter(Boolean).length;
  const orgId = org?.id;


  const buildQuery = useCallback(
    (cursor) => {
      const p = new URLSearchParams();
      p.set("limit", LIMIT);
      if (cursor) p.set("cursor", cursor);
      if (search.trim()) p.set("search", search.trim());
      if (filters.status) p.set("status", filters.status);
      if (filters.priority) p.set("priority", filters.priority);
      if (filters.due) p.set("due", filters.due);
      return p.toString();
    },
    [search, filters]
  );

  const fetchTasks = useCallback(
    async (cursor) => {
      if (!orgId) return;
      setLoading(true);
      try {
        const res = await api.get(`/orgs/${orgId}/tasks?${buildQuery(cursor)}`);
        const data = await res.data;
        setTasks(data?.formattedTasks ?? []);
        setNextCursor(data?.nextCursor ?? null);
        setTotal(data?.total ?? 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [orgId, buildQuery]
  );

  useEffect(() => {
    setCursorStack([undefined]);
    setCurrentPage(0);
  }, [filters, search]);

  useEffect(() => {
    fetchTasks(cursorStack[currentPage]);
  }, [currentPage, cursorStack, filters, search, orgId]);

  const handleNext = () => {
    if (!nextCursor) return;
    setCursorStack((prev) => [...prev.slice(0, currentPage + 1), nextCursor]);
    setCurrentPage((p) => p + 1);
  };

  const handlePrev = () => {
    if (currentPage === 0) return;
    setCurrentPage((p) => p - 1);
  };

  const handleClickTask = (task) => {
    navigate(`/user/dashboard/task/${task.id}`)
  }

  const handleAssigneesLoaded = useCallback((taskId, users) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, assignees: users, assigneeCount: users.length }
          : t
      )
    );
  }, []);

  const pageStart = currentPage * LIMIT + 1;
  const pageEnd = Math.min(pageStart + tasks.length - 1, total);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">All Tasks</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {total > 0
            ? `${total} task${total !== 1 ? "s" : ""} across all projects`
            : "Tasks across your organisation"}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-5">
        <div className="relative flex-1 min-w-50 max-w-sm">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition text-white placeholder-zinc-500"
          />
        </div>

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className={`cursor-pointer flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm transition ${activeCount > 0
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
              onChange={setFilters}
              onClose={() => setFilterOpen(false)}
            />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-500 gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading tasks…</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-2">
            <Circle size={28} className="opacity-30" />
            <span className="text-sm">No tasks found</span>
            {(search || activeCount > 0) && (
              <button
                onClick={() => { setSearch(""); setFilters({ ...EMPTY_FILTERS }); }}
                className="cursor-pointer mt-1 text-xs text-blue-400 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <table className="w-full min-w-205 border-collapse">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Task", "Priority", "Status", "Assignees", "Due Date", "Project"].map((h) => (
                  <th
                    key={h}
                    className="px-4 sm:px-5 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider bg-zinc-900/80 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, idx) => (
                <TaskTableRow
                  key={task.id}
                  task={task}
                  isLast={idx === tasks.length - 1}
                  click={handleClickTask}
                  onAssigneesLoaded={handleAssigneesLoaded}
                  assignees={task.assignees ?? null}
                  assigneeCount={task.assigneeCount}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && tasks.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
          <span className="text-xs text-zinc-500">
            Showing {pageStart}–{pageEnd}{total > 0 ? ` of ${total}` : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 0}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <span className="text-xs text-zinc-500 px-1">Page {currentPage + 1}</span>
            <button
              onClick={handleNext}
              disabled={!nextCursor}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Task;