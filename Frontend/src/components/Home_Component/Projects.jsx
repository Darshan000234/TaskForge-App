import { useState, useEffect } from "react";
import { Search, Plus, ChevronDown, LayoutGrid, List } from "lucide-react";
import ProjectRow from "./Project_Component/ProjectRow";
import EmptyState from "./Project_Component/EmptyState";
import ProjectCard from "./Project_Component/ProjectCard";
import NewProjectModal from "./Project_Component/NewProjectModal";
import socket from "../../socket/socket.js";
import toast from "react-hot-toast";
import api from "../../api/api.js";
import { useOutletContext, useNavigate } from "react-router-dom";
import ConfirmDeleteModal from "./Project_Component/ConfirmDeleteModal";
import ReassignManagerModal from "./Project_Component/ReassignManagerModal";

const STATUS_OPTIONS = ["all", "active", "completed", "cancelled", "onhold"];
const PRIORITY_OPTIONS = ["all", "low", "medium", "high"];
const Dropdown = ({ value, options, onChange, label }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer flex items-center gap-2 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-300 hover:border-zinc-500 transition bg-zinc-900"
      >
        {label}: <span className="capitalize text-white">{value}</span>
        <ChevronDown size={14} className="text-zinc-400" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden z-20 min-w-full">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`cursor-pointer w-full text-left px-4 py-2 text-sm capitalize hover:bg-zinc-800 transition ${value === opt ? "text-white font-medium" : "text-zinc-400"
                }`}
            >
              {opt === "all" ? `All ${label}` : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Projects = () => {
  // const { orgId } = useParams();       // uncomment for real routes
  const navigate = useNavigate();      // uncomment for real routes

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reassignTarget, setReassignTarget] = useState(null);
  const { org } = useOutletContext();

  useEffect(() => {
    if (!org) return;
    const fetchProjects = async () => {
      const proj = await api.post(`/orgs/proj/${org.id}`);
      setProjects(proj.data);
      setLoading(false);
    };

    fetchProjects();
  }, [org]);

  useEffect(() => {
    const handleProjectCreated = (data) => {
      console.log(data);
      const project = data.project;
      setLoading(true);
      setProjects((prev) => [project, ...prev]);
      setTimeout(() => {
        setLoading(false);
      }, 4000);
      socket.emit('join_proj', { proj: project });
    }
    const handleProjectDeleted = (data) => {
      console.log(data.id);
      setLoading(true);
      // const project = data.id;
      setProjects((prev) => prev.filter((p) => p.id !== data.id));
      setTimeout(() => {
        setLoading(false);
      }, 4000);
    }
    socket.on("project_created", handleProjectCreated);
    socket.on("project_deleted", handleProjectDeleted);
    return () => {
      socket.off("project_created", handleProjectCreated);
      socket.on("project_deleted", handleProjectDeleted);
    }
  }, [])

  const handleDelete = async (projectId) => {
    try {
      await api.delete(`/orgs/proj/${projectId}`);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleReassigned = (updatedProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    setReassignTarget(null);
  };

  const filtered = projects.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchPriority = priorityFilter === "all" || p.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const handleProjectClick = (project) => {
    navigate(`/user/dashboard/projects/${project.id}`);
  };

  const handleProjectCreated = async (newProject) => {
    console.log(newProject);
    setShowModal(false);
    setLoading(true);
    const data = await api.post('/orgs/proj/', { proj: newProject, orgid: Number(org.id) });
    setProjects((prev) => [data.data.project, ...prev]);
    setTimeout(() => {
      setLoading(false);
    }, 4000);
  }
  return (
    <div className="min-h-screen bg-black text-white px-18 py-15">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="text-zinc-400 mt-1">Manage and track your projects</p>
        </div>
        {org && org.role === "admin" && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer"
          >
            <Plus size={18} />New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mt-10 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition"
          />
        </div>
        <Dropdown label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
        <Dropdown label="Priority" value={priorityFilter} options={PRIORITY_OPTIONS} onChange={setPriorityFilter} />
        <div className="ml-auto flex items-center gap-1 border border-zinc-800 rounded-lg p-1 bg-zinc-900">
          <button onClick={() => setViewMode("grid")}
            className={`cursor-pointer p-2 rounded-md transition ${viewMode === "grid" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setViewMode("list")}
            className={`cursor-pointer p-2 rounded-md transition ${viewMode === "list" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-8">
        {loading ? (
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-3"}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-zinc-900 animate-pulse border border-zinc-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onNew={() => setShowModal(true)} context={{ org: org }} />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                org={org}
                onClick={() => handleProjectClick(project)}
                onDelete={() => setDeleteTarget(project)}
                onReassign={() => setReassignTarget(project)}
              />
            ))}
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                <tr className="text-left">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Assigned to</th>
                  <th className="px-6 py-4 font-medium">Last Updated</th>
                  {org && org.role === "admin" && (
                    <th className="px-6 py-4 font-medium">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    org={org}
                    onClick={() => handleProjectClick(project.id)}
                    onDelete={() => handleDelete(project)}
                    onReassign={() => setReassignTarget(project)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={(newProject) => {
            handleProjectCreated(newProject);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          project={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {reassignTarget && (
        <ReassignManagerModal
          project={reassignTarget}
          onClose={() => setReassignTarget(null)}
          onReassigned={handleReassigned}
        />
      )}
    </div>
  );
};

export default Projects;