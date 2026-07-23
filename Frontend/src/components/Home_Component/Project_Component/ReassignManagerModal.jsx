import { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Search, Check } from "lucide-react";
import api from "../../../api/api.js";

const ReassignManagerModal = ({ project, onClose, onReassigned, org }) => {
  const [members, setMembers] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleManagerData = async () => {
      try {
        const res = await api.get(`/orgs/proj/managerData/${project.id}/${org.id}`);
        setMembers(res.data.data);
      } catch (error) {
        console.log(error);
      }
    };
    handleManagerData();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape, focus search input on open
  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
      const handleKey = (e) => {
        if (e.key === "Escape") {
          setIsOpen(false);
          setQuery("");
        }
      };
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmail) return;
    setLoading(true);
    try {
      await api.patch(`/orgs/proj/${project.id}/reassign`, { org: org, email: selectedEmail });
      onReassigned({ ...project, email: selectedEmail });
    } catch (err) {
      console.error("Reassign failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = query.toLowerCase();
    return m.user.name.toLowerCase().includes(q) || m.user.email.toLowerCase().includes(q);
  });

  const selectedMember = members.find((m) => m.user.email === selectedEmail);

  const handleSelect = (email) => {
    setSelectedEmail(email);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 sm:p-7 w-full max-w-md text-zinc-200 shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-7 gap-3">
          <div className="space-y-1 min-w-0">
            <h2 className="text-xl font-semibold tracking-tight">Reassign Manager</h2>
            <p className="text-sm text-zinc-400 truncate">
              Project: <span className="text-blue-400 font-medium">{project.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg p-1.5 transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Assign Manager
            </label>

            {/* Custom searchable dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="w-full h-12 flex items-center justify-between gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-left text-zinc-100 hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
              >
                <span className={`truncate ${selectedMember ? "text-zinc-100" : "text-zinc-500"}`}>
                  {selectedMember
                    ? `${selectedMember.user.name} (${selectedMember.user.email})`
                    : "Select a member"}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-zinc-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown panel — mt-2 gives the required gap below the trigger */}
              <div
                className={`absolute z-10 mt-2 w-full max-w-[calc(100vw-2rem)] origin-top rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/50 transition-all duration-200 ease-out ${
                  isOpen
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                }`}
              >
                {/* Search input */}
                <div className="p-2 border-b border-zinc-800">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search members..."
                      className="w-full h-8 rounded-lg bg-zinc-950 border border-zinc-800 pl-8 pr-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto py-1">
                  {filteredMembers.length === 0 ? (
                    <p className="text-center text-xs text-zinc-500 py-6">
                      No members available
                    </p>
                  ) : (
                    filteredMembers.map((m) => {
                      const isSelected = m.user.email === selectedEmail;
                      return (
                        <button
                          key={m.member_id}
                          type="button"
                          onClick={() => handleSelect(m.user.email)}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "text-zinc-200 hover:bg-zinc-800"
                          }`}
                        >
                          <span className="truncate">
                            {m.user.name}{" "}
                            <span className={isSelected ? "text-blue-100" : "text-zinc-500"}>
                              ({m.user.email})
                            </span>
                          </span>
                          {isSelected && <Check size={14} className="shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-3 border-t border-zinc-900">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedEmail}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950 transition-colors cursor-pointer"
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