import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { ArrowLeft, CheckSquare, Users, History } from "lucide-react";
import api from "../../../../api/api";
import ProjectInfoCard from "./ProjectInfoCard";
import StatCards from "./StatCards";
import TaskSection from "./TaskSection";
import TeamSection from "./TeamSection";
import DueTasksCard from "./DueTasksCard";
// import AuditLogCard from "./AuditLogCard";
import AuditLogList from "../../AuditLogList.jsx";
import toast from "react-hot-toast";
import socket from "../../../../socket/socket.js";

const TABS = [
  { key: "tasks", label: "Tasks", icon: <CheckSquare size={14} /> },
  { key: "team", label: "Team", icon: <Users size={14} /> },
  { key: "audit", label: "Audit", icon: <History size={14} /> },
];

const ProjectDetail = ({ auditLogs = MOCK_AUDIT }) => {
  const { id } = useParams();
  const [User, setUser] = useState({});
  const [project, setProject] = useState(null);
  const { org } = useOutletContext();
  const [activeSection, setActiveSection] = useState("tasks");
  const [tasks, setTasks] = useState([]);
  const [filterOverride, setFilterOverride] = useState(null);
  const navigate = useNavigate();
  // console.log(org);
  
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/orgs/proj/one/${id}`);
        setProject(res.data.data);
        socket.emit("join_proj", id);
      } catch (err) {
        toast.error(err.message)
      }
    };
    const userData = async () => {
      try {
        const res = await api.get(`/orgs/proj/user/${id}`);
        setUser(res.data);
      } catch (error) {
        toast.error(error.message)
      }
    }
    fetchProject();
    userData();
  }, [id]);


  useEffect(() => {
    const handleProjectDelete = () => {
      navigate('/user/dashboard/projects', { replace: true });
    }
    socket.on("project_deleted", handleProjectDelete);
    return () => {
      socket.off("project_deleted", handleProjectDelete);
    }
  }, []);

  const handleOverdueClick = () => {
    setActiveSection("tasks");
    setFilterOverride({ due: "overdue", _t: Date.now() });
  };

  const handleUpdate = async (proj) => {
    if(!org) return;
    try {
      // console.log(org.id);
      
      const res = await api.post("orgs/proj/update", { proj: proj, org_id: org?.id });
      setProject(res.data.data);
      toast.success("successfully Updated");
    } catch (error) {
      toast.error(error.message);
    }
  }

  const handleTaskAssigneeRemoved = useCallback((taskId, memberId) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          assignees:
            task.assignees !== null
              ? task.assignees.filter((a) => a.id !== memberId)
              : null,
          assigneeCount: Math.max((task.assigneeCount || 1) - 1, 0),
        };
      })
    );
  }, []);

  const handleOnback = () => {
    navigate('/user/dashboard/projects')
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-black text-white px-18 py-12">
      <button
        onClick={handleOnback}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition text-sm mb-8 cursor-pointer"
      >
        <ArrowLeft size={15} />Back to Projects
      </button>

      <ProjectInfoCard
        role={User?.role}
        project={project}
        taskCount={tasks.length}
        org={org}
        onUpdate={handleUpdate}
      />

      <StatCards tasks={tasks} onOverdueClick={handleOverdueClick} />

      <div className="flex items-center gap-1 border border-zinc-800 rounded-lg p-1 bg-zinc-900 w-fit mt-8">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-md text-sm transition ${activeSection === key
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
            org={org}
            proj_id={id}
            filterOverride={filterOverride}
            onTasksChange={setTasks}
            role={User?.role}
          />
        )}

        {activeSection === "team" && (
          <TeamSection
            org={org}
            proj_id={id}
            onTaskAssigneeRemoved={handleTaskAssigneeRemoved}
          />
        )}

        {activeSection === "audit" && (
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500 mb-4 uppercase tracking-wider font-medium flex items-center gap-2">
              <History size={12} />Activity Log — {auditLogs.length} entries
            </p>
            <div className="border border-zinc-800 rounded-2xl">
              <AuditLogList proj_id={id} api={api} compact={true} limit={8} />
            </div>
          </div>
        )}

        {activeSection !== "audit" && (
          <div className="w-72 shrink-0 space-y-4">
            <DueTasksCard tasks={tasks} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;

const MOCK_AUDIT = [
  { id: 1, actor: "Darshan", action: "created", message: "created the project Bugatti", timestamp: "2 hours ago" },
  { id: 2, actor: "Riya", action: "assigned", message: "was assigned to task 'Design homepage'", timestamp: "1 hour 45m ago" },
  { id: 3, actor: "Arjun", action: "status", message: "moved 'CI/CD setup' to In Progress", timestamp: "1 hour ago" },
  { id: 4, actor: "Darshan", action: "completed", message: "marked 'Design homepage' as done", timestamp: "30 mins ago" },
  { id: 5, actor: "Riya", action: "updated", message: "updated priority on 'API docs' to Low", timestamp: "15 mins ago" },
  { id: 6, actor: "Darshan", action: "deleted", message: "removed member from task 'Auth testing'", timestamp: "5 mins ago" },
];