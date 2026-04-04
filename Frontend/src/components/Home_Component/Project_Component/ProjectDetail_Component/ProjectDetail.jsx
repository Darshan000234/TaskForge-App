import { useState } from "react";
import { ArrowLeft, CheckSquare, Users, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProjectInfoCard from "./ProjectInfoCard";
import StatCards       from "./StatCards";
import TaskSection     from "./TaskSection";
import TeamSection     from "./TeamSection";
import DueTasksCard    from "./DueTasksCard";
import AuditLogCard    from "./AuditLogCard";

/**
 * ProjectDetail — root layout
 *
 * Props:
 *  project      { id, name, Description, status, priority, email, endDate }
 *  teamMembers  [{ id, name, email, role }]
 *  tasks        [{ id, title, description, status, priority, assignees:[{id,name,email}], dueDate }]
 *  auditLogs    [{ id, actor, action, message, timestamp }]
 *  onBack       () => void
 *  onAddTask    () => void
 *  org          { role }
 */
const ProjectDetail = ({
  project     = MOCK_PROJECT,
  teamMembers = MOCK_TEAM,
  tasks       = MOCK_TASKS,
  auditLogs   = MOCK_AUDIT,
  onAddTask,
  org         = { role: "admin" },
}) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("tasks");
  // Lifted so StatCards can pre-set filter
  const [taskFilters, setTaskFilters] = useState({});

  const handleOverdueClick = () => {
    setActiveSection("tasks");
    setTaskFilters({ due: "overdue" });
  };

  const onBack = () => {
    navigate('/user/dashboard/projects');
  }
  const TABS = [
    { key: "tasks", label: "Tasks",  icon: <CheckSquare size={14} /> },
    { key: "team",  label: "Team",   icon: <Users size={14} /> },
    { key: "audit", label: "Audit",  icon: <History size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-black text-white px-18 py-12">

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition text-sm mb-8 cursor-pointer"
      >
        <ArrowLeft size={15} />
        Back to Projects
      </button>

      {/* Project info card */}
      <ProjectInfoCard project={project} taskCount={tasks.length} />

      {/* Stat cards */}
      <StatCards tasks={tasks} onOverdueClick={handleOverdueClick} />

      {/* Section tabs */}
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

      {/* ── Main content + right sidebar ────────────────────────────── */}
      <div className="flex gap-6 mt-6 items-start">

        {/* Left: section content */}
        {activeSection === "tasks" && (
          <TaskSection
            tasks={tasks}
            teamMembers={teamMembers}
            org={org}
            onAddTask={onAddTask}
            initialFilters={taskFilters}
            onFiltersChange={setTaskFilters}
          />
        )}

        {activeSection === "team" && (
          <TeamSection teamMembers={teamMembers} tasks={tasks} />
        )}

        {/* Audit tab: full width, no sidebar */}
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

        {/* Right sidebar: only on tasks + team tabs */}
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

// ─── Mock data (remove when wired to API) ─────────────────────────────────────

const MOCK_PROJECT = {
  id: 1, name: "Bugatti",
  Description: "High-performance build tracking.",
  status: "active", priority: "high",
  email: "darshandesale098@gmail.com", endDate: "2025-08-30",
};

const MOCK_TEAM = [
  { id: 1, name: "Darshan Desale", email: "darshandesale098@gmail.com", role: "manager" },
  { id: 2, name: "Riya Shah",      email: "riya.shah@example.com",      role: "member"  },
  { id: 3, name: "Arjun Mehta",    email: "arjun.m@example.com",        role: "member"  },
];

const MOCK_TASKS = [
  { id: 1, title: "Design homepage",       description: "Figma → React",       status: "done",       priority: "high",   dueDate: "2025-07-01", assignees: [{ id: 1, name: "Darshan", email: "d@e.com" }, { id: 2, name: "Riya", email: "r@e.com" }] },
  { id: 2, title: "Set up CI/CD",          description: "GitHub Actions",       status: "inprogress", priority: "medium", dueDate: "2025-07-10", assignees: [{ id: 3, name: "Arjun",   email: "a@e.com" }] },
  { id: 3, title: "Write API docs",        description: "Swagger + Postman",    status: "todo",       priority: "low",    dueDate: "2025-07-20", assignees: [{ id: 2, name: "Riya",    email: "r@e.com" }] },
  { id: 4, title: "Auth flow testing",     description: "JWT edge cases",       status: "blocked",    priority: "high",   dueDate: "2024-06-01", assignees: [{ id: 1, name: "Darshan", email: "d@e.com" }, { id: 3, name: "Arjun", email: "a@e.com" }] },
  { id: 5, title: "Fix payment gateway",   description: "Razorpay webhook",     status: "inprogress", priority: "high",   dueDate: "2024-05-20", assignees: [{ id: 1, name: "Darshan", email: "d@e.com" }] },
  { id: 6, title: "Mobile responsiveness", description: "Tailwind breakpoints", status: "todo",       priority: "medium", dueDate: "2025-08-01", assignees: [{ id: 2, name: "Riya",    email: "r@e.com" }, { id: 3, name: "Arjun", email: "a@e.com" }] },
];

const MOCK_AUDIT = [
  { id: 1, actor: "Darshan", action: "created",   message: "created the project Bugatti",             timestamp: "2 hours ago"    },
  { id: 2, actor: "Riya",    action: "assigned",  message: "was assigned to task 'Design homepage'",  timestamp: "1 hour 45m ago" },
  { id: 3, actor: "Arjun",   action: "status",    message: "moved 'CI/CD setup' to In Progress",      timestamp: "1 hour ago"     },
  { id: 4, actor: "Darshan", action: "completed", message: "marked 'Design homepage' as done",        timestamp: "30 mins ago"    },
  { id: 5, actor: "Riya",    action: "updated",   message: "updated priority on 'API docs' to Low",   timestamp: "15 mins ago"    },
  { id: 6, actor: "Darshan", action: "deleted",   message: "removed member from task 'Auth testing'", timestamp: "5 mins ago"     },
];