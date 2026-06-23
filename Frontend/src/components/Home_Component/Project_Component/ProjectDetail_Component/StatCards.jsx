import { CheckCheck, Clock, Flag, AlertTriangle } from "lucide-react";

const StatCard = ({ icon, label, value, accent, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4 transition ${onClick ? "cursor-pointer hover:border-zinc-700" : ""}`}
  >
    <div>
      <p className="text-xs text-zinc-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
    </div>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
      {icon}
    </div>
  </div>
);

const StatCards = ({ tasks = [], onOverdueClick }) => {
  const isOverdue = (t) =>
    t.dueDate && t.Status !== "done" && new Date(t.dueDate) < new Date();
  // console.log(tasks);
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
      <StatCard
        label="Completed"
        value={tasks.filter((t) => t.Status === "done").length}
        icon={<CheckCheck size={20} className="text-emerald-400" />}
        accent="bg-emerald-500/10"
      />
      <StatCard
        label="In Progress"
        value={tasks.filter((t) => t.Status === "inprogress").length}
        icon={<Clock size={20} className="text-yellow-400" />}
        accent="bg-yellow-500/10"
      />
      <StatCard
        label="High Priority"
        value={tasks.filter((t) => t.priority === "high").length}
        icon={<Flag size={20} className="text-red-400" />}
        accent="bg-red-500/10"
      />
      <StatCard
        label="Overdue"
        value={tasks.filter(isOverdue).length}
        icon={<AlertTriangle size={20} className="text-orange-400" />}
        accent="bg-orange-500/10"
        onClick={onOverdueClick}
      />
    </div>
  );
};

export default StatCards;