import timeAgo from '../../../utils/timeAgo.js';
import { FolderOpen, Clock, User } from "lucide-react";
const ProjectCard = ({project , onClick}) => {
    const statusStyle = {
        active: "bg-emerald-500/15 text-emerald-400",
        archived: "bg-zinc-600/30 text-zinc-400",
    };
    return (
        <div>
            <div onClick={onClick} className="bg-linear-to-br from-zinc-800/70 to-zinc-900/10 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition">
                        <FolderOpen size={18} className="text-blue-400" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${statusStyle[project.status] ?? "bg-zinc-700/30 text-zinc-400"}`}>
                        {project.status}
                    </span>
                </div>
                <h3 className="text-white font-semibold mt-2 truncate">{project.name}</h3>
                <p className="text-zinc-500 text-[14px] mt-1 line-clamp-2">
                    {project.description || "No description"}
                </p>
                <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex text-[14px] items-center gap-1.5"><User size={12} />{project.createdBy ?? "Unknown"}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12} />{timeAgo(project.updatedAt ?? project.createdAt)}</span>
                </div>
            </div>
        </div>
    )
}

export default ProjectCard