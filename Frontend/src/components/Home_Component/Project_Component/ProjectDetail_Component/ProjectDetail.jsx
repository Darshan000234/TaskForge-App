import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { ArrowLeft, CheckSquare, Users, History } from "lucide-react";
import api from "../../../../api/api";
import ProjectInfoCard from "./ProjectInfoCard";
import StatCards from "./StatCards";
import TaskSection from "./TaskSection";
import TeamSection from "./TeamSection";
import AuditLogList from "../../AuditLogList.jsx";
import toast from "react-hot-toast";
import socket from "../../../../socket/socket.js";

const TABS = [
  { key: "tasks", label: "Tasks", icon: <CheckSquare size={14} /> },
  { key: "team", label: "Team", icon: <Users size={14} /> },
  { key: "audit", label: "Audit", icon: <History size={14} /> },
];

const ProjectDetail = () => {
  const { id } = useParams();
  const [User, setUser] = useState({});
  const [project, setProject] = useState(null);
  const { org } = useOutletContext();
  const [activeSection, setActiveSection] = useState("tasks");
  const [tasks, setTasks] = useState([]);
  const [filterOverride, setFilterOverride] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/orgs/proj/one/${id}`);
        setProject(res.data.data);
        socket.emit("join_proj", { id: Number(id) });
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

    const handleProjectUpdate = (proj) => {
      setProject(proj);
    }

    const handleMemberDeleted = ({ data }) => {
      const email = data.email;

      setTask((prev) => ({
        ...prev,
        email: project.email === email ? "" : project.email
      }));
    }
    
    socket.on("project_deleted", handleProjectDelete);
    socket.on("project_created", handleProjectUpdate);
    socket.on("member left", handleMemberDeleted);
    return () => {
      socket.off("project_deleted", handleProjectDelete);
      socket.off("project_created", handleProjectUpdate);
      socket.off("member left", handleMemberDeleted);
    }
  }, []);

  const handleOverdueClick = () => {
    setActiveSection("tasks");
    setFilterOverride({ due: "overdue", _t: Date.now() });
  };

  const handleUpdate = async (proj) => {
    // console.count("handleUpdate");
    if (!org) return;
    try {
      const id = crypto.randomUUID();

      const res = await api.put("orgs/proj/update", { proj: proj, org_id: org?.id }, {
        headers: {
          "x-request-id": id,
        },
      });
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
    <div className="min-h-screen bg-black text-white px-4 sm:px-8 md:px-18 py-6 sm:py-10 md:py-12">
      <button
        onClick={handleOnback}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition text-sm mb-8 cursor-pointer"
      >
        <ArrowLeft size={15} />Back to Projects
      </button>

      <ProjectInfoCard
        role={User?.member?.role}
        project={project}
        taskCount={tasks.length}
        org={org}
        onUpdate={handleUpdate}
      />

      <StatCards tasks={tasks} onOverdueClick={handleOverdueClick} />

      <div className="flex items-center gap-1 border border-zinc-800 rounded-lg p-1 bg-zinc-900 w-fit mt-8 overflow-x-auto max-w-full">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`cursor-pointer flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm transition whitespace-nowrap ${activeSection === key
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
            role={User?.member?.role}
          />
        )}

        {activeSection === "team" && (
          <TeamSection
            org={org}
            proj_id={id}
            onTaskAssigneeRemoved={handleTaskAssigneeRemoved}
            role={User?.member?.role}
          />
        )}

        {activeSection === "audit" && (
          <div className="flex-1 min-w-0">
            <div className="border border-zinc-800 rounded-2xl overflow-hidden">
              <AuditLogList proj_id={id} api={api} compact={true} limit={8} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProjectDetail;