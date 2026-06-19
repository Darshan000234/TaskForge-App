import { useState, useEffect, useCallback, useRef } from "react";
import {
  History, Plus, Trash2, UserPlus, UserMinus,
  RefreshCw, Flag, Pencil, ChevronDown, ChevronUp,
  Loader2, AlertCircle, Filter, X,
} from "lucide-react";

const ACTION_CONFIG = {
  CREATED: { label: "Created", icon: Plus, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  DELETED: { label: "Deleted", icon: Trash2, color: "text-red-400", bg: "bg-red-500/10" },
  UPDATED: { label: "Updated", icon: Pencil, color: "text-blue-400", bg: "bg-blue-500/10" },
  ASSIGNED: { label: "Assigned", icon: UserPlus, color: "text-purple-400", bg: "bg-purple-500/10" },
  UNASSIGNED: { label: "Unassigned", icon: UserMinus, color: "text-orange-400", bg: "bg-orange-500/10" },
  STATUS_CHANGED: { label: "Status Changed", icon: RefreshCw, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  PRIORITY_CHANGED: { label: "Priority Changed", icon: Flag, color: "text-pink-400", bg: "bg-pink-500/10" },
};

const RESOURCE_BADGE = {
  TASK: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  PROJECT: "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  MEMBER: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  ORG: "bg-orange-500/15 text-orange-400 border border-orange-500/20",
};

const ACTION_OPTIONS = ["", "CREATED", "DELETED", "UPDATED", "ASSIGNED", "UNASSIGNED", "STATUS_CHANGED", "PRIORITY_CHANGED"];
const RESOURCE_OPTIONS = ["", "TASK", "PROJECT", "MEMBER", "ORG"];

const formatTime = (iso) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
};

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const DiffViewer = ({ diff }) => {
  if (!diff || !Object.keys(diff).length) return null;

  if ("added" in diff || "removed" in diff) {
    return (
      <div className="mt-2 space-y-1">
        {diff.added?.length > 0 && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-emerald-400 font-medium shrink-0">+ Added:</span>
            <span className="text-zinc-300">{diff.added.map((u) => u.name).join(", ")}</span>
          </div>
        )}
        {diff.removed?.length > 0 && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-red-400 font-medium shrink-0">− Removed:</span>
            <span className="text-zinc-300">{diff.removed.map((u) => u.name).join(", ")}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      {Object.entries(diff).map(([field, change]) => (
        <div key={field} className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-zinc-500 capitalize">{field}:</span>
          <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 line-through">
            {String(change.from ?? "—")}
          </span>
          <span className="text-zinc-600">→</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
            {String(change.to ?? "—")}
          </span>
        </div>
      ))}
    </div>
  );
};

const AuditLogRow = ({ log }) => {
  const [expanded, setExpanded] = useState(false);

  const cfg = ACTION_CONFIG[log.action] ?? { label: log.action, icon: History, color: "text-zinc-400", bg: "bg-zinc-800" };
  const ActionIcon = cfg.icon;
  const { date, time } = formatTime(log.createdAt);
  const diff = log.metadata?.diff ?? null;
  const hasDiff = diff && Object.keys(diff).length > 0;
  const hasJson = log.oldValue || log.newValue;

  return (
    <div className="border-b border-zinc-800/60 last:border-b-0 hover:bg-zinc-900/40 transition">
      <div
        className={`flex items-start gap-4 px-5 py-4 ${hasDiff || hasJson ? "cursor-pointer" : ""}`}
        onClick={() => (hasDiff || hasJson) && setExpanded((e) => !e)}
      >
        <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
          <ActionIcon size={14} className={cfg.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[9px] font-bold text-blue-400">
                {log.user?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="text-sm font-medium text-white">
                {log.user?.name ?? "System"}
              </span>
            </div>

            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>

            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${RESOURCE_BADGE[log.resourceType] ?? "bg-zinc-700/40 text-zinc-400"}`}>
              {log.resourceType} #{log.resourceId}
            </span>
          </div>

          {expanded && hasDiff && <DiffViewer diff={diff} />}

          {expanded && !hasDiff && hasJson && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {log.oldValue && (
                <div>
                  <p className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">Before</p>
                  <pre className="text-[10px] text-zinc-400 bg-zinc-800/60 rounded-lg p-2 overflow-x-auto">
                    {JSON.stringify(log.oldValue, null, 2)}
                  </pre>
                </div>
              )}
              {log.newValue && (
                <div>
                  <p className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">After</p>
                  <pre className="text-[10px] text-zinc-400 bg-zinc-800/60 rounded-lg p-2 overflow-x-auto">
                    {JSON.stringify(log.newValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs text-zinc-400">{timeAgo(log.createdAt)}</p>
            <p className="text-[10px] text-zinc-600">{date} · {time}</p>
          </div>
          {(hasDiff || hasJson) && (
            <div className="text-zinc-600 hover:text-zinc-400 transition">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FilterBar = ({ filters, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const set = (k, v) => onChange({ ...filters, [k]: v || undefined });
  const activeCount = Object.values(filters).filter(Boolean).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition ${activeCount > 0
            ? "border-blue-500/50 text-blue-400 bg-blue-500/10"
            : "border-zinc-700 text-zinc-400 bg-zinc-900 hover:border-zinc-600 hover:text-zinc-300"
          }`}
      >
        <Filter size={13} />
        Filters
        {activeCount > 0 && (
          <span className="bg-blue-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed z-[9999] w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-4 space-y-3"
          style={{
            top: ref.current
              ? ref.current.getBoundingClientRect().bottom + 8
              : 0,
            right: window.innerWidth - (ref.current
              ? ref.current.getBoundingClientRect().right
              : 0),
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Filters</span>
            <button
              onClick={() => setOpen(false)}
              className="cursor-pointer text-zinc-500 hover:text-zinc-300 transition"
            >
              <X size={13} />
            </button>
          </div>

          {[
            { label: "Action", field: "action", options: ACTION_OPTIONS },
            { label: "Resource", field: "resourceType", options: RESOURCE_OPTIONS },
          ].map(({ label, field, options }) => (
            <div key={field}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-1">
                {label}
              </p>
              <select
                value={filters[field] ?? ""}
                onChange={(e) => set(field, e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
              >
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o || `All ${label}s`}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-1">
              From
            </p>
            <input
              type="date"
              value={filters.from ?? ""}
              onChange={(e) => set("from", e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 scheme-dark"
            />
          </div>

          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-1">
              To
            </p>
            <input
              type="date"
              value={filters.to ?? ""}
              onChange={(e) => set("to", e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 scheme-dark"
            />
          </div>

          <button
            onClick={() => { onChange({}); setOpen(false); }}
            className="cursor-pointer w-full py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-white hover:border-zinc-500 transition"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

const AuditLogList = ({ orgId = null, proj_id = null, api, compact = false, limit = 15 }) => {
  const [logs, setLogs] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

  const fetchLogs = useCallback(async (cursorValue, currentFilters) => {
    const isFirst = !cursorValue;
    if (isFirst) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit });
      if (cursorValue) params.set("cursor", cursorValue);
      if (currentFilters.action) params.set("action", currentFilters.action);
      if (currentFilters.resourceType) params.set("resourceType", currentFilters.resourceType);
      if (currentFilters.from) params.set("from", currentFilters.from);
      if (currentFilters.to) params.set("to", currentFilters.to);
      if (orgId) params.set("orgId", orgId);
      if (proj_id) params.set("proj_id", proj_id);

      const res = await api.get(`/audit?${params}`);
      const { logs: newLogs, nextCursor: nc, hasMore: hm } = res.data;

      setLogs((prev) => isFirst ? newLogs : [...prev, ...newLogs]);
      setNextCursor(nc);
      setHasMore(hm);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to load audit logs");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [orgId, limit, api]);

  useEffect(() => {
    if (!orgId && !proj_id) return;
    setLogs([]);
    setNextCursor(null);
    fetchLogs(null, filters);
  }, [orgId, proj_id, filters]);

  const loadMore = () => {
    if (hasMore && !loadingMore) fetchLogs(nextCursor, filters);
  };


  return (
    <div className={compact ? "" : "flex-1 min-w-0"}>

      {!compact && (
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <History size={16} className="text-zinc-400" />
            <h2 className="text-sm font-semibold text-white">Audit Logs</h2>
          </div>

          <FilterBar filters={filters} onChange={setFilters} />

        </div>
      )}

      {compact && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <History size={14} className="text-zinc-400" />
            <h3 className="text-white text-[14px]">Recent Activity</h3>
          </div>

          <FilterBar filters={filters} onChange={setFilters} />
        </div>
      )}

      {loading && (
        <div className="space-y-0.5">
          {Array.from({ length: compact ? 4 : 8 }).map((_, i) => (
            <div key={i} className={`flex items-start gap-4 ${compact ? "px-6 py-4" : "px-5 py-4"}`}>
              <div className="w-8 h-8 rounded-lg bg-zinc-800 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-zinc-800 animate-pulse rounded w-2/3" />
                <div className="h-2.5 bg-zinc-800 animate-pulse rounded w-1/3" />
              </div>
              <div className="w-14 h-3 bg-zinc-800 animate-pulse rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className={`flex items-center gap-2 ${compact ? "px-6 py-8" : "py-12"} justify-center`}>
          <AlertCircle size={16} className="text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className={`flex items-center justify-center ${compact ? "py-10" : "py-16"} text-zinc-500 text-sm`}>
          No activity yet
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <>
          <div className={compact ? "" : "border border-zinc-800 rounded-xl overflow-hidden"}>
            {logs.map((log) => <AuditLogRow key={log.id} log={log} />)}

            {loadingMore && Array.from({ length: 3 }).map((_, i) => (
              <div key={`skel-${i}`} className="flex items-start gap-4 px-5 py-4 border-t border-zinc-800/40">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-zinc-800 animate-pulse rounded w-1/2" />
                  <div className="h-2.5 bg-zinc-800 animate-pulse rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-5">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loadingMore
                  ? <><Loader2 size={14} className="animate-spin" />Loading...</>
                  : "Load more activity"}
              </button>
            </div>
          )}

        </>
      )}
    </div>
  );
};

export default AuditLogList;
