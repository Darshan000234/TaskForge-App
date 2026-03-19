import { Folder, Clock, User } from "lucide-react";
import timeAgo from "../../../utils/timeAgo.js";

const statusStyle = {
  active:    "bg-emerald-500/15 text-emerald-400",
  completed: "bg-blue-500/15 text-blue-400",
  onhold:    "bg-yellow-500/15 text-yellow-400",
  cancelled: "bg-red-500/15 text-red-400",
  archived:  "bg-zinc-600/30 text-zinc-400",
};

const ProjectRow = ({ project, onClick }) => (
  <tr
    onClick={onClick}
    className="border-b border-zinc-800 hover:bg-zinc-900/40 transition cursor-pointer"
  >
    <td className="px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
          <Folder size={14} className="text-blue-400" />
        </div>
        <span className="text-white font-medium leading-tight">{project.name}</span>
      </div>
    </td>

    <td className="px-5 py-4">
      <span className="text-zinc-400 line-clamp-1">
        {project.description || "—"}
      </span>
    </td>

    <td className="px-5 py-4">
      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${statusStyle[project.status] ?? "bg-zinc-700/30 text-zinc-400"}`}>
        {project.status}
      </span>
    </td>

    <td className="px-5 py-4">
      <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
        <User size={12} className="shrink-0 text-zinc-500" />
        <span className="truncate">{project.createdBy ?? "Unknown"}</span>
      </div>
    </td>

    <td className="px-5 py-4">
      <div className="flex items-center gap-1.5 text-zinc-500 text-sm whitespace-nowrap">
        <Clock size={12} className="shrink-0" />
        {timeAgo(project.updatedAt ?? project.createdAt)}
      </div>
    </td>
  </tr>
);

export default ProjectRow;