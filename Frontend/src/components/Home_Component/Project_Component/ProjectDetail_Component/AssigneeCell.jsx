import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../../../api/api.js";
import { Loader2, ChevronDown, X } from "lucide-react";

function useClickOutside(ref, cb) {
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) cb();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
}

/**
 * Props:
 *  taskId        — used for lazy fetch
 *  assignees     — array passed from parent (source of truth after fetch)
 *  assigneeCount — shown before fetch completes
 *  canEdit       — show remove button
 *  onRemoveMember(memberId) — called to update parent
 *  onAssigneesLoaded(taskId, assignees) — callback so parent can store fetched data
 */
const AssigneeCell = ({
  taskId,
  assignees: parentAssignees = null,
  assigneeCount = 0,
  canEdit = false,
  onRemoveMember,
  onAssigneesLoaded,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  const fetchAssignees = useCallback(async () => {
    if (fetched || !taskId) return;
    setLoading(true);
    try {
      const res = await api.get(`/proj/task/${taskId}/assignees`);
      const users = res.data.users || [];
      setFetched(true);
      onAssigneesLoaded?.(taskId, users);
    } catch (err) {
      console.error("Failed to fetch assignees:", err);
    } finally {
      setLoading(false);
    }
  }, [fetched, taskId, onAssigneesLoaded]);

  const toggle = async (e) => {
    e.stopPropagation();
    if (!open && parentAssignees === null) {
      await fetchAssignees();
    }
    setOpen((prev) => !prev);
  };

  const handleRemove = (e, memberId) => {
    e.stopPropagation();
    onRemoveMember?.(memberId);
  };

  const hasLoaded = parentAssignees !== null;
  const displayCount = hasLoaded ? parentAssignees.length : assigneeCount;
  const displayList = parentAssignees ?? [];

  return (
    <div className="relative w-fit" ref={ref}>
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white"
      >
        <span className="px-2 py-0.5 rounded-md bg-zinc-800 font-medium">
          {displayCount}
        </span>
        <ChevronDown size={12} className="text-zinc-500 cursor-pointer" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] bg-zinc-900 border border-zinc-700 rounded-xl shadow-lg z-50">
          <p className="px-3 py-2 text-[10px] text-zinc-500 uppercase border-b border-zinc-800">
            Assignees
          </p>

          {loading && (
            <p className="px-3 py-3 text-xs text-zinc-500 flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" />
              Loading...
            </p>
          )}

          {!loading && displayList.length === 0 && (
            <p className="px-3 py-3 text-xs text-zinc-500">No assignees</p>
          )}

          {displayList.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 group"
            >
              <div className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center text-[10px] font-semibold text-blue-400 shrink-0">
                {a.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-300 truncate">{a.name}</p>
                <p className="text-[10px] text-zinc-500 truncate">{a.email}</p>
              </div>
              {canEdit && onRemoveMember && (
                <button
                  onClick={(e) => handleRemove(e, a.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/15 text-zinc-500 hover:text-red-400 transition"
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