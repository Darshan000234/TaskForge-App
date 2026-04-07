import { Users } from "lucide-react";
import TeamTaskCell from "./TeamTaskCell";

/**
 * TeamSection
 *
 * Props:
 *  teamMembers  [{ id, name, email, role }]
 *  tasks        task[]  — full task list; component builds per-member map
 */
const TeamSection = ({ teamMembers = [], tasks = [] }) => {
  // Build member → tasks map
  const memberTaskMap = {};
  teamMembers.forEach((m) => {
    memberTaskMap[m.id] = tasks.filter((t) =>
      t.assignees?.some((a) => a.id === m.id)
    );
  });

  if (teamMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-zinc-800 rounded-2xl bg-zinc-900/30">
        <Users size={28} className="text-zinc-600" />
        <p className="mt-3 text-sm text-zinc-500">No team members assigned</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs text-zinc-500 mb-4 uppercase tracking-wider font-medium">
        {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}
      </p>
      <div className="border border-zinc-800 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
            <tr className="text-left">
              <th className="px-5 py-3.5 font-medium">Member</th>
              <th className="px-5 py-3.5 font-medium">Email</th>
              <th className="px-5 py-3.5 font-medium">Role</th>
              <th className="px-5 py-3.5 font-medium">Tasks Assigned</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((m) => (
              <tr key={m.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/50 transition">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center text-xs font-semibold text-blue-400 shrink-0">
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{m.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-zinc-400 text-xs">{m.email}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 capitalize">
                    {m.role}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <TeamTaskCell tasks={memberTaskMap[m.id] ?? []} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamSection;