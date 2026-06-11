import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, LayoutGrid, List, SlidersHorizontal,
  Circle, Clock, CheckCircle2, AlertCircle,
  AlertTriangle, Calendar, ChevronLeft, ChevronRight,
  Trash2, UserPlus, Loader2
} from "lucide-react";
import AssigneeCell from "./AssigneeCell.jsx";
import FilterPanel from "./FilterPanel.jsx";
import AddMemberModal from "./AddMemberModal.jsx";
import AddTaskModal from "./AddTaskModal.jsx";
import {
  TASK_STATUS_STYLE, PRIORITY_COLOR, PRIORITY_DOT,
  isOverdue, TASK_STATUS_LABEL,
} from "./constants";
import api from "../../../../api/api.js";
import socket from "../../../../socket/socket.js";
import toast from "react-hot-toast";
import { div } from "framer-motion/client";

const LIMIT = 10;
const STATUS_ICON = {
  todo: <Circle size={14} className="text-zinc-500" />,
  inprogress: <Clock size={14} className="text-yellow-400" />,
  done: <CheckCircle2 size={14} className="text-emerald-400" />,
  blocked: <AlertCircle size={14} className="text-red-400" />,
};

const AddMemberButton = ({ onClick }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    title="Add member"
    className="cursor-pointer flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition"
  >
    <UserPlus size={13} />
    <span>Add</span>
  </button>
);

const TaskGridCard = ({ task, org, onDeleteTask, onRemoveMember, onOpenAddMember, onClick, isAdmin }) => (
  <div onClick={() => onClick?.()} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition group relative">
    {isAdmin && (
      <button
        onClick={(e) => { e.stopPropagation(); onDeleteTask?.(task.id); }}
        title="Delete task"
        className="cursor-pointer absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-zinc-800 hover:bg-red-500/15 text-zinc-400 hover:text-red-400 transition"
      >
        <Trash2 size={14} />
      </button>
    )}

    <div className="flex items-start gap-2 pr-8">
      {STATUS_ICON[task.Status]}
      <p className={`text-sm font-medium ${task.Status === "done" ? "line-through text-zinc-500" : "text-white"}`}>
        {task.name}
      </p>
      <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-md shrink-0 font-medium ${TASK_STATUS_STYLE[task.Status]}`}>
        {TASK_STATUS_LABEL[task.Status] ?? task.Status}
      </span>
    </div>

    {task.Description && (
      <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 ml-5">{task.Description}</p>
    )}

    <div className="mt-3 flex items-center justify-between gap-2">
      <AssigneeCell
        assignees={task.assignees ?? []}
        canEdit={isAdmin}
        onRemoveMember={(memberId) => onRemoveMember?.(task.id, memberId)}
      />
      <div className="flex items-center gap-2 text-xs">
        <span className={`capitalize font-medium ${PRIORITY_COLOR[task.priority]}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className={`flex items-center gap-1 ${isOverdue(task) ? "text-red-400" : "text-zinc-500"}`}>
            <Calendar size={11} />
            {new Date(task.dueDate).toLocaleDateString("en-IN", {
              day: "2-digit", month: "short", year: "numeric",
            })}
          </span>
        )}
      </div>
    </div>

    {isAdmin && (
      <div className="mt-3 pt-3 border-t border-zinc-800">
        <AddMemberButton onClick={() => onOpenAddMember(task)} />
      </div>
    )}
  </div>
);

