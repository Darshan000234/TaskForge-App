import folder from '../../assets/img/folder.png';
import blue_folder from '../../assets/img/blue_folder.png';
import checked from '../../assets/img/checked.png';
import purple_team from '../../assets/img/purple_team.png';
import orange_warn from '../../assets/img/orange_warn.png';
import user from '../../assets/img/user.png';
import warning from '../../assets/img/warning.png';
import clock from '../../assets/img/clock.png';
import { useNavigate, useOutletContext } from 'react-router-dom';
import AuditLogList from '../Home_Component/AuditLogList.jsx';
import api from '../../api/api';
import { useEffect, useState } from 'react';


const STATUS_COLOR = {
  active: "text-emerald-400",
  completed: "text-blue-400",
  on_hold: "text-amber-400",
  cancelled: "text-red-400",
};

const PRIORITY_DOT = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-zinc-500",
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const ProjectCard = ({ proj }) => (
  <div className="flex items-start justify-between gap-4 py-3.5 border-b border-zinc-800/70 last:border-b-0">
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[proj.priority] ?? "bg-zinc-500"}`} />
        <p className="text-sm font-medium text-white truncate">{proj.name}</p>
      </div>
      <p className={`text-xs mt-0.5 capitalize font-medium ${STATUS_COLOR[proj.status?.toLowerCase()] ?? "text-zinc-400"}`}>
        {proj.status}
      </p>
    </div>

    <div className="flex flex-col items-end gap-1 shrink-0 text-right">
      <span className="text-[11px] text-zinc-500 capitalize">{proj.role}</span>
      <span className="text-[11px] text-zinc-600">{fmt(proj.endDate)}</span>
    </div>
  </div>
);

const TaskMiniCard = ({ task }) => (
  <div className="flex items-center justify-between gap-3 py-2.5 border-b border-zinc-800/60 last:border-b-0">
    <p className="text-sm text-zinc-300 truncate">{task.name}</p>
    <span className="text-[11px] text-zinc-500 shrink-0">{fmt(task.dueDate)}</span>
  </div>
);

const EmptyState = ({ src, label }) => (
  <div className="flex flex-col items-center justify-center py-10 text-zinc-500 gap-3">
    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
      <img className="w-6 h-6 opacity-60" src={src} alt="" />
    </div>
    <p className="text-xs">{label}</p>
  </div>
);

const Dashboard = () => {
  const { org } = useOutletContext();
  const [CardData, setCardData] = useState({});
  const [Project, setProject] = useState([]);
  const [FewTaskData, setFewTaskData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!org?.id) return;

    const getCardData = async () => {
      const res = await api.get(`/orgs/stats/${org.id}`);
      setCardData(res.data);
    };

    const getFewTaskData = async () => {
      const res = await api.get(`/proj/task/stats/${org.id}`);
      setFewTaskData(res.data.tasks ?? {});
      setProject(res.data.projData ?? []);
    };

    getCardData();
    getFewTaskData();
  }, [org]);

  const viewAllOrg = () => {
    navigate('/user/dashboard/projects');
  }

  const stats = [
    { title: "Total Projects", icon: blue_folder, cs: "bg-blue-500/10", w: "w-8", key: "total_proj" },
    { title: "Completed Projects", icon: checked, cs: "bg-emerald-500/10", w: "w-7", key: "completed_projects" },
    { title: "My Tasks", icon: purple_team, cs: "bg-purple-500/10", w: "w-7", key: "my_task" },
    { title: "Overdue", icon: orange_warn, cs: "bg-amber-500/10", w: "w-7", key: "overdue_task" },
  ];

  const sideCards = [
    { title: "My Tasks", key: "my", badge: "bg-emerald-500/15 text-emerald-400", icon: user, empty: "No tasks assigned to you" },
    { title: "Overdue", key: "overdue", badge: "bg-red-500/15 text-red-400", icon: warning, empty: "No overdue tasks" },
    { title: "In Progress", key: "inProgress", badge: "bg-blue-500/15 text-blue-400", icon: clock, empty: "Nothing in progress" }
  ];

  const userName = org?.user?.name ?? "there";

  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 pt-6 sm:pt-10 pb-16 space-y-8 sm:space-y-10">

      <div>
        <h2 className="text-lg sm:text-[20px] font-semibold text-white leading-7">
          Welcome back, {userName}
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Here's what's happening with your projects today
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
        {stats.map((item) => (
          <div
            key={item.key}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between hover:border-zinc-700 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-xs text-zinc-500 mb-1 truncate">{item.title}</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{CardData[item.key] ?? 0}</p>
            </div>
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${item.cs} flex items-center justify-center shrink-0`}>
              <img className={item.w} src={item.icon} alt="" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-zinc-800">
              <h3 className="text-sm font-medium text-white">Project Overview</h3>
              <button onClick={viewAllOrg} className="text-xs text-zinc-500 hover:text-white transition cursor-pointer">
                View all →
              </button>
            </div>

            <div className="px-4 sm:px-5 max-h-72 overflow-y-auto">
              {Project.length > 0 ? (
                Project.map((proj, i) => <ProjectCard key={i} proj={proj} />)
              ) : (
                <EmptyState src={folder} label="No projects yet" />
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
            {org?.id ? (
              <AuditLogList orgId={org.id} api={api} compact={true} limit={8} />
            ) : (
              <>
                <div className="px-4 sm:px-5 py-3.5 border-b border-zinc-800">
                  <h3 className="text-sm font-medium text-white">Recent Activity</h3>
                </div>
                <EmptyState src={clock} label="No recent activity" />
              </>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {sideCards.map((item) => {
            const list = FewTaskData?.[item.key] ?? [];
            return (
              <div
                key={item.key}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                      <img className="w-4 h-4" src={item.icon} alt="" />
                    </div>
                    <h4 className="text-sm font-medium text-white truncate">{item.title}</h4>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 ${item.badge}`}>
                    {list.length}
                  </span>
                </div>

                <div className="px-4 sm:px-5">
                  {list.length > 0 ? (
                    list.slice(0, 4).map((task) => (
                      <TaskMiniCard key={task.id} task={task} />
                    ))
                  ) : (
                    <p className="text-xs text-zinc-600 py-5 text-center">{item.empty}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;