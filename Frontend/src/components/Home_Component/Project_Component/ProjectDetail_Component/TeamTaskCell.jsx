import { useState, useRef, useEffect } from "react";
import { ChevronDown, Circle, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { PRIORITY_COLOR } from "./constants";

function useClickOutside(ref, cb) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
}

const STATUS_ICON = {
  todo:       <Circle size={13} className="text-zinc-500" />,
  inprogress: <Clock size={13} className="text-yellow-400" />,
  done:       <CheckCircle2 size={13} className="text-emerald-400" />,
  blocked:    <AlertCircle size={13} className="text-red-400" />,
};

/**
 * TeamTaskCell
 * Shows a count badge. Click opens a popover listing assigned tasks.
 *
 * Props:
 *  tasks  [{ id, title, status, priority }]
 */
const TeamTaskCell = ({ tasks = [] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  console.log(tasks);
  
  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="cursor-pointer flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition"
      >
        <span className="px-2 py-0.5 rounded-md bg-zinc-800 font-medium">{tasks.length}</span>
        <ChevronDown size={12} className="text-zinc-500" />
      </button>

      {open && tasks.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 z-30 min-w-62.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden">
          <p className="px-3 py-2 text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
            Assigned Tasks
          </p>
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-800 transition">
              {STATUS_ICON[t.Status]}
              <span className="text-xs text-zinc-300 flex-1 truncate">{t.name}</span>
              <span className={`text-[10px] font-medium capitalize ${PRIORITY_COLOR[t.priority]}`}>
                {t.priority}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamTaskCell;