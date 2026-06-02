import { FolderOpen, User, Trash2, UserCog } from "lucide-react";

const ProjectCard = ({ project, onClick, onDelete, onReassign, org }) => {
  const statusStyle = {
    Active: "bg-emerald-500/15 text-emerald-400",
    archived: "bg-zinc-600/30 text-zinc-400",
    completed: "bg-blue-500/15 text-blue-400",
    onhold: "bg-yellow-500/15 text-yellow-400",
    cancelled: "bg-red-500/15 text-red-400",
  };
  const handleAction = (e, cb) => {
    e.stopPropagation();
    cb();
  };

  return (
    <div
      onClick={onClick}
      className="bg-linear-to-br from-zinc-800/70 to-zinc-900/10 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition cursor-pointer group relative"
    >
      {org && org.role === "admin" && (
        <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1 z-10">
          <button
            onClick={(e) => handleAction(e, () => onReassign(project))}
            title="Reassign Manager"
            className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-blue-400 transition cursor-pointer"
          >
            <UserCog size={15} />
          </button>
          <button
            onClick={(e) => handleAction(e, () => onDelete(project))}
            title="Delete Project"
            className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition">
          <FolderOpen size={18} className="text-blue-400" />
        </div>
        <span className={`group-hover:opacity-0 transition px-2.5 py-1 rounded-md text-xs font-medium ${statusStyle[project.status] ?? "bg-zinc-700/30 text-zinc-400"}`}>
          {project.status}
        </span>
      </div>

      <h3 className="text-white font-semibold mt-2 truncate">{project.name}</h3>
      <p className="text-zinc-500 text-[14px] mt-1 line-clamp-2 truncate">
        {project.Description || "No description"}
      </p>

      <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between gap-2 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5 min-w-0">
          <User size={12} className="shrink-0" />
          <span className="truncate">{project.email ?? "Unknown"}</span>
        </span>
        <span className="shrink-0 capitalize">{project.priority}</span>
      </div>
    </div>
  );
};

export default ProjectCard;