const TaskTableRow = ({ task, org, isLast, onDeleteTask, onRemoveMember, onOpenAddMember, onClick, isAdmin }) => (
  <tr onClick={() => onClick?.()} className="group border-b border-zinc-800/60 last:border-b-0">
    <td className={`px-5 py-3.5 bg-zinc-900 group-hover:bg-zinc-900/50 ${isLast ? "rounded-bl-xl" : ""}`}>
      <div className="flex items-center gap-2.5">
        {STATUS_ICON[task.Status]}
        <span className={`font-medium ${task.Status === "done" ? "line-through text-zinc-500" : "text-white"}`}>
          {task.name}
        </span>
      </div>
      {task.Description && (
        <p className="text-xs text-zinc-600 mt-0.5 truncate max-w-xs ml-6">{task.Description}</p>
      )}
    </td>

    <td className="px-5 py-3.5 bg-zinc-900 group-hover:bg-zinc-900/50">
      <span className={`flex items-center gap-1.5 text-xs font-medium capitalize ${PRIORITY_COLOR[task.priority]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
        {task.priority}
      </span>
    </td>

    <td className="px-5 py-3.5 bg-zinc-900 group-hover:bg-zinc-900/50">
      <span className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize ${TASK_STATUS_STYLE[task.Status]}`}>
        {TASK_STATUS_LABEL[task.Status] ?? task.Status}
      </span>
    </td>

    <td className="px-5 py-3.5 bg-zinc-900 group-hover:bg-zinc-900/50 relative cursor-pointer">
      <AssigneeCell
        assignees={task.assignees ?? []}
        canEdit={isAdmin === "admin"}
        onRemoveMember={(memberId) => onRemoveMember?.(task.id, memberId)}
      />
    </td>

    <td className="px-5 py-3.5 bg-zinc-900 group-hover:bg-zinc-900/50">
      {isAdmin ? (
        <AddMemberButton onClick={() => onOpenAddMember(task)} />
      ) : (
        <span className="text-zinc-600 text-xs">—</span>
      )}
    </td>

    <td className="px-5 py-3.5 bg-zinc-900 group-hover:bg-zinc-900/50">
      <span className={`text-xs flex items-center gap-1 ${isOverdue(task) ? "text-red-400 font-medium" : "text-zinc-400"}`}>
        {isOverdue(task) && <AlertTriangle size={11} />}
        {task.dueDate
          ? new Date(task.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
          : "—"}
      </span>
    </td>

    {isAdmin && (
      <td className={`px-5 py-3.5 bg-zinc-900 group-hover:bg-zinc-900/50 ${isLast ? "rounded-br-xl" : ""}`}>
        <button
          onClick={(e) => { e.stopPropagation(); onDeleteTask?.(task.id); }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md cursor-pointer hover:bg-red-500/15 text-zinc-500 hover:text-red-400 transition"
        >
          <Trash2 size={15} />
        </button>
      </td>
    )}
  </tr>
);

const TaskSection = ({
  teamMembers = [],
  org,
  proj_id,
  filterOverride = null,
  onTasksChange,
  role
}) => {

  const [tasks, setTasks] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addMemberTarget, setAddMemberTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState("list");

  const filterRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { onTasksChange?.(tasks); }, [tasks]);

  useEffect(() => {
    if (!proj_id) return;
    setTasks([]);
    setNextCursor(null);
    setHasMore(false);
    fetchTasks(null);
  }, [proj_id]);


  const fetchTasks = async (cursorValue) => {
    if (loadingTasks) return;

    setLoadingTasks(true);

    try {
      const params = new URLSearchParams({ limit: LIMIT });

      if (cursorValue) params.set("cursor", cursorValue);

      // 🔥 ADD THIS
      if (filters.status) params.set("status", filters.status);
      if (filters.priority) params.set("priority", filters.priority);
      if (filters.assignee) params.set("assignee", filters.assignee);
      if (search) params.set("search", search);

      const res = await api.get(`proj/task/${proj_id}?${params}`);

      const { result, nextCursor: nc, hasMore: hm } = res.data;

      setTasks(prev =>
        cursorValue ? [...prev, ...result] : result
      );

      setNextCursor(nc);
      setHasMore(hm);

    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingTasks) fetchTasks(nextCursor);
  };


  useEffect(() => {
    if (!proj_id) return;

    setTasks([]);
    setNextCursor(null);
    setHasMore(false);

    fetchTasks(null);

  }, [proj_id, filters, search]);


  useEffect(() => {
    const onAddTask = async ({ taskId }) => {
      try {
        const res = await api.get(`proj/task/${taskId}/one`);
        setTasks((prev) => [res.data.result, ...(Array.isArray(prev) ? prev : [])]);
      } catch (err) {
        toast.error(err.message);
      }
    };

    const onDeleteTask = ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    };

    const onRemovedMember = ({ task_id, user_id }) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task_id
            ? { ...t, assignees: (t.assignees ?? []).filter((a) => a.id !== user_id) }
            : t
        )
      );
    };

    const onMemberAdded = ({ taskId: tid, member }) => {
      console.log(member);
      
      setTasks((prev) =>
        prev.map((t) =>
          t.id === tid
            ? { ...t, assignees: [...(t.assignees ?? []), member] }
            : t
        )
      );
    };

    const onDeleteMember = ({ memberId }) => {
      setTasks((prev) =>
        prev.map((t) => ({
          ...t,
          assignees: (t.assignees ?? []).filter((a) => a.id !== memberId),
        }))
      );
    };

    socket.on("add_task", onAddTask);
    socket.on("task_deleted", onDeleteTask);
    socket.on("removed member", onRemovedMember);
    socket.on("member added", onMemberAdded);
    socket.on("delete member", onDeleteMember);

    return () => {
      socket.off("add_task", onAddTask);
      socket.off("task_deleted", onDeleteTask);
      socket.off("removed member", onRemovedMember);
      socket.off("member added", onMemberAdded);
      socket.off("delete member", onDeleteMember);
    };
  }, []);

  const handleSelectTask = (task) => navigate(`/user/dashboard/task/${task.id}`);

  const handleAddTask = async (task) => {
    try {
      await api.post(`proj/task/add`, { task, proj_id: proj_id, orgId: org.org_id });
      toast.success("Task added");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.post(`/proj/task/delete`, { id: taskId, proj_id : proj_id });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddMember = async (taskId, members) => {
    try {
      const res = await api.post(`proj/task/${taskId}/addmember`, {
        users: members,
        org_id: org.org_id,
        proj_id : proj_id
      });
      const { taskId: tid, members: newMembers } = res.data.result;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === tid
            ? {
              ...t,
              assignees: [
                ...(t.assignees ?? []).filter((a) => !newMembers.some((m) => m.id === a.id)),
                ...newMembers,
              ],
            }
            : t
        )
      );
      toast.success(`${newMembers.length} member${newMembers.length !== 1 ? "s" : ""} added`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleRemoveMember = async (taskId, memberId) => {
    try {
      await api.post(`proj/task/${taskId}/removemember`, { user_id: memberId,proj_id : proj_id });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, assignees: (t.assignees ?? []).filter((a) => a.id !== memberId) }
            : t
        )
      );
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleFilters = (f) => setFilters(f);
  const handleSearch = (v) => setSearch(v);

  const activeCount = Object.values(filters).filter(Boolean).length;
  const isAdmin = (role && role==="admin" || role==="manager");


  return (
    <div className="flex-1 min-w-0">

      <div className="flex items-center gap-3 flex-wrap mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition"
          />
        </div>

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className={`cursor-pointer flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm transition ${activeCount > 0
                ? "border-blue-500/50 text-blue-400 bg-blue-500/10"
                : "border-zinc-800 text-zinc-400 bg-zinc-900 hover:border-zinc-600 hover:text-zinc-300"
              }`}
          >
            <SlidersHorizontal size={15} />
            {activeCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
          {filterOpen && (
            <FilterPanel
              filters={filters}
              onChange={handleFilters}
              members={teamMembers}
              onClose={() => setFilterOpen(false)}
            />
          )}
        </div>

        <div className="flex items-center gap-1 border border-zinc-800 rounded-lg p-1 bg-zinc-900">
          <button
            onClick={() => setView("list")}
            className={`cursor-pointer p-2 rounded-md transition ${view === "list" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <List size={15} />
          </button>
          <button
            onClick={() => setView("grid")}
            className={`cursor-pointer p-2 rounded-md transition ${view === "grid" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <LayoutGrid size={15} />
          </button>
        </div>

        {isAdmin && (
          <button
            onClick={() => setAddTaskOpen(true)}
            className="cursor-pointer ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            <Plus size={16} />Add Task
          </button>
        )}
      </div>

      <p className="text-xs text-zinc-500 mb-4 uppercase tracking-wider font-medium">
        {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        {hasMore ? "+" : ""}
        {activeCount > 0 ? " (filtered)" : ""}
      </p>

      {!loadingTasks && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-zinc-800 rounded-2xl bg-zinc-900/30">
          <Search size={28} className="text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-500">No tasks match your filters</p>
        </div>
      )}

      {tasks.length > 0 && view === "grid" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tasks.map((t) => (
              <TaskGridCard
                key={t.id}
                task={t}
                org={org}
                isAdmin={isAdmin}
                onDeleteTask={handleDeleteTask}
                onRemoveMember={handleRemoveMember}
                onOpenAddMember={setAddMemberTarget}
                onClick={() => handleSelectTask(t)}
              />
            ))}
          </div>

          {loadingTasks && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-36 rounded-xl bg-zinc-900 animate-pulse border border-zinc-800" />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-5">
              <button
                onClick={loadMore}
                disabled={loadingTasks}
                className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loadingTasks
                  ? <><Loader2 size={14} className="animate-spin" />Loading...</>
                  : "Load more tasks"}
              </button>
            </div>
          )}
        </>
      )}

      {tasks.length > 0 && view === "list" && (
        <>
          <div className="border border-zinc-800 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                <tr className="text-left">
                  <th className="px-5 py-3.5 font-medium rounded-tl-xl">Task</th>
                  <th className="px-5 py-3.5 font-medium">Priority</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Assignees</th>
                  <th className="px-5 py-3.5 font-medium">Add Member</th>
                  <th className="px-5 py-3.5 font-medium">Due Date</th>
                  {isAdmin && <th className={`px-5 py-3.5 font-medium w-12 rounded-tr-xl`} />}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => (
                  <TaskTableRow
                    key={t.id}
                    task={t}
                    org={org}
                    isAdmin={isAdmin}
                    isLast={i === tasks.length - 1 && !hasMore}
                    onDeleteTask={handleDeleteTask}
                    onRemoveMember={handleRemoveMember}
                    onOpenAddMember={setAddMemberTarget}
                    onClick={() => handleSelectTask(t)}
                  />
                ))}

                {loadingTasks && Array.from({ length: 3 }).map((_, i) => (
                  <tr key={`skel-${i}`} className="border-b border-zinc-800/40">
                    {[...Array(isAdmin ? 7 : 6)].map((_, j) => (
                      <td key={j} className="px-5 py-4 bg-zinc-900">
                        <div className="h-3 rounded bg-zinc-800 animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="flex justify-center pt-5">
              <button
                onClick={loadMore}
                disabled={loadingTasks}
                className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loadingTasks
                  ? <><Loader2 size={14} className="animate-spin" />Loading...</>
                  : "Load more tasks"}
              </button>
            </div>
          )}
        </>
      )}

      {org && (
        <AddTaskModal
          open={addTaskOpen}
          onClose={() => setAddTaskOpen(false)}
          org_id={org.org_id}
          onSubmit={handleAddTask}
          id={proj_id}
        />
      )}

      {addMemberTarget && (
        <AddMemberModal
          task={addMemberTarget}
          org={org}
          proj_id={proj_id}
          onAddMember={handleAddMember}
          onClose={() => setAddMemberTarget(null)}
        />
      )}
    </div>
  );
};

export default TaskSection;