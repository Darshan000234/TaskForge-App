import { useState, useEffect } from "react";
import { Search, Plus, ChevronDown, LayoutGrid, List } from "lucide-react";
import ProjectRow from "./Project_Component/ProjectRow";
import EmptyState from "./Project_Component/EmptyState";
import ProjectCard from "./Project_Component/ProjectCard";
import NewProjectModal from "./Project_Component/NewProjectModal";
import socket from "../../socket/socket.js";
import api from "../../api/api.js";
import { useOutletContext, useNavigate } from "react-router-dom";
import ConfirmDeleteModal from "./Project_Component/ConfirmDeleteModal";
import ReassignManagerModal from "./Project_Component/ReassignManagerModal";
import toast from "react-hot-toast";

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
  const navigate = useNavigate();
  const { org }  = useOutletContext();


  const [projects,       setProjects]       = useState([]);
  const [nextCursor,     setNextCursor]     = useState(null);
  const [hasMore,        setHasMore]        = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [loadingMore,    setLoadingMore]    = useState(false);

  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [viewMode,       setViewMode]       = useState("grid");
  const [showModal,      setShowModal]      = useState(false);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [reassignTarget, setReassignTarget] = useState(null);

  
  useEffect(() => {
    if (!org) return;
    setProjects([]);
    setNextCursor(null);
    setHasMore(false);
    fetchProjects(null, true);
  }, [org]);


  const fetchProjects = async (cursorValue, isInitial = false) => {
    if (isInitial) setLoading(true);
    else           setLoadingMore(true);

    try {
      const params = new URLSearchParams({ limit: 12 });
      if (cursorValue) params.set("cursor", cursorValue);

      const res = await api.post(`/orgs/proj/${org.id}?${params}`);
      const { result, nextCursor: nc, hasMore: hm } = res.data;

      setProjects((prev) => cursorValue ? [...prev, ...result] : result);
      setNextCursor(nc);
      setHasMore(hm);
    } catch (err) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) fetchProjects(nextCursor);
  };


  useEffect(() => {
    const handleProjectCreated = async (data) => {
      setProjects((prev) => [data.project, ...prev]);
      socket.emit("join_proj", { id: data.project.id });
    };

    const handleProjectDeleted = (data) => {
      setProjects((prev) => prev.filter((p) => p.id !== data.id));
    };

    const handleProjectReassign = async (data) => {
      try {
        const res = await api.get(`/orgs/proj/one/${data.proj_id}`);
        const updated = res.data.data;
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } catch { }
    };

    socket.on("project_created",  handleProjectCreated);
    socket.on("project_deleted",  handleProjectDeleted);
    socket.on("project_reassign", handleProjectReassign);

    return () => {
      socket.off("project_created",  handleProjectCreated);
      socket.off("project_deleted",  handleProjectDeleted);
      socket.off("project_reassign", handleProjectReassign);
    };
  }, []);


  const handleDelete = async (projectId) => {
    try {
      await api.delete(`/orgs/proj/${projectId}` , {data : {org_id : org.id}});
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      toast.error("Delete failed");
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

  const handleProjectCreated = async (newProject) => {
    setShowModal(false);
    await api.post("/orgs/proj/", { proj: newProject, org_id: Number(org.id) });
  };

  const handleProjectClick = (project) => {
    navigate(`/user/dashboard/projects/${project.id}`, { replace: true });
  };


  const filtered = projects.filter((p) => {
    const matchSearch   = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus   = statusFilter   === "all" || p.status   === statusFilter;
    const matchPriority = priorityFilter === "all" || p.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });


  return (
    <div className="min-h-screen bg-black text-white px-18 py-15">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="text-zinc-400 mt-1">Manage and track your projects</p>
        </div>
        {org?.role === "admin" && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer"
          >
            <Plus size={18} />New Project
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mt-10 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition"
          />
        </div>
        <Dropdown label="Status"   value={statusFilter}   options={STATUS_OPTIONS}   onChange={setStatusFilter}   />
        <Dropdown label="Priority" value={priorityFilter} options={PRIORITY_OPTIONS} onChange={setPriorityFilter} />
        <div className="ml-auto flex items-center gap-1 border border-zinc-800 rounded-lg p-1 bg-zinc-900">
          <button
            onClick={() => setViewMode("grid")}
            className={`cursor-pointer p-2 rounded-md transition ${viewMode === "grid" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`cursor-pointer p-2 rounded-md transition ${viewMode === "list" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      <div className="mt-8">

        {loading ? (
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-3"}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-zinc-900 animate-pulse border border-zinc-800" />
            ))}
          </div>

        ) : filtered.length === 0 && !hasMore ? (
          <EmptyState onNew={() => setShowModal(true)} context={{ org }} />

        ) : viewMode === "grid" ? (
          <>
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

              {loadingMore && Array.from({ length: 4 }).map((_, i) => (
                <div key={`skel-${i}`} className="h-40 rounded-xl bg-zinc-900 animate-pulse border border-zinc-800" />
              ))}
            </div>

            {hasMore && !loadingMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  className="cursor-pointer flex items-center gap-2 px-6 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition"
                >
                  Load more projects
                </button>
              </div>
            )}
            
          </>

        ) : (
          <>
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                  <tr className="text-left">
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Assigned to</th>
                    <th className="px-6 py-4 font-medium">Last Updated</th>
                    {org?.role === "admin" && (
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
                      onClick={() => handleProjectClick(project)}
                      onDelete={() => handleDelete(project.id)}
                      onReassign={() => setReassignTarget(project)}
                    />
                  ))}

                  {loadingMore && Array.from({ length: 3 }).map((_, i) => (
                    <tr key={`skel-${i}`} className="border-b border-zinc-800/40">
                      {Array.from({ length: org?.role === "admin" ? 6 : 5 }).map((_, j) => (
                        <td key={j} className="px-6 py-4 bg-zinc-900">
                          <div className="h-3 rounded bg-zinc-800 animate-pulse w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasMore && !loadingMore && (
              <div className="flex justify-center mt-5">
                <button
                  onClick={loadMore}
                  className="cursor-pointer flex items-center gap-2 px-6 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition"
                >
                  Load more projects
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={handleProjectCreated}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          project={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.id)}
        />
      )}

      {reassignTarget && (
        <ReassignManagerModal
          org={org}
          project={reassignTarget}
          onClose={() => setReassignTarget(null)}
          onReassigned={handleReassigned}
        />
      )}
    </div>
  );
};

export default Projects;