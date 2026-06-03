import { useState } from "react";
import { FolderOpen, Flag, User, Calendar, CheckSquare, Pencil } from "lucide-react";
import { STATUS_STYLE, PRIORITY_COLOR } from "./constants";
import EditModal from "../../Task_Component/EditModal.jsx";


const ProjectInfoCard = ({ project: initialProject, taskCount, org, onUpdate }) => {
  const [project, setProject] = useState({
    ...initialProject,
    rawEndDate: initialProject.endDate,
    endDate: initialProject.endDate
      ? new Date(initialProject.endDate).toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", year: "numeric",
        })
      : "Not set",
  });

  const [editOpen, setEditOpen] = useState(false);
  const isAdmin = !org || org.role === "admin" || org.role === "manager";

  const handleSave = async (fields) => {
    const displayDate = fields.endDate
      ? new Date(fields.endDate).toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", year: "numeric",
        })
      : "Not set";

    setProject((prev) => ({
      ...prev,
      ...fields,
      rawEndDate: fields.endDate,
      endDate:    displayDate,
    }));

    await onUpdate?.(fields);
  };

  return (
    <>
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-7">

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <FolderOpen size={22} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
              <p className="text-sm text-zinc-400 mt-0.5 max-w-xl">
                {project.Description || "No description provided."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${STATUS_STYLE[project.status] ?? "bg-zinc-700/30 text-zinc-400"}`}>
              {project.status}
            </span>
            {isAdmin && (
              <button
                onClick={() => setEditOpen(true)}
                className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 transition text-xs font-medium"
              >
                <Pencil size={12} />Edit
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-6 pt-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: "Priority",    icon: <Flag size={13} />,        value: project.priority ?? "—",       cls: `capitalize ${PRIORITY_COLOR[project.priority] ?? "text-zinc-400"}` },
            { label: "Assigned To", icon: <User size={13} />,        value: project.email ?? "Unassigned", cls: "text-white" },
            { label: "End Date",    icon: <Calendar size={13} />,    value: project.endDate ?? "Not set",  cls: "text-zinc-300" },
            { label: "Total Tasks", icon: <CheckSquare size={13} />, value: `${taskCount} tasks`,          cls: "text-zinc-300" },
          ].map(({ label, icon, value, cls }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{label}</span>
              <span className={`flex items-center gap-1.5 text-sm font-medium ${cls}`}>{icon}{value}</span>
            </div>
          ))}
        </div>
      </div>

      {editOpen && (
        <EditModal
          type="project"
          entity={project}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
};

export default ProjectInfoCard;