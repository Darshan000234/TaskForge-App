import { useState, useEffect, useRef } from "react";
import { Search, X, UserPlus, Check } from "lucide-react";
import api from "../../../../api/api.js";
import toast from "react-hot-toast";

const AddMemberModal = ({ task, org, proj_id, onAddMember, onClose }) => {
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const overlayRef = useRef(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get(`proj/task/${task.id}/addmemberdata/${proj_id}/${org?.id}`);
        setMembers(res.data.member ?? []);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [task.id, proj_id, org.org_id]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = members.filter((m) =>
    m.receiver_email?.toLowerCase().includes(search.toLowerCase())
  );

  const isSelected = (m) => selected.some((s) => s.receiver_id === m.receiver_id);

  const toggle = (m) => {
    setSelected((prev) =>
      isSelected(m)
        ? prev.filter((s) => s.receiver_id !== m.receiver_id)
        : [...prev, m]
    );
  };

  const handleConfirm = () => {
    selected.forEach((m) => onAddMember?.(task.id, m));
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col">

        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <UserPlus size={15} className="text-blue-400" />
            Add Members
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition"
          >
            <X size={15} />
          </button>
        </div>

        <p className="px-4 pt-3 text-xs text-zinc-500 truncate shrink-0">
          Task: <span className="text-zinc-300">{task.name}</span>
        </p>

        <div className="relative px-4 pt-3 pb-2 shrink-0">
          <Search
            size={13}
            className="absolute left-7 top-1/2 -translate-y-[30%] text-zinc-500 pointer-events-none"
          />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-zinc-500 transition placeholder:text-zinc-600"
          />
        </div>

        <div className="px-4 pb-2 max-h-56 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-zinc-600 text-center py-6">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-6">
              {members.length === 0 ? "All members already assigned" : "No results for that search"}
            </p>
          ) : (
            filtered.map((m) => (
              <button
                key={m.receiver_id}
                onClick={() => toggle(m)}
                className={`cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition mb-1 border ${
                  isSelected(m)
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "border-transparent hover:bg-zinc-800"
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center text-[11px] font-semibold text-blue-400 shrink-0">
                  {m.receiver_email?.[0]?.toUpperCase()}
                </div>

                <p className="text-xs text-zinc-300 truncate flex-1 text-left">
                  {m.receiver_email}
                </p>

                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition ${
                    isSelected(m)
                      ? "border-blue-500 bg-blue-500"
                      : "border-zinc-600"
                  }`}
                >
                  {isSelected(m) && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-t border-zinc-800 shrink-0">
          <span className="text-xs text-zinc-500">
            {selected.length > 0 ? `${selected.length} selected` : "Select members to add"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="cursor-pointer px-3 py-1.5 text-xs rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.length === 0}
              className="cursor-pointer px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Add{selected.length > 0 ? ` (${selected.length})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;