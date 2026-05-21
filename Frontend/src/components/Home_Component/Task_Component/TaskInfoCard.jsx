import { useState } from "react";
import { User, Calendar, ChevronDown, ChevronUp } from "lucide-react";

const TaskInfoCard = ({ task }) => {
  const [showAll, setShowAll] = useState(false);

  const assignees = task.assignees || [];
  const visibleUsers = showAll ? assignees : assignees.slice(0, 3);
  const extraCount = assignees.length - 3;

  const badge = (label, style) => (
    <span className={`text-[10px] font-semibold px-3 py-1 rounded-full tracking-wide ${style}`}>
      {label}
    </span>
  );

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

  return (
    <div className="bg-linear-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-5 shadow-lg shadow-black/30">

      {/* Title */}
      <div>
        <h2 className="text-white font-semibold text-lg tracking-tight">
          {task.name}
        </h2>
        {task.Description && (
          <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
            {task.Description}
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {badge(task.Status, STATUS_STYLE[task.Status] || STATUS_STYLE.todo)}
        {badge("TASK", "bg-zinc-700/40 text-zinc-300 border border-zinc-700")}
        {badge(task.priority, PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium)}
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-800/70 pt-4 space-y-4">

        {/* Assignees */}
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
            <User size={13} className="text-zinc-400" />
          </div>

          <div className="flex-1">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">
              Assignees
            </p>

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
                      {user.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs text-zinc-200">{user.name}</span>
                  </div>
                ))}

                {/* Expand / Collapse */}
                {assignees.length > 3 && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:underline mt-1"
                  >
                    {showAll ? (
                      <>
                        Show less <ChevronUp size={12} />
                      </>
                    ) : (
                      <>
                        +{extraCount} more <ChevronDown size={12} />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Due date */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
            <Calendar size={13} className="text-zinc-400" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">
              Due Date
            </p>
            <p className="text-xs text-zinc-300 font-medium">
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Not set"}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TaskInfoCard;