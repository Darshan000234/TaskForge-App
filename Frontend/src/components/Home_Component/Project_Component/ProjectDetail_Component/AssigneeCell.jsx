import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

function useClickOutside(ref, cb) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
}

/**
 * AssigneeCell
 *
 * Props:
 *  assignees       [{ id, name, email }]
 *  canEdit         boolean              — show remove buttons (admin only)
 *  onRemoveMember  (memberId) => void
 */
const AssigneeCell = ({ assignees = [], canEdit = false, onRemoveMember }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  if (!assignees.length)
    return <span className="text-zinc-600 text-xs">—</span>;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="cursor-pointer flex items-center gap-1.5 group"
      >
        <div className="flex -space-x-2">
          {assignees.slice(0, 3).map((a, i) => (
            <div
              key={i}
              title={a.name}
              className="w-6 h-6 rounded-full bg-blue-500/20 border border-zinc-800 flex items-center justify-center text-[10px] font-semibold text-blue-400"
            >
              {a.name?.[0]?.toUpperCase()}
            </div>
          ))}
          {assignees.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-zinc-700 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-medium">
              +{assignees.length - 3}
            </div>
          )}
        </div>
        <ChevronDown size={12} className="text-zinc-500 group-hover:text-zinc-300 transition" />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-30 min-w-[220px] bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden">
          <p className="px-3 py-2 text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
            {assignees.length} Assignee{assignees.length > 1 ? "s" : ""}
          </p>
          {assignees.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-800 transition group/row"
            >
              <div className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center text-[10px] font-semibold text-blue-400 shrink-0">
                {a.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white font-medium truncate">{a.name}</p>
                <p className="text-[10px] text-zinc-500 truncate">{a.email}</p>
              </div>

              {/* Remove member — visible on row hover, only when canEdit */}
              {canEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveMember?.(a.id); }}
                  title="Remove from task"
                  className="cursor-pointer shrink-0 opacity-0 group-hover/row:opacity-100 p-1 rounded-md hover:bg-red-500/15 text-zinc-500 hover:text-red-400 transition"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssigneeCell;