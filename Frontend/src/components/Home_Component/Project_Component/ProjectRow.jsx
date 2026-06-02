import { Folder, Clock, User, Trash2, UserCog } from "lucide-react";

const statusStyle = {
  active: "bg-emerald-500/15 text-emerald-400",
  completed: "bg-blue-500/15 text-blue-400",
  onhold: "bg-yellow-500/15 text-yellow-400",
  cancelled: "bg-red-500/15 text-red-400",
  archived: "bg-zinc-600/30 text-zinc-400",
};
const ProjectRow = ({ project, onClick, onDelete, onReassign, org }) => {
  const handleAction = (e, cb) => {
    e.stopPropagation();
    cb();
  };
  return (
    <tr
      onClick={onClick}
      className="border-b border-zinc-800 hover:bg-zinc-900/40 transition cursor-pointer group"
    >
      <td className="px-5 py-4 max-w-62.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <Folder size={14} className="text-blue-400" />
          </div>
          <span className="text-white font-medium leading-tight line-clamp-2 truncate">{project.name}</span>
        </div>
      </td>

      <td className="px-5 py-4 max-w-62.5">
        <span className="text-zinc-400 line-clamp-1 truncate">{project.Description || "—"}</span>
      </td>

      <td className="px-5 py-4">
        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${statusStyle[project.status] ?? "bg-zinc-700/30 text-zinc-400"}`}>
          {project.status}
        </span>
      </td>

      <td className="px-5 py-4 max-w-62.5">
        <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
          <User size={12} className="shrink-0 text-zinc-500" />
          <span className="truncate">{project.email ?? "Unknown"}</span>
        </div>
      </td>

      <td className="px-7 py-4">
        <div className=" text-zinc-500 text-sm whitespace-nowrap">
          {project.priority}
        </div>
      </td>

      {org && org.role === "admin" && (
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => handleAction(e, () => onReassign(project))}
              title="Reassign Manager"
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-blue-400 transition cursor-pointer"
            >
              <UserCog size={16} />
            </button>
            <button
              onClick={(e) => handleAction(e, () => onDelete(project))}
              title="Delete Project"
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
};

export default ProjectRow;