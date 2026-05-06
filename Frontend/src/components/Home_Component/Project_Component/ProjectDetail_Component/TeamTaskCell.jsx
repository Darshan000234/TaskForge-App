import { useState, useRef, useEffect } from "react";
import { ChevronDown, Circle, Clock, CheckCircle2, AlertCircle, X } from "lucide-react";
import { PRIORITY_COLOR } from "./constants";

function useClickOutside(ref, cb) {
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) cb();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
}

const STATUS_ICON = {
  todo: <Circle size={13} className="text-zinc-500" />,
  inprogress: <Clock size={13} className="text-yellow-400" />,
  done: <CheckCircle2 size={13} className="text-emerald-400" />,
  blocked: <AlertCircle size={13} className="text-red-400" />,
};

const TeamTaskCell = ({
  tasks = [],
  memberId,
  canEdit = false,
  onRemoveTaskFromMember
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="relative w-fit" ref={ref}>
      {/* Trigger */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white"
      >
        <span className="px-2 py-0.5 rounded-md bg-zinc-800 font-medium">
          {tasks.length}
        </span>
        <ChevronDown size={12} className="text-zinc-500 cursor-pointer" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-lg z-50">

          <p className="px-3 py-2 text-[10px] text-zinc-500 uppercase border-b border-zinc-800">
            Assigned Tasks
          </p>

          {tasks.length === 0 && (
            <p className="px-3 py-3 text-xs text-zinc-500">
              No tasks
            </p>
          )}

          {tasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 group"
            >
              {STATUS_ICON[t.Status]}

              <span className="flex-1 text-xs text-zinc-300 truncate">
                {t.name}
              </span>

              <span className={`text-[10px] ${PRIORITY_COLOR[t.priority]}`}>
                {t.priority}
              </span>

              {canEdit && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">

                  {/* ✅ CORRECT HANDLER */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveTaskFromMember(t.id, memberId);
                    }}
                    title="Remove from task"
                    className="cursor-pointer p-1 rounded-md hover:bg-red-500/15 text-zinc-500 hover:text-red-400 transition"
                  >
                    <X size={13} />
                  </button>

                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamTaskCell;