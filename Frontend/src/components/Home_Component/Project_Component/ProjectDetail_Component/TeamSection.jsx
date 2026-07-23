import { useEffect, useState, useCallback } from "react";
import { Users, Trash2, Loader2, Search } from "lucide-react";
import useDebounce from "../../../../utils/debounce";
import TeamTaskCell from "./TeamTaskCell";
import api from "../../../../api/api";
import toast from "react-hot-toast";
import socket from "../../../../socket/socket.js";

const TeamRow = ({ member, isLast, org, onRemoveMember, onRemoveTask, onTasksLoaded, proj_id, isAdmin }) => (
  <tr className="group border-b border-zinc-800/60 last:border-b-0">
    <td className={`px-6 py-4 bg-zinc-900 group-hover:bg-zinc-900/50 ${isLast ? "rounded-bl-xl" : ""}`}>
      <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-semibold border border-blue-400/30">
        {member.name?.charAt(0).toUpperCase()}
      </div>
    </td>

    <td className="px-6 py-4 bg-zinc-900 group-hover:bg-zinc-900/50 text-sm text-zinc-300 truncate max-w-65">
      {member.email}
    </td>

    <td className="px-6 py-4 bg-zinc-900 group-hover:bg-zinc-900/50 text-zinc-400 whitespace-nowrap">
      {member.role}
    </td>

    <td className="px-6 py-4 bg-zinc-900 group-hover:bg-zinc-900/50">
      <div className="min-w-55">
        <TeamTaskCell
          memberId={member.memberId}
          proj_id={proj_id}
          tasks={member.tasks}
          taskCount={member.taskCount}
          canEdit={isAdmin}
          onRemoveTask={(taskId) => onRemoveTask(taskId, member.memberId)}
          onTasksLoaded={onTasksLoaded}
        />
      </div>
    </td>

    {isAdmin && (
      <td className={`px-6 py-4 bg-zinc-900 group-hover:bg-zinc-900/50 ${isLast ? "rounded-br-xl" : ""}`}>
        <button
          onClick={(e) => { e.stopPropagation(); onRemoveMember(member.memberId); }}
          className="p-2 rounded-md cursor-pointer hover:bg-red-500/15 text-zinc-500 hover:text-red-400 transition"
        >
          <Trash2 size={16} />
        </button>
      </td>
    )}
  </tr>
);

const LIMIT = 10;

