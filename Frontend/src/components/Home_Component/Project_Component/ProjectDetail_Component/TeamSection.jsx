import { Users } from "lucide-react";
import TeamTaskCell from "./TeamTaskCell";

const TeamSection = ({
  teamMembers = [],
  tasks = [],
  onRemoveMember,
  onDeleteTask,
  org
}) => {

  if (teamMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-zinc-800 rounded-2xl bg-zinc-900/30">
        <Users size={28} className="text-zinc-600" />
        <p className="mt-3 text-sm text-zinc-500">No team members assigned</p>
      </div>
    );
  }

  // build tasks per member (you were missing this logic)
  const getTasksForMember = (memberId) => {
    return tasks.filter(t =>
      (t.assignees ?? []).some(a => a.id === memberId)
    );
  };

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs text-zinc-500 mb-4 uppercase tracking-wider font-medium">
        {teamMembers.length} members
      </p>

      <div className="border border-zinc-800 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
            <tr>
              <th className="px-5 py-3.5">Member</th>
              <th className="px-5 py-3.5">Email</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Tasks</th>
            </tr>
          </thead>

          <tbody>
            {teamMembers.map((m) => {
              const memberTasks = getTasksForMember(m.memberId);

              return (
                <tr key={m.memberId} className="border-b border-zinc-800/60 hover:bg-zinc-900/50">
                  
                  <td className="px-5 py-3.5">{m.name}</td>
                  <td className="px-5 py-3.5 text-xs text-zinc-400">{m.email}</td>
                  <td className="px-5 py-3.5">{m.role}</td>

                  <td className="px-5 py-3.5">
                    <TeamTaskCell
                      tasks={memberTasks}
                      memberId={m.memberId}
                      canEdit={org?.role === "admin"}
                      onRemoveMember={onRemoveMember}
                      onDeleteTask={onDeleteTask}
                    />
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamSection;