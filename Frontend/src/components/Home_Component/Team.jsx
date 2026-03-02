import { Search, Users, Activity, Shield } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";

const URL = import.meta.env.VITE_URL;
const Team = ({orgid}) => {
  const [members,setMembers] = useState([]);

  const getMembers = async () => {
    try {
      const response = await axios.get(`${URL}/app/org/${orgid}/members`,{withCredentials:true}); 
    }catch (error) {
      toast.error(error.message || "Failed to fetch team members");
    }
  }
  return (
    <div className="min-h-screen bg-black text-white px-18 py-15">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Team</h1>
          <p className="text-zinc-400 mt-1">
            Manage team members and their contributions
          </p>
        </div>

        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition px-5 py-2.5 rounded-lg text-sm font-medium">
          <Users size={18} />
          Invite Member
        </button>
      </div>

      <div className="flex items-center gap-4 mt-10">
        <div className="bg-linear-to-br from-zinc-800/70 to-zinc-900/10 border border-zinc-800 rounded-xl px-8 py-6 flex items-center justify-between hover:border-zinc-600 transition min-w-75">
          <div>
            <p className="text-zinc-400 text-sm">Total Members</p>
            <h3 className="text-3xl font-bold mt-2">1</h3>
          </div>
          <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="text-blue-500" />
          </div>
        </div>

        <div className="bg-linear-to-br from-zinc-800/70 to-zinc-900/10 border border-zinc-800 rounded-xl px-8 py-6 flex items-center justify-between hover:border-zinc-600 transition min-w-75">
          <div>
            <p className="text-zinc-400 text-sm">Active Projects</p>
            <h3 className="text-3xl font-bold mt-2">0</h3>
          </div>
          <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Activity className="text-emerald-500" />
          </div>
        </div>

        <div className="bg-linear-to-br from-zinc-800/70 to-zinc-900/10 border border-zinc-800 rounded-xl px-8 py-6 flex items-center justify-between hover:border-zinc-600 transition min-w-75">
          <div>
            <p className="text-zinc-400 text-sm">Total Tasks</p>
            <h3 className="text-3xl font-bold mt-2">0</h3>
          </div>
          <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Shield className="text-purple-500" />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="relative w-full max-w-lg">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search team members..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-zinc-600 transition"
          />
        </div>
      </div>

      <div className="mt-8 border border-zinc-800 rounded-xl overflow-hidden w-280">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
            <tr className="text-left">
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
            </tr>
          </thead>

          <tbody>
            {members.map((member) => (
              <tr
                key={member.id}
                className="border-b border-zinc-800 hover:bg-zinc-900/40 transition"
              >
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-xs">
                    CD
                  </div>
                  {member.name}
                </td>

                <td className="px-6 py-4 text-zinc-300">
                  {member.email}
                </td>

                <td className="px-6 py-4">
                  <span className="px-3 py-1 text-xs rounded-md bg-purple-600/20 text-purple-400 font-medium">
                    {member.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Team;