import { useState, useRef, useEffect } from "react";
import {
  Search, Plus, LayoutGrid, List, SlidersHorizontal,
  Circle, Clock, CheckCircle2, AlertCircle,
  AlertTriangle, Calendar, ChevronLeft, ChevronRight,
  Trash2, UserPlus, ChevronDown,
} from "lucide-react";
import AssigneeCell from "./AssigneeCell";
import FilterPanel from "./FilterPanel";
import {
  TASK_STATUS_STYLE, PRIORITY_COLOR, PRIORITY_DOT,
  applyFilters, isOverdue, TASK_STATUS_LABEL,
} from "./constants";

const LIMIT = 10;
// format: { type: "assignee" | "addMember", taskId: string }
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
        <button disabled={page === 1} onClick={() => onChange(page - 1)}
          className="cursor-pointer p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => onChange(p)}
            className={`cursor-pointer w-7 h-7 rounded-lg text-xs font-medium transition ${
              p === page ? "bg-blue-600 text-white" : "border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
            }`}>
            {p}
          </button>
        ))}
        <button disabled={page === pages} onClick={() => onChange(page + 1)}
          className="cursor-pointer p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

function useClickOutside(ref, cb) {
  const cbRef = useRef(cb);

  useEffect(() => {
    cbRef.current = cb;
  }, [cb]);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        cbRef.current();
      }
    };

    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref]);
}

const AddMemberDropdown = ({ task, teamMembers, onAddMember, setOpenDropdown, openDropdown }) => {
  const isOpen = openDropdown?.taskId === task.id;
  const ref = useRef(null);

  useClickOutside(ref, () => {
    setOpenDropdown(null);
  });

  const handleBlur = () => setTimeout(() => setOpen(false), 150);

  const unassigned = teamMembers.filter(
    (m) => !task.assignees?.some((a) => a.id === m.id)
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpenDropdown(
            isOpen ? null : { type: "addMember", taskId: task.id }
          );
        }}
        title="Add member"
        className={`cursor-pointer flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition ${
          open
            ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
            : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
        }`}
      >
        <UserPlus size={13} />
        <span>Add</span>
        <ChevronDown size={11} className="text-zinc-500" />
      </button>

      {isOpen && (
        <div
          onBlur={handleBlur}
          className="absolute top-full mt-1.5 left-0 z-30 min-w-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden"
        >
          <p className="px-3 py-2 text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
            Add Member
          </p>
          {unassigned.length === 0 ? (
            <p className="px-3 py-3 text-xs text-zinc-600 text-center">All members assigned</p>
          ) : (
            unassigned.map((m) => (
              <button
                key={m.id}
                onClick={(e) => {
                e.stopPropagation();
                onAddMember?.(task.id, m);
                setOpenDropdown(null); // close after select
              }}
                className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-zinc-800 transition text-left"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center text-[10px] font-semibold text-blue-400 shrink-0">
                  {m.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white font-medium truncate">{m.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{m.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── Task Grid Card ───────────────────────────────────────────────────────────

const TaskGridCard = ({ task, org, teamMembers, onDeleteTask, onAddMember, onRemoveMember, setOpenDropdown , openDropdown}) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition group relative">
    {/* Delete button top-right */}
    {org?.role === "admin" && (
      <button
        onClick={(e) => { e.stopPropagation(); onDeleteTask?.(task.id); }}
        title="Delete task"
        className="cursor-pointer absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-zinc-800 hover:bg-red-500/15 text-zinc-400 hover:text-red-400 transition"
      >
        <Trash2 size={14} />
      </button>
    )}

    <div className="flex items-start gap-2 pr-8">
      {STATUS_ICON[task.status]}
      <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-zinc-500" : "text-white"}`}>
        {task.title}
      </p>
      <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-md shrink-0 font-medium ${TASK_STATUS_STYLE[task.status]}`}>
        {TASK_STATUS_LABEL[task.Status] ?? task.status}
      </span>
    </div>

    {task.description && (
      <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 ml-5">{task.description}</p>
    )}

    <div className="mt-3 flex items-center justify-between gap-2">
      <AssigneeCell
        assignees={task.assignees ?? []}
        canEdit={org?.role === "admin"}
        onRemoveMember={(memberId) => onRemoveMember?.(task.id, memberId)}
      />
      <div className="flex items-center gap-2 text-xs">
        <span className={`capitalize font-medium ${PRIORITY_COLOR[task.priority]}`}>{task.priority}</span>
        {task.dueDate && (
          <span className={`flex items-center gap-1 ${isOverdue(task) ? "text-red-400" : "text-zinc-500"}`}>
            <Calendar size={11} />{new Date(task.dueDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            })}
          </span>
        )}
      </div>
    </div>

    {/* Add member row */}
    {org?.role === "admin" && (
      <div className="mt-3 pt-3 border-t border-zinc-800">
        <AddMemberDropdown task={task} teamMembers={teamMembers} onAddMember={onAddMember} setOpenDropdown={setOpenDropdown}  openDropdown={openDropdown} />
      </div>
    )}
  </div>
);

// ─── Task Table Row ───────────────────────────────────────────────────────────

const TaskTableRow = ({ task, org, teamMembers, onDeleteTask, onAddMember, onRemoveMember, setOpenDropdown, openDropdown }) => (
  <tr className="border-b border-zinc-800/60 hover:bg-zinc-900/50 transition group">
    {/* Task name */}
    <td className="px-5 py-3.5 cursor-pointer">
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

    {/* Priority */}
    <td className="px-5 py-3.5">
      <span className={`flex items-center gap-1.5 text-xs font-medium capitalize ${PRIORITY_COLOR[task.priority]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
        {task.priority}
      </span>
    </td>

    {/* Status */}
    <td className="px-5 py-3.5">
      <span className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize ${TASK_STATUS_STYLE[task.status]}`}>
        {TASK_STATUS_LABEL[task.status] ?? task.status}
      </span>
    </td>

    {/* Assignees — avatar stack + per-member delete in popover */}
    <td className="px-5 py-3.5">
      <AssigneeCell
        assignees={task.assignees ?? []}
        canEdit={org?.role === "admin"}
        onRemoveMember={(memberId) => onRemoveMember?.(task.id, memberId)}
      />
    </td>

    {/* Add Member */}
    <td className="px-5 py-3.5">
      {org?.role === "admin" ? (
        <AddMemberDropdown task={task} teamMembers={teamMembers} onAddMember={onAddMember} setOpenDropdown={setOpenDropdown}  openDropdown={openDropdown}/>
      ) : (
        <span className="text-zinc-600 text-xs">—</span>
      )}
    </td>

    {/* Due Date */}
    <td className="px-5 py-3.5">
      <span className={`text-xs flex items-center gap-1 ${isOverdue(task) ? "text-red-400 font-medium" : "text-zinc-400"}`}>
        {isOverdue(task) && <AlertTriangle size={11} />}
        {new Date(task.dueDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }) ?? "—"}
      </span>
    </td>

    {/* Delete */}
    {org?.role === "admin" && (
      <td className="px-5 py-3.5">
        <button
          onClick={(e) => { e.stopPropagation(); onDeleteTask?.(task.id); }}
          title="Delete task"
          className="cursor-pointer opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/15 text-zinc-500 hover:text-red-400 transition"
        >
          <Trash2 size={15} />
        </button>
      </td>
    )}
  </tr>
);

// ─── Main TaskSection ─────────────────────────────────────────────────────────

/**
 * TaskSection
 *
 * Props:
 *  tasks           task[]
 *  teamMembers     [{ id, name, email }]
 *  org             { role }
 *  onAddTask       () => void
 *  onDeleteTask    (taskId) => void
 *  onAddMember     (taskId, member) => void
 *  onRemoveMember  (taskId, memberId) => void
 *  initialFilters  object
 *  onFiltersChange (filters) => void
 */
const TaskSection = ({
  tasks = [],
  teamMembers = [],
  org,
  onAddTask,
  onDeleteTask,
  onAddMember,
  onRemoveMember,
  initialFilters = {},
  onFiltersChange,
}) => {
  const [search, setSearch]         = useState("");
  const [filters, setFilters]       = useState(initialFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView]             = useState("list");
  const [page, setPage]             = useState(1);
  const filterRef                   = useRef(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleFilters = (f) => { setFilters(f); setPage(1); onFiltersChange?.(f); };
  const handleSearch  = (v) => { setSearch(v);  setPage(1); };

  const filtered    = applyFilters(tasks, filters, search);
  const paged       = filtered.slice((page - 1) * LIMIT, page * LIMIT);
  const activeCount = Object.values(filters).filter(Boolean).length;

  const isAdmin = org?.role === "admin";

  return (
    <div className="flex-1 min-w-0">

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
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

        {/* Filter toggle */}
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
          <button onClick={() => setView("list")}
            className={`cursor-pointer p-2 rounded-md transition ${view === "list" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
            <List size={15} />
          </button>
          <button onClick={() => setView("grid")}
            className={`cursor-pointer p-2 rounded-md transition ${view === "grid" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
            <LayoutGrid size={15} />
          </button>
        </div>

        {/* Add task */}
        {isAdmin && (
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

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-zinc-800 rounded-2xl bg-zinc-900/30">
          <Search size={28} className="text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-500">No tasks match your filters</p>
        </div>
      )}

      {/* ── Grid view ────────────────────────────────────────────────── */}
      {filtered.length > 0 && view === "grid" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paged.map((t) => (
              <TaskGridCard
                key={t.id}
                task={t}
                org={org}
                teamMembers={teamMembers}
                onDeleteTask={onDeleteTask}
                onAddMember={onAddMember}
                onRemoveMember={onRemoveMember}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
              />
            ))}
          </div>
          <Pagination page={page} total={filtered.length} limit={LIMIT} onChange={setPage} />
        </>
      )}

      {/* ── List / table view ─────────────────────────────────────────── */}
      {filtered.length > 0 && view === "list" && (
        <>
          <div className="border border-zinc-800 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                <tr className="text-left">
                  <th className="px-5 py-3.5 font-medium">Task</th>
                  <th className="px-5 py-3.5 font-medium">Priority</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Assignees</th>
                  <th className="px-5 py-3.5 font-medium">Add Member</th>
                  <th className="px-5 py-3.5 font-medium">Due Date</th>
                  {/* Delete column header only for admins */}
                  {isAdmin && <th className="px-5 py-3.5 font-medium w-12" />}
                </tr>
              </thead>
              <tbody>
                {paged.map((t) => (
                  <TaskTableRow
                    key={t.id}
                    task={t}
                    org={org}
                    teamMembers={teamMembers}
                    onDeleteTask={onDeleteTask}
                    onAddMember={onAddMember}
                    onRemoveMember={onRemoveMember}
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                  />
                ))}
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