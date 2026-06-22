import { useState } from "react";
import api from "../../api/api.js";
import { Loader2 } from "lucide-react";

const AssigneeCell = ({ taskId, assigneeCount }) => {
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadAssignees = async () => {
    if (loaded) return;

    setLoading(true);
    try {
      const res = await api.get(`/task/${taskId}/assignees`);
      setAssignees(res.data.users);
      setLoaded(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onMouseEnter={loadAssignees} // 🔥 lazy load on hover
      className="flex -space-x-2 cursor-pointer"
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin text-zinc-500" />
      ) : assignees.length > 0 ? (
        <>
          {assignees.slice(0, 3).map((a) => (
            <div
              key={a.id}
              title={a.name}
              className="w-6 h-6 rounded-full bg-zinc-700 border border-zinc-900 flex items-center justify-center text-[10px] text-zinc-300 font-medium uppercase"
            >
              {a.name?.[0] ?? "?"}
            </div>
          ))}

          {assignees.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-zinc-700 border border-zinc-900 flex items-center justify-center text-[10px] text-zinc-400">
              +{assignees.length - 3}
            </div>
          )}
        </>
      ) : (
        <span className="text-zinc-600 text-xs">
          {assigneeCount ?? "—"}
        </span>
      )}
    </div>
  );
};