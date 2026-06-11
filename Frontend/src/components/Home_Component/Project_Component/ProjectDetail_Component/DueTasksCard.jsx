import { AlertTriangle, Calendar, Circle, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { PRIORITY_COLOR, PRIORITY_DOT, TASK_STATUS_STYLE, isOverdue } from "./constants";

const STATUS_ICON = {
  todo:       <Circle size={13} className="text-zinc-500" />,
  inprogress: <Clock size={13} className="text-yellow-400" />,
  done:       <CheckCircle2 size={13} className="text-emerald-400" />,
  blocked:    <AlertCircle size={13} className="text-red-400" />,
};

const DueTaskItem = ({ task }) => (
  <div className="px-4 py-3 border-b border-zinc-800/60 hover:bg-zinc-800/30 transition cursor-pointer last:border-b-0">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {STATUS_ICON[task.status]}
        <p className="text-sm text-white font-medium truncate">{task.title}</p>
      </div>
      <span className={`text-[10px] px-2 py-0.5 rounded-md shrink-0 capitalize font-medium ${TASK_STATUS_STYLE[task.status]}`}>
        {task.status === "inprogress" ? "In Progress" : task.status}
      </span>
    </div>

    <div className="flex items-center gap-3 mt-1.5 text-xs">
      <span className={`flex items-center gap-1 capitalize font-medium ${PRIORITY_COLOR[task.priority]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
        {task.priority}
      </span>
      <span className="flex items-center gap-1 text-red-400/80">
        <Calendar size={11} />
        {task.dueDate}
      </span>
    </div>

    {(task.assignees?.length ?? 0) > 0 && (
      <div className="flex -space-x-1.5 mt-2">
        {task.assignees.slice(0, 5).map((a, i) => (
          <div
            key={i}
            title={a.name}
            className="w-5 h-5 rounded-full bg-zinc-700 border border-zinc-900 flex items-center justify-center text-[9px] font-semibold text-zinc-300"
          >
            {a.name?.[0]?.toUpperCase()}
          </div>
        ))}
      </div>
    )}
  </div>
);


const DueTasksCard = ({ tasks = [] }) => {
  const overdue = tasks.filter(isOverdue);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-400" />
          <span className="text-sm font-semibold text-white">Overdue Today</span>
        </div>
        <span
          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${overdue.length > 0 ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"}`}
        >
          {overdue.length}
        </span>
      </div>

      {overdue.length === 0 ? (
        <p className="text-sm text-zinc-600 text-center py-8">No overdue tasks</p>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {overdue.map((t) => <DueTaskItem key={t.id} task={t} />)}
        </div>
      )}
    </div>
  );
};

export default DueTasksCard;