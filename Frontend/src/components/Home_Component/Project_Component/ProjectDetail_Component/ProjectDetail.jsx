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
import AddTaskModal from "./AddTaskModal";
import toast from "react-hot-toast";
import socket from "../../../../socket/socket.js";

const ProjectDetail = ({
  auditLogs = MOCK_AUDIT,
  onBack,
  onAddMember,
  onRemoveMember
}) => {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [count, setCount] = useState(0);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("tasks");
  const [taskFilters, setTaskFilters] = useState({});
  const [org, setOrg] = useState(null);
  const { id } = useParams();
  const [project, setProject] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/orgs/proj/one/${id}`);
        setProject(res.data.data);
        const taskres = await api.get(`proj/task/${id}`);
        setTasks(taskres.data.result);
        setCount(taskres.data.result.length);
        setOrg(res.data.data.org);
        const teamMembers = await api.post(`proj/team/${id}`);
        setTeamMembers(teamMembers.data.result);
        socket.emit("join_proj", id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProject();
  }, [id]);

  useEffect(() => {
    const AddTask = async ({ taskId }) => {
      try {
        const res = await api.get(`proj/task/${taskId}/one`);
        console.log(res);
        setTasks((prev) => {
          if (!Array.isArray(prev)) return [res.data.result];
          return [...prev, res.data.result];
        });
      } catch (error) {
        toast.error(error.message);
      }
    }
    socket.on("add_task", AddTask);
    return () => {
      socket.off("add_task", AddTask);
    }
  }, []);

  const handleDeleteTask = async (taskId) => {
    try {
      await api.post(`/proj/task/delete`, { id: taskId });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setCount(count - 1);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAddMember = (taskId, member) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, assignees: [...(t.assignees ?? []), member] }
          : t
      )
    );
    onAddMember?.(taskId, member);
  };

  const handleRemoveMember = (taskId, memberId) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, assignees: (t.assignees ?? []).filter((a) => a.id !== memberId) }
          : t
      )
    );
    onRemoveMember?.(taskId, memberId);
  };

  const handleOverdueClick = () => {
    setActiveSection("tasks");
    setTaskFilters({ due: "overdue" });
  };

  const handleAddTask = async (task) => {
    try {
      const res = await api.post(`proj/task/add`, { task, id, orgId });
      toast.success("Added Task successfully");
      setTasks((prev) => [...prev, res.data.task]);
    } catch (error) {
      toast.error(error.message);
    }
  }

  const TABS = [
    { key: "tasks", label: "Tasks", icon: <CheckSquare size={14} /> },
    { key: "team", label: "Team", icon: <Users size={14} /> },
    { key: "audit", label: "Audit", icon: <History size={14} /> },
  ];
  // console.log(project);
  return (
    <div>

      {project && (
        <div className="min-h-screen bg-black text-white px-18 py-12">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition text-sm mb-8 cursor-pointer"
          >
            <ArrowLeft size={15} />Back to Projects
          </button>

          {/* Project info */}
          <ProjectInfoCard project={project} taskCount={count} />

          {/* Stats */}
          <StatCards tasks={tasks} onOverdueClick={handleOverdueClick} />

          {/* Tabs */}
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

          {/* ── Content + right sidebar ───────────────────────────────────── */}
          <div className="flex gap-6 mt-6 items-start">

            {activeSection === "tasks" && (

              <TaskSection
                tasks={tasks}
                teamMembers={teamMembers}
                org={org}
                proj_id={id}
                onAddTask={() => setAddTaskOpen(true)}
                onDeleteTask={handleDeleteTask}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                initialFilters={taskFilters}
                onFiltersChange={setTaskFilters}
              />
            )}

            {org && (
              <AddTaskModal
                open={addTaskOpen}
                onClose={() => setAddTaskOpen(false)}
                org_id={org.org_id}
                onSubmit={handleAddTask}
                id={id}
              />
            )}

            {activeSection === "team" && (
              <TeamSection teamMembers={teamMembers} tasks={tasks} />
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

            {/* Right sidebar: Overdue + Audit (not on audit tab) */}
            {activeSection !== "audit" && (
              <div className="w-72 shrink-0 space-y-4">
                <DueTasksCard tasks={tasks} />
                <AuditLogCard logs={auditLogs} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;

// ─── Mock data (remove when wired to API) ────────────────────────────────────

// const MOCK_PROJECT = {
//   id: 1, name: "Bugatti",
//   Description: "High-performance build tracking.",
//   status: "active", priority: "high",
//   email: "darshandesale098@gmail.com", endDate: "2025-08-30",
// };

const MOCK_TEAM = [
  { id: 1, name: "Darshan Desale", email: "darshandesale098@gmail.com", role: "manager" },
  { id: 2, name: "Riya Shah", email: "riya.shah@example.com", role: "member" },
  { id: 3, name: "Arjun Mehta", email: "arjun.m@example.com", role: "member" },
];

// const MOCK_TASKS = [
//   { id: 1, title: "Design homepage", description: "Figma → React", status: "done", priority: "high", dueDate: "2025-07-01", assignees: [{ id: 1, name: "Darshan", email: "d@e.com" }, { id: 2, name: "Riya", email: "r@e.com" }] },
//   { id: 2, title: "Set up CI/CD", description: "GitHub Actions", status: "inprogress", priority: "medium", dueDate: "2025-07-10", assignees: [{ id: 3, name: "Arjun", email: "a@e.com" }] },
//   { id: 3, title: "Write API docs", description: "Swagger + Postman", status: "todo", priority: "low", dueDate: "2025-07-20", assignees: [{ id: 2, name: "Riya", email: "r@e.com" }] },
//   { id: 4, title: "Auth flow testing", description: "JWT edge cases", status: "blocked", priority: "high", dueDate: "2024-06-01", assignees: [{ id: 1, name: "Darshan", email: "d@e.com" }, { id: 3, name: "Arjun", email: "a@e.com" }] },
//   { id: 5, title: "Fix payment gateway", description: "Razorpay webhook", status: "inprogress", priority: "high", dueDate: "2024-05-20", assignees: [{ id: 1, name: "Darshan", email: "d@e.com" }] },
//   { id: 6, title: "Mobile responsiveness", description: "Tailwind breakpoints", status: "todo", priority: "medium", dueDate: "2025-08-01", assignees: [{ id: 2, name: "Riya", email: "r@e.com" }, { id: 3, name: "Arjun", email: "a@e.com" }] },
// ];

const MOCK_AUDIT = [
  { id: 1, actor: "Darshan", action: "created", message: "created the project Bugatti", timestamp: "2 hours ago" },
  { id: 2, actor: "Riya", action: "assigned", message: "was assigned to task 'Design homepage'", timestamp: "1 hour 45m ago" },
  { id: 3, actor: "Arjun", action: "status", message: "moved 'CI/CD setup' to In Progress", timestamp: "1 hour ago" },
  { id: 4, actor: "Darshan", action: "completed", message: "marked 'Design homepage' as done", timestamp: "30 mins ago" },
  { id: 5, actor: "Riya", action: "updated", message: "updated priority on 'API docs' to Low", timestamp: "15 mins ago" },
  { id: 6, actor: "Darshan", action: "deleted", message: "removed member from task 'Auth testing'", timestamp: "5 mins ago" },
];