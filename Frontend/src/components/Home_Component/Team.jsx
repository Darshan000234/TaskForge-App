import { Search, Users, Activity, Shield, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Loader from "./Team_Component/loader.jsx";
import api from "../../api/api.js";
import socket from "../../socket/socket.js";
import { useOutletContext } from "react-router-dom";

const Team = () => {
  const [members, setMembers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const { org } = useOutletContext();

  useEffect(() => {
    if (!org) return;
    const getMembers = async () => {
      try {
        const response = await api.get(`/orgs/${org.id}/members`);
        setMembers(response.data);
      } catch (error) {
        toast.error("Failed to fetch team members");
      }
    };

    getMembers();
  }, [org]);


  useEffect(() => {
    const handlestatuschange = (data) => {
      setMembers((prevmember) => {
        return prevmember.map((member) => {
          if (member.id === data.id) {
            return { ...member, status: data.status }
          }
          return member;
        })
      })
    }
    
    const handleMemberExist = ({data}) => {
      const id = data.id;      
      setMembers((prevmember) => {
        return prevmember.map((member) => {
          if (member.id === id) {
            return { ...member, status: "rejected" }
          }
          return member;
        })
      })
    }

    const handleDeleteInvite = (data) => {
      const id = data;
      setMembers((prev) => prev.filter((p) => p.id !== id));
    }
    
    socket.on("invite_accepted", handlestatuschange);
    socket.on("invite_rejected", handlestatuschange);
    socket.on("member left", handleMemberExist);
    socket.on("invite Deleted", handleDeleteInvite);
    return () => {
      socket.off("invite_accepted", handlestatuschange);
      socket.off("invite_rejected", handlestatuschange);
      socket.off("member left", handleMemberExist);
      socket.off("invite Deleted", handleDeleteInvite);
    }
  }, []);

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const res = await api.delete(`/invites/delete/${id}`, { data: { org_id: org.id } });
      setMembers((prev) => prev.filter((p) => p.id !== id));
      setLoading(false);
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.message);
    }
  }

  const inviteMember = async ({ Email, id }) => {
    setLoading(true);
    try {
      if (id !== 0) {
        setMembers((prev) =>
          prev.map((n) =>
            n.status === "rejected" ? { ...n, status: "pending" } : n
          )
        );
      }
      const res = await api.post('/invites', { email: Email, org_id: Number(org.id) });
      if (!id) {
        setMembers((prev) => [...prev, res.data.invite]);
      }
      setLoading(false);
      setInviteEmail("");
      setShowInvite(false);
    } catch (error) {
      console.log(error.message);
      setLoading(false);
      toast.error(error.response?.data?.message || error.message);
    }
  };
  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-8 md:px-18 py-6 sm:py-10 md:py-15">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Team</h1>
          <p className="text-zinc-400 mt-1">
            Manage team members and their contributions
          </p>
        </div>
        {org && org.role === "admin" && (
          <button onClick={() => setShowInvite(true)} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 transition px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer w-full sm:w-auto">
            <Users size={18} />
            Invite Member
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 sm:mt-10">
        <div className="bg-linear-to-br from-zinc-800/70 to-zinc-900/10 border border-zinc-800 rounded-xl px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between hover:border-zinc-600 transition">
          <div>
            <p className="text-zinc-400 text-sm">Total Members</p>
            <h3 className="text-2xl sm:text-3xl font-bold mt-2">{members.length}</h3>
          </div>
          <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Users className="text-blue-500" />
          </div>
        </div>

        <div className="bg-linear-to-br from-zinc-800/70 to-zinc-900/10 border border-zinc-800 rounded-xl px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between hover:border-zinc-600 transition">
          <div>
            <p className="text-zinc-400 text-sm">Active Projects</p>
            <h3 className="text-2xl sm:text-3xl font-bold mt-2">0</h3>
          </div>
          <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Activity className="text-emerald-500" />
          </div>
        </div>

        <div className="bg-linear-to-br from-zinc-800/70 to-zinc-900/10 border border-zinc-800 rounded-xl px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between hover:border-zinc-600 transition">
          <div>
            <p className="text-zinc-400 text-sm">Total Tasks</p>
            <h3 className="text-2xl sm:text-3xl font-bold mt-2">0</h3>
          </div>
          <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
            <Shield className="text-purple-500" />
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mt-10">
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

      {loading ? <Loader rows={5} /> : (
        <div className="mt-8 border border-zinc-800 rounded-xl overflow-x-auto w-full">
          <table className="w-full min-w-160 text-sm">
            <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
              <tr className="text-left">
                <th className="px-4 sm:px-6 py-4 font-medium">Name</th>
                <th className="px-4 sm:px-6 py-4 font-medium">Email</th>
                <th className="px-4 sm:px-6 py-4 font-medium">Status</th>
                <th className="px-4 sm:px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {members.map((member, index) => (
                <tr
                  key={member.id}
                  className="border-b border-zinc-800 hover:bg-zinc-900/40 transition"
                >
                  <td className="px-4 sm:px-6 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-xs shrink-0">
                      {index + 1}
                    </div>
                  </td>

                  <td className="px-4 sm:px-6 py-4 text-zinc-300 whitespace-nowrap">
                    {member.receiver_email}
                  </td>

                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-md font-medium whitespace-nowrap ${member.status === "rejected" ? "bg-red-600/20 text-red-400" : "bg-purple-600/20 text-purple-400"}`}>
                        {member.status}
                      </span>
                      {member.status === "rejected" && org && org.role === "admin" && (
                        <button
                          onClick={() => inviteMember({ Email: member.receiver_email, id: member.id })}
                          className="px-3 py-1 rounded-md bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition font-medium cursor-pointer whitespace-nowrap"
                        >
                          Resend
                        </button>
                      )}
                    </div>
                  </td>
                  {org && org.role === "admin" && (
                    <td className="px-4 sm:px-6 py-4">
                      <button
                        onClick={(e) => handleDelete(member.id)}
                        title="Delete Project"
                        className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 sm:p-6 w-full max-w-md text-zinc-200">

            <div className="mb-4">
              <h2 className="text-xl font-bold">Invite Team Member</h2>
              <p className="text-sm text-zinc-400">
                Inviting to workspace
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              inviteMember({ Email: inviteEmail, id: 0 })
            }} className="space-y-4">
              <div>
                <label className="text-sm">Email</label>
                <input
                  onChange={(e) => setInviteEmail(e.target.value)}
                  type="email"
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 py-2 px-3 text-sm"
                  placeholder="Enter email"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="px-4 py-2 rounded border border-zinc-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