const TeamSection = ({ org, proj_id, onTaskAssigneeRemoved, role }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);

  useEffect(() => {
    if (!proj_id) return;

    setTeamMembers([]);
    setNextCursor(null);
    setHasMore(false);

    fetchTeam(null);
  }, [proj_id, search]);

  const fetchTeam = async (cursorValue) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT });
      if (cursorValue) params.set("cursor", cursorValue);
      if (search.trim()) params.set("search", search.trim());

      const res = await api.get(`/proj/team/${proj_id}?${params}`);
      const { result, nextCursor: nc, hasMore: hm } = res.data;

      const normalised = result.map((m) => ({ ...m, tasks: null }));

      setTeamMembers((prev) =>
        cursorValue ? [...prev, ...normalised] : normalised
      );
      setNextCursor(nc);
      setHasMore(hm);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) fetchTeam(nextCursor);
  };

  useEffect(() => {
    const handleDeleteMember = ({ data }) => {
      setTeamMembers((prev) => prev.filter((m) => m.memberId !== data.id));
    };

    const handleMembersUpdate = async ({ memberIds }) => {
      if (!memberIds?.length) return;
      try {
        const res = await api.get(`/proj/team/${proj_id}/members`, {
          params: {
            memberIds,
          }
        },);
        const updated = res.data.result;
        setTeamMembers((prev) => {
          const map = new Map(prev.map((m) => [m.memberId, m]));
          updated.forEach((m) => {
            const existing = map.get(m.memberId);
            map.set(m.memberId, {
              ...m,
              tasks: existing?.tasks ?? null,
            });
          });
          return Array.from(map.values());
        });
      } catch { }
    };

    const handleRemovedMember = ({ task_id, user_id }) => {
      setTeamMembers((prev) =>
        prev.map((m) => {
          if (m.memberId !== user_id) return m;
          const updatedTasks =
            m.tasks !== null
              ? m.tasks.filter((t) => t.id !== task_id)
              : null;
          return {
            ...m,
            tasks: updatedTasks,
            taskCount: Math.max((m.taskCount || 1) - 1, 0),
          };
        })
      );
    };

    socket.on("delete Member", handleDeleteMember);
    socket.on("add task", handleMembersUpdate);
    socket.on("task_deleted", handleMembersUpdate);
    socket.on("Add member", handleMembersUpdate);
    socket.on("removed member", handleRemovedMember);
    socket.on("member left", handleDeleteMember);

    return () => {
      socket.off("delete Member", handleDeleteMember);
      socket.off("add task", handleMembersUpdate);
      socket.off("task_deleted", handleMembersUpdate);
      socket.off("Add member", handleMembersUpdate);
      socket.off("removed member", handleRemovedMember);
      socket.off("member left", handleDeleteMember);
    };
  }, [proj_id]);

  const handleRemoveMember = async (memberId) => {
    try {
      await api.post(`proj/team/${proj_id}/delete`, { user_id: memberId, proj_id });
      setTeamMembers((prev) => prev.filter((m) => m.memberId !== memberId));
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleRemoveTask = async (taskId, memberId) => {
    try {
      await api.post(`proj/team/delete/task`, {
        task_id: taskId,
        user_id: memberId,
        proj_id,
      });

      setTeamMembers((prev) =>
        prev.map((m) => {
          if (m.memberId !== memberId) return m;
          const updatedTasks =
            m.tasks !== null
              ? m.tasks.filter((t) => t.id !== taskId)
              : null;
          return {
            ...m,
            tasks: updatedTasks,
            taskCount: Math.max((m.taskCount || 1) - 1, 0),
          };
        })
      );

      onTaskAssigneeRemoved?.(taskId, memberId);

      toast.success("Task removed from member");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleTasksLoaded = useCallback((memberId, tasks) => {
    setTeamMembers((prev) =>
      prev.map((m) =>
        m.memberId === memberId
          ? { ...m, tasks, taskCount: tasks.length }
          : m
      )
    );
  }, []);
  const isAdmin = (role && role === "admin" || role === "manager");
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-5">
        <div className="relative w-full max-w-sm">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />

          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search team members..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-11 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>
      {!loading && teamMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-zinc-800 rounded-2xl bg-zinc-900/30">
          <Users size={28} className="text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-500">No team members assigned</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-500 mb-4 uppercase tracking-wider font-medium">
            {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}
            {hasMore ? "+" : ""}
          </p>
          <div className="border border-zinc-800 rounded-xl">
            <table className="w-full min-w-180 text-sm">
              <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                <tr>
                  <th className="px-5 py-3 text-left rounded-tl-xl whitespace-nowrap">User</th>
                  <th className="px-5 py-3 text-left whitespace-nowrap">Email</th>
                  <th className="px-5 py-3 text-left whitespace-nowrap">Role</th>
                  <th className="px-5 py-3 text-left whitespace-nowrap">Tasks</th>
                  {isAdmin && (
                    <th className="px-5 py-3 text-left w-10 rounded-tr-xl">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((m, i) => (
                  <TeamRow
                    key={m.memberId}
                    member={m}
                    isLast={i === teamMembers.length - 1 && !hasMore}
                    org={org}
                    proj_id={proj_id}
                    onRemoveMember={handleRemoveMember}
                    onRemoveTask={handleRemoveTask}
                    onTasksLoaded={handleTasksLoaded}
                    isAdmin={isAdmin}
                  />
                ))}

                {loading && Array.from({ length: 3 }).map((_, i) => (
                  <tr key={`skel-${i}`} className="border-b border-zinc-800/40">
                    {[...Array(org?.role === "admin" ? 5 : 4)].map((_, j) => (
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
                disabled={loading}
                className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 size={14} className="animate-spin" />Loading...</>
                  : "Load more members"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeamSection;