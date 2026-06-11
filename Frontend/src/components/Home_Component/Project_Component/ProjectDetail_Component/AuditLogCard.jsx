import { useEffect, useState } from "react";
import { History, Plus, X, User, CheckCheck, Timer, TrendingUp } from "lucide-react";
import api from "../../../../api/api.js";

const ACTION_ICON = {
  CREATED: <Plus size={13} className="text-emerald-400" />,
  UPDATED: <TrendingUp size={13} className="text-blue-400" />,
  DELETED: <X size={13} className="text-red-400" />,
  ASSIGNED: <User size={13} className="text-purple-400" />,
  COMPLETED: <CheckCheck size={13} className="text-emerald-400" />,
  STATUS_CHANGED: <Timer size={13} className="text-yellow-400" />,
};

const formatMessage = (log) => {
  switch (log.action) {
    case "CREATED":
      return `created ${log.resourceType.toLowerCase()}`;
    case "UPDATED":
      return `updated ${log.resourceType.toLowerCase()}`;
    case "ASSIGNED":
      return `assigned users`;
    case "UNASSIGNED":
      return `removed users`;
    default:
      return log.action.toLowerCase();
  }
};

const AuditItem = ({ log }) => (
  <div className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/40 transition border-b border-zinc-800/60 last:border-b-0">
    <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
      {ACTION_ICON[log.action] ?? <History size={13} className="text-zinc-500" />}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm leading-snug">
        <span className="text-white font-medium">
          {log.user?.name || "System"}{" "}
        </span>
        <span className="text-zinc-400">
          {formatMessage(log)}
        </span>
      </p>
      <p className="text-[11px] text-zinc-600 mt-0.5">
        {new Date(log.createdAt).toLocaleString()}
      </p>
    </div>
  </div>
);

const AuditLogCard = ({ proj_id, limit = null }) => {
  const [logs, setLogs] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async (cursorValue = null) => {
    if (loading) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (cursorValue) params.set("cursor", cursorValue);
      if (limit) params.set("limit", limit);
      if (proj_id) params.set("proj_id", proj_id);

      const res = await api.get(`/audit/${params}`);

      const { logs: newLogs, nextCursor, hasMore } = res.data;

      setLogs((prev) => cursorValue ? [...prev, ...newLogs] : newLogs);
      setCursor(nextCursor);
      setHasMore(hasMore);

    } catch (err) {
      console.error("Audit fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [proj_id]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <History size={16} className="text-zinc-400" />
          <span className="text-sm font-semibold text-white">Activity</span>
        </div>
        <span className="text-xs font-bold w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center">
          {logs.length}
        </span>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-zinc-600 text-center py-8">
          No activity yet
        </p>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {logs.map((log) => (
            <AuditItem key={log.id} log={log} />
          ))}

          {!limit && hasMore && (
            <button
              onClick={() => fetchLogs(cursor)}
              className="w-full py-2 text-xs text-zinc-400 hover:text-white"
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLogCard;