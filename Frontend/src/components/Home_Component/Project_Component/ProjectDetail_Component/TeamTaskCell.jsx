import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Circle, Clock, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { PRIORITY_COLOR } from "./constants";
import toast from "react-hot-toast";
import api from "../../../../api/api.js";

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
  todo:       <Circle       size={13} className="text-zinc-500" />,
  inprogress: <Clock        size={13} className="text-yellow-400" />,
  done:       <CheckCircle2 size={13} className="text-emerald-400" />,
  blocked:    <AlertCircle  size={13} className="text-red-400" />,
};

const TeamTaskCell = ({
  memberId,
  proj_id,
  tasks: parentTasks = null,
  taskCount = 0,
  canEdit = false,
  onRemoveTask,
  onTasksLoaded,
}) => {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  const fetchTasks = useCallback(async () => {
    if (fetched || !memberId || !proj_id) return;
    setLoading(true);
    try {
      const res = await api.get(`/proj/team/member/${proj_id}/${memberId}`);
      const result = res.data.result || [];
      setFetched(true);
      onTasksLoaded?.(memberId, result);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [fetched, memberId, proj_id, onTasksLoaded]);

  const toggle = async (e) => {
    e.stopPropagation();
    if (!open && parentTasks === null) {
      await fetchTasks();
    }
    setOpen((prev) => !prev);
  };

  const handleRemove = (e, taskId) => {
    e.stopPropagation();
    onRemoveTask?.(taskId);
  };

  const hasLoaded    = parentTasks !== null;
  const displayCount = hasLoaded ? parentTasks.length : taskCount;
  const displayList  = parentTasks ?? [];

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
            Assigned Tasks
          </p>

          {loading && (
            <p className="px-3 py-3 text-xs text-zinc-500 flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" /> Loading...
            </p>
          )}

          {!loading && displayList.length === 0 && (
            <p className="px-3 py-3 text-xs text-zinc-500">No tasks</p>
          )}

          {displayList.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 group"
            >
              {STATUS_ICON[t.Status]}
              <span className="flex-1 text-xs text-zinc-300 truncate">{t.name}</span>
              <span className={`text-[10px] ${PRIORITY_COLOR[t.priority]}`}>
                {t.priority}
              </span>
              {canEdit && (
                <button
                  onClick={(e) => handleRemove(e, t.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/15 text-zinc-500 hover:text-red-400 transition cursor-pointer"
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

export default TeamTaskCell;