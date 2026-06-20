import { useEffect, useState } from "react";
import { Users, Trash2, Loader2 } from "lucide-react";
import TeamTaskCell from "./TeamTaskCell";
import api from "../../../../api/api";
import toast from "react-hot-toast";
import socket from "../../../../socket/socket.js";
import Pagination from "../Pagination.jsx";

const TeamRow = ({ member, isLast, org, onRemoveMember, onRemoveTaskFromMember, proj_id,taskCount }) => (

  <tr className="group border-b border-zinc-800/60 last:border-b-0">

    <td className={`px-6 py-4 bg-zinc-900 group-hover:bg-zinc-900/50 ${isLast ? "rounded-bl-xl" : ""}`}>
      <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-semibold border border-blue-400/30">
        {member.name?.charAt(0).toUpperCase()}
      </div>
    </td>

    <td className="px-6 py-4 bg-zinc-900 group-hover:bg-zinc-900/50 text-sm text-zinc-300 truncate max-w-65">
      {member.email}
    </td>

    <td className="px-6 py-4 bg-zinc-900 group-hover:bg-zinc-900/50 text-zinc-400 whitespace-nowrap w-105">
      {member.role}
    </td>

    <td className="px-6 py-4 bg-zinc-900 group-hover:bg-zinc-900/50 w-[320px]">
      <div className="min-w-55">
        <TeamTaskCell
          memberId={member.memberId}
          canEdit={org?.role === "admin"}
          onRemoveTaskFromMember={onRemoveTaskFromMember}
          proj_id={proj_id}
          taskCount={taskCount}
        />
      </div>
    </td>

    {org?.role === "admin" && (
      <td className={`px-6 py-4 bg-zinc-900 group-hover:bg-zinc-900/50 ${isLast ? "rounded-br-xl" : ""}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveMember(member.memberId);
          }}
          className="p-2 rounded-md cursor-pointer hover:bg-red-500/15 text-zinc-500 hover:text-red-400 transition"
        >
          <Trash2 size={16} />
        </button>
      </td>
    )}
  </tr>
);


const TeamSection = ({ org, proj_id, setTasks }) => {
  const LIMIT = 10;

  const [teamMembers, setTeamMembers] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (!proj_id) return;
    setTeamMembers([]);
    setNextCursor(null);
    setHasMore(false);
    fetchTeam(null);
  }, [proj_id]);


  const fetchTeam = async (cursorValue) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT });
      if (cursorValue) params.set("cursor", cursorValue);

      const res = await api.get(`/proj/team/${proj_id}?${params}`);
      const { result, nextCursor: nc, hasMore: hm } = res.data;
      console.log(res);
      
      setTeamMembers((prev) => cursorValue ? [...prev, ...result] : result);
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
    const handleDeleteMemberSocket = ({ data }) => {
      setTeamMembers((prev) => prev.filter((m) => m.memberId !== data.id));
    };

    const handleMembersUpdate = async ({ memberIds }) => {
      if (!memberIds?.length) return;
      try {
        const res = await api.post(`/proj/team/${proj_id}/members`, { memberIds });
        const updated = res.data.result;
        setTeamMembers((prev) => {
          const map = new Map(prev.map((m) => [m.memberId, m]));
          updated.forEach((m) => map.set(m.memberId, m));
          return Array.from(map.values());
        });
      } catch { }
    };

    const onRemovedMember = ({ task_id, user_id }) => {
      setTeamMembers((prev) =>
        prev.map((m) =>
          m.id === user_id
            ? { ...m, tasks: (m.tasks ?? []).filter((t) => t.id !== task_id) }
            : m
        )
      );
    };

    socket.on("delete Member", handleDeleteMemberSocket);
    socket.on("add task", handleMembersUpdate);
    socket.on("task_deleted", handleMembersUpdate);
    socket.on("Add member", handleMembersUpdate);
    socket.on("removed member", onRemovedMember);

    return () => {
      socket.off("delete Member", handleDeleteMemberSocket);
      socket.off("add task", handleMembersUpdate);
      socket.off("task_deleted", handleMembersUpdate);
      socket.off("Add member", handleMembersUpdate);
      socket.off("removed member", onRemovedMember);
    };
  }, [proj_id]);


  const handleRemoveMember = async (memberId) => {
    try {
      await api.post(`proj/team/${proj_id}/delete`, { user_id: memberId, proj_id: proj_id });
      setTeamMembers((prev) => prev.filter((m) => m.memberId !== memberId));
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleRemoveTaskFromMember = async (taskId, memberId) => {
    try {
      await api.post(`proj/team/delete/task`, { task_id: taskId, user_id: memberId, proj_id: proj_id });
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...task, assignees: task.assignees.filter((a) => a.id !== memberId) }
            : task
        )
      );
      toast.success("Task removed from member");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };


  return (
    <div className="flex-1 min-w-0">
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
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                <tr>
                  <th className="px-5 py-3 text-left rounded-tl-xl">User</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">Tasks</th>
                  {org?.role === "admin" && (
                    <th className="px-5 py-3 text-left w-10 rounded-tr-xl">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((m, i) => {
                  return (
                    <TeamRow
                      key={m.memberId}
                      member={m}
                      isLast={i === teamMembers.length - 1 && !hasMore}
                      org={org}
                      onRemoveMember={handleRemoveMember}
                      onRemoveTaskFromMember={handleRemoveTaskFromMember}
                      proj_id={proj_id}
                      taskCount={m.taskCount}
                    />
                  );
                })}

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