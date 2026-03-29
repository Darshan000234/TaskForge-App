import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import api from "../../../api/api.js";

const ReassignManagerModal = ({ project, onClose, onReassigned }) => {
  const [members, setMembers] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(project.email ?? "");
  const [loading, setLoading] = useState(false);
  const org = JSON.parse(localStorage.getItem("org"));

  useEffect(() => {
    api.get(`/orgs/${org.id}/members`).then((res) => setMembers(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmail) return;
    setLoading(true);
    try {
      // Adjust endpoint to match your API
      console.log('sended reassing');
      await api.patch(`/orgs/proj/${project.id}/reassign`, { org : org,email: selectedEmail });
      onReassigned({ ...project, email: selectedEmail });
    } catch (err) {
      console.error("Reassign failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 px-3 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 transition appearance-none cursor-pointer";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 w-full max-w-md text-zinc-200">
        
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Reassign Manager</h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              Project: <span className="text-blue-400 font-medium">{project.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-zinc-300 mb-1.5">Assign Manager</label>
            <div className="relative">
              <select
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
                className={selectCls}
              >
                <option value="">Select a member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.receiver_email}>
                    {m.receiver_email}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-zinc-700 text-sm hover:border-zinc-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedEmail}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition"
            >
              {loading ? "Saving..." : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReassignManagerModal;