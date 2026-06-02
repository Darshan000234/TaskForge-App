import { History, Plus, X, User, CheckCheck, Timer, TrendingUp } from "lucide-react";

const ACTION_ICON = {
  created:   <Plus size={13} className="text-emerald-400" />,
  updated:   <TrendingUp size={13} className="text-blue-400" />,
  deleted:   <X size={13} className="text-red-400" />,
  assigned:  <User size={13} className="text-purple-400" />,
  completed: <CheckCheck size={13} className="text-emerald-400" />,
  status:    <Timer size={13} className="text-yellow-400" />,
};

const AuditItem = ({ log }) => (
  <div className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/40 transition border-b border-zinc-800/60 last:border-b-0">
    <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
      {ACTION_ICON[log.action] ?? <History size={13} className="text-zinc-500" />}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm leading-snug">
        <span className="text-white font-medium">{log.actor} </span>
        <span className="text-zinc-400">{log.message}</span>
      </p>
      <p className="text-[11px] text-zinc-600 mt-0.5">{log.timestamp}</p>
    </div>
  </div>
);

/**
 * AuditLogCard
 * Right-sidebar panel showing activity log entries.
 *
 * Props:
 *  logs  [{ id, actor, action, message, timestamp }]
 */
const AuditLogCard = ({ logs = [] }) => (
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
      <p className="text-sm text-zinc-600 text-center py-8">No activity yet</p>
    ) : (
      <div className="max-h-80 overflow-y-auto">
        {logs.map((log) => <AuditItem key={log.id} log={log} />)}
      </div>
    )}
  </div>
);

export default AuditLogCard;