import { Users, Trash2 } from "lucide-react";
import TeamTaskCell from "./TeamTaskCell";
import api from "../../../../api/api";
import toast from "react-hot-toast";

const TeamRow = ({
  member,
  tasks,
  isLast,
  org,
  onRemoveMember,
  onRemoveTaskFromMember
}) => (
  <tr className="group border-b border-zinc-800/60 last:border-b-0">

    {/* User */}
    <td className={`px-6 py-4 bg-zinc-900 group-hover:bg-zinc-900/50 
      ${isLast ? "rounded-bl-xl" : ""}`}>
      
      <div className="w-9 h-9 rounded-full 
        bg-blue-500/20 text-blue-400 
        flex items-center justify-center 
        text-sm font-semibold border border-blue-400/30">
        {member.name?.charAt(0).toUpperCase()}
      </div>
    </td>

    {/* Email */}
    <td className="px-6 py-4 bg-zinc-900 group-hover:bg-zinc-900/50 
      text-sm text-zinc-300 truncate max-w-65">
      {member.email}
    </td>

    {/* Role */}
    <td className="px-6 py-4 bg-zinc-900 group-hover:bg-zinc-900/50 
      text-zinc-400 whitespace-nowrap w-105">
      {member.role}
    </td>

    {/* Tasks */}
    <td className="px-6 py-4 bg-zinc-900 group-hover:bg-zinc-900/50 w-[320px]">
      <div className="min-w-55">
        <TeamTaskCell
          tasks={tasks}
          memberId={member.memberId}
          canEdit={org?.role === "admin"}
          onRemoveTaskFromMember={onRemoveTaskFromMember}
        />
      </div>
    </td>

    {/* Actions */}
    {org?.role === "admin" && (
      <td className={`px-6 py-4 bg-zinc-900 group-hover:bg-zinc-900/50
        ${isLast ? "rounded-br-xl" : ""}`}>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveMember(member.memberId);
          }}
          className="opacity-0 group-hover:opacity-100 p-2 rounded-md cursor-pointer
            hover:bg-red-500/15 text-zinc-500 hover:text-red-400 transition"
        >
          <Trash2 size={16} />
        </button>
      </td>
    )}
  </tr>
);


const TeamSection = ({
  teamMembers = [],
  tasks = [],
  org,
  proj_id,
  setTeamMembers,
  setTasks
}) => {

  const handleRemoveMember = async (memberId) => {
    try {
      await api.post(`proj/team/${proj_id}/delete`, { user_id: memberId });

      setTeamMembers(prev => prev.filter(m => m.memberId !== memberId));

      toast.success("Member removed");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleRemoveTaskFromMember = async (taskId, memberId) => {
    try {
      await api.post(`/tasks/unassign`, {
        task_id: taskId,
        user_id: memberId
      });

      // update UI instantly
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? {
                ...task,
                assignees: task.assignees.filter(a => a.id !== memberId)
              }
            : task
        )
      );

      toast.success("Task removed from member");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const getTasksForMember = (memberId) => {
    return tasks.filter(t =>
      (t.assignees ?? []).some(a => a.id === memberId)
    );
  };

  return (
    <div className="flex-1 min-w-0">
      {teamMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-zinc-800 rounded-2xl bg-zinc-900/30">
          <Users size={28} className="text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-500">No team members assigned</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-500 mb-4 uppercase tracking-wider font-medium">
            {teamMembers.length} members
          </p>

          <div className="border border-zinc-800 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                <tr>
                  <th className="px-5 py-3 text-left">User</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">Tasks</th>
                  <th className="px-5 py-3 text-left w-10">Actions</th>
                </tr>
              </thead>

              <tbody>
                {teamMembers.map((m, i) => (
                  <TeamRow
                    key={m.memberId}
                    member={m}
                    tasks={getTasksForMember(m.memberId)}
                    isLast={i === teamMembers.length - 1}
                    org={org}
                    onRemoveMember={handleRemoveMember}
                    onRemoveTaskFromMember={handleRemoveTaskFromMember}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default TeamSection;