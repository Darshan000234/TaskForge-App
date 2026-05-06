import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, CheckSquare, Users, History } from "lucide-react";
import api from "../../../../api/api";
import ProjectInfoCard from "./ProjectInfoCard";
import StatCards from "./StatCards";
import TaskSection from "./TaskSection";
import TeamSection from "./TeamSection";
import DueTasksCard from "./DueTasksCard";
import AuditLogCard from "./AuditLogCard";
import toast from "react-hot-toast";
import socket from "../../../../socket/socket.js";

const TABS = [
  { key: "tasks", label: "Tasks",  icon: <CheckSquare size={14} /> },
  { key: "team",  label: "Team",   icon: <Users       size={14} /> },
  { key: "audit", label: "Audit",  icon: <History     size={14} /> },
];

const ProjectDetail = ({ auditLogs = MOCK_AUDIT, onBack }) => {
  const { id } = useParams();

  const [project,       setProject]       = useState(null);
  const [teamMembers,   setTeamMembers]   = useState([]);
  const [org,           setOrg]           = useState(null);
  const [activeSection, setActiveSection] = useState("tasks");

  // Mirror of TaskSection's tasks — read-only, kept in sync via onTasksChange.
  // Only used for StatCards and DueTasksCard; no handlers run against this.
  const [tasks, setTasks] = useState([]);

  // filterOverride is injected into TaskSection when parent wants to force a filter
  // (e.g. clicking "Overdue" on StatCards). _t timestamp ensures re-clicking the
  // same filter still triggers useEffect inside TaskSection.
  const [filterOverride, setFilterOverride] = useState(null);

  // ── Fetch project + team ────────────────────────────────────────────────
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const [projRes, teamRes] = await Promise.all([
          api.get(`/orgs/proj/one/${id}`),
          api.post(`proj/team/${id}`),
        ]);
        setProject(projRes.data.data);
        setOrg(projRes.data.data.org);
        setTeamMembers(teamRes.data.result);
        socket.emit("join_proj", id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProject();
  }, [id]);

  useEffect(() => {
    const handleDeleteMemberSocket = ({ data }) => {
      setTeamMembers((prev) => prev.filter((p) => p.memberId !== data.id));
    };
    socket.on("delete Member", handleDeleteMemberSocket);
    return () => socket.off("delete Member", handleDeleteMemberSocket);
  }, []);

  const handleDeleteMember = async (memberId) => {
    try {
      await api.post(`proj/team/${id}/delete`, { user_id: memberId });
      setTeamMembers((prev) => prev.filter((a) => a.memberId !== memberId));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  // Switches to Tasks tab and forces the overdue filter.
  const handleOverdueClick = () => {
    setActiveSection("tasks");
    setFilterOverride({ due: "overdue", _t: Date.now() });
  };

  if (!project) return null;

  return (
    <div className="min-h-screen bg-black text-white px-18 py-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition text-sm mb-8 cursor-pointer"
      >
        <ArrowLeft size={15} />Back to Projects
      </button>

      <ProjectInfoCard project={project} taskCount={tasks.length} />

      <StatCards tasks={tasks} onOverdueClick={handleOverdueClick} />

      {/* Tabs */}
      <div className="flex items-center gap-1 border border-zinc-800 rounded-lg p-1 bg-zinc-900 w-fit mt-8">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-md text-sm transition ${
              activeSection === key
                ? "bg-zinc-700 text-white font-medium"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      <div className="flex gap-6 mt-6 items-start">

        {activeSection === "tasks" && (
          <TaskSection
            teamMembers={teamMembers}
            org={org}
            proj_id={id}
            filterOverride={filterOverride}
            onTasksChange={setTasks}
          />
        )}

        {activeSection === "team" && (
          <TeamSection
            teamMembers={teamMembers}
            tasks={tasks}
            org={org}
            proj_id={id}
            setTeamMembers={setTeamMembers}
            setTasks={setTasks}
          />
        )}

        {activeSection === "audit" && (
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500 mb-4 uppercase tracking-wider font-medium flex items-center gap-2">
              <History size={12} />Activity Log — {auditLogs.length} entries
            </p>
            <div className="border border-zinc-800 rounded-2xl overflow-hidden">
              <AuditLogCard logs={auditLogs} />
            </div>
          </div>
        )}

        {activeSection !== "audit" && (
          <div className="w-72 shrink-0 space-y-4">
            <DueTasksCard tasks={tasks} />
            <AuditLogCard logs={auditLogs} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_AUDIT = [
  { id: 1, actor: "Darshan", action: "created",   message: "created the project Bugatti",              timestamp: "2 hours ago"      },
  { id: 2, actor: "Riya",    action: "assigned",   message: "was assigned to task 'Design homepage'",   timestamp: "1 hour 45m ago"   },
  { id: 3, actor: "Arjun",   action: "status",     message: "moved 'CI/CD setup' to In Progress",       timestamp: "1 hour ago"       },
  { id: 4, actor: "Darshan", action: "completed",  message: "marked 'Design homepage' as done",         timestamp: "30 mins ago"      },
  { id: 5, actor: "Riya",    action: "updated",    message: "updated priority on 'API docs' to Low",    timestamp: "15 mins ago"      },
  { id: 6, actor: "Darshan", action: "deleted",    message: "removed member from task 'Auth testing'",  timestamp: "5 mins ago"       },
];