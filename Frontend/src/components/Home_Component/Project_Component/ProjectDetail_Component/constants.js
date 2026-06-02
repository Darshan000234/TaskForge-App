
export const STATUS_STYLE = {
  active:    "bg-emerald-500/15 text-emerald-400",
  completed: "bg-blue-500/15 text-blue-400",
  onhold:    "bg-yellow-500/15 text-yellow-400",
  cancelled: "bg-red-500/15 text-red-400",
  archived:  "bg-zinc-600/30 text-zinc-400",
};

export const TASK_STATUS_STYLE = {
  todo:       "bg-zinc-700/40 text-zinc-400",
  inprogress: "bg-yellow-500/15 text-yellow-400",
  done:       "bg-emerald-500/15 text-emerald-400",
  blocked:    "bg-red-500/15 text-red-400",
};

export const PRIORITY_COLOR = {
  high:   "text-red-400",
  medium: "text-yellow-400",
  low:    "text-emerald-400",
};

export const PRIORITY_DOT = {
  high:   "bg-red-400",
  medium: "bg-yellow-400",
  low:    "bg-emerald-400",
};


export const isOverdue = (task) =>
  task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date();

export function buildQueryString(f) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
  return p.toString() ? "?" + p.toString() : "";
}

export function applyFilters(tasks, filters, search) {
  let r = [...tasks];
  if (search)           r = r.filter((t) => t.title?.toLowerCase().includes(search.toLowerCase()));
  if (filters.status)   r = r.filter((t) => t.status === filters.status);
  if (filters.priority) r = r.filter((t) => t.priority === filters.priority);
  if (filters.assigneeId)
    r = r.filter((t) => t.assignees?.some((a) => String(a.id) === String(filters.assigneeId)));
  if (filters.due === "overdue") r = r.filter(isOverdue);
  if (filters.due === "today") {
    const today = new Date().toISOString().slice(0, 10);
    r = r.filter((t) => t.dueDate === today);
  }
  if (filters.sortBy === "priority") {
    const ord = { high: 0, medium: 1, low: 2 };
    r.sort((a, b) => (ord[a.priority] ?? 3) - (ord[b.priority] ?? 3));
  }
  if (filters.sortBy === "dueDate")
    r.sort((a, b) => new Date(a.dueDate || "9999") - new Date(b.dueDate || "9999"));
  if (filters.order === "desc") r.reverse();
  return r;
}

export const TASK_STATUS_LABEL = {
  todo:       "To Do",
  inprogress: "In Progress",
  done:       "Done",
  blocked:    "Blocked",
};