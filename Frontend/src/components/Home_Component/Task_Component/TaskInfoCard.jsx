import { useState } from "react";
import { User, Calendar, ChevronDown, ChevronUp, Pencil, X, Check, Loader2 } from "lucide-react";
import EditModal from "./EditModal";

const STATUS_STYLE = {
  todo: "bg-zinc-700/50 text-zinc-300 border border-zinc-600",
  inprogress: "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/20",
  done: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  blocked: "bg-red-500/15 text-red-400 border border-red-500/30",
};

const PRIORITY_STYLE = {
  high: "bg-red-500/15 text-red-400 border border-red-500/30 shadow-sm shadow-red-500/20",
  medium: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  low: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
};

const STATUS_OPTIONS = ["todo", "inprogress", "done", "blocked"];
const PRIORITY_OPTIONS = ["low", "medium", "high"];

const Badge = ({ label, styleMap, fallback = "bg-zinc-700/40 text-zinc-300 border border-zinc-700" }) => (
  <span className={`text-[10px] font-semibold px-3 py-1 rounded-full tracking-wide ${styleMap?.[label] ?? fallback}`}>
    {label}
  </span>
);

const TaskInfoCard = ({ task: initialTask, onUpdate, role }) => {
  const [task, setTask] = useState(initialTask);
  const [editOpen, setEditOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const assignees = task.assignees ?? [];
  const visibleUsers = showAll ? assignees : assignees.slice(0, 3);
  const extraCount = assignees.length - 3;
  const isAdmin = role==='admin' || role==='manager'
  const handleSave = async (fields) => {
    const updated = { ...task, ...fields };
    setTask(updated);
    onUpdate(updated);
  };

  return (
    <>
      <div className="bg-linear-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-5 shadow-lg shadow-black/30">

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold text-lg tracking-tight truncate">
              {task.name}
            </h2>
            {task.Description && (
              <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed line-clamp-3">
                {task.Description}
              </p>
            )}
          </div>
          {isAdmin && 
          <button
          onClick={() => setEditOpen(true)}
          title="Edit task"
          className="cursor-pointer shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 transition text-xs font-medium"
          >
            <Pencil size={12} />
            Edit
          </button>
          }
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge label={task.Status} styleMap={STATUS_STYLE} />
          <Badge label={task.priority} styleMap={PRIORITY_STYLE} />
        </div>

        <div className="border-t border-zinc-800/70 pt-4 space-y-4">

          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
              <User size={13} className="text-zinc-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">Assignees</p>
              {assignees.length === 0 ? (
                <p className="text-xs text-zinc-500 mt-1">Unassigned</p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {visibleUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700 hover:border-zinc-600 transition"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[11px] text-blue-400 font-semibold">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-xs text-zinc-200">{user.name}</span>
                    </div>
                  ))}
                  {assignees.length > 3 && (
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="cursor-pointer flex items-center gap-1 text-[11px] text-blue-400 hover:underline mt-1"
                    >
                      {showAll ? <><ChevronUp size={12} />Show less</> : <><ChevronDown size={12} />+{extraCount} more</>}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
              <Calendar size={13} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">Due Date</p>
              <p className="text-xs text-zinc-300 font-medium">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                  })
                  : "Not set"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <EditModal
          type="task"
          entity={task}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
};

export default TaskInfoCard;