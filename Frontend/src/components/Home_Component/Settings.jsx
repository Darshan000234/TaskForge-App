import { useState, useEffect, useRef } from "react";
import { X, LogOut, Trash2, User, Mail, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/api.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { clearAccessToken } from "../../utils/authStore.js";
import EditUsernameModal from "./EditUsernameModal.jsx";

const ConfirmModal = ({ isOpen, onClose, onConfirm, type }) => {
  const isDelete = type === "delete";

  const config = {
    delete: {
      title: "Delete account",
      message:
        "This will permanently delete your account, all your projects, tasks, and data. This action cannot be undone.",
      confirmLabel: "Delete my account",
      confirmClass:
        "w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition",
    },
    signout: {
      title: "Sign out",
      message: "You'll be signed out of your account on this device.",
      confirmLabel: "Sign out",
      confirmClass:
        "w-full py-2.5 rounded-lg bg-[#3b82f6] hover:bg-blue-600 text-white text-sm font-medium transition",
    },
  };

  const c = config[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-[#18181b] border border-zinc-800 rounded-xl p-5 sm:p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${
                isDelete ? "bg-red-500/10" : "bg-blue-500/10"
              }`}
            >
              {isDelete ? (
                <Trash2 size={18} className="text-red-400" />
              ) : (
                <LogOut size={18} className="text-blue-400" />
              )}
            </div>

            <h3 className="text-white font-semibold text-base mb-1">{c.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">{c.message}</p>

            <div className="flex flex-col gap-2">
              <button onClick={onConfirm} className={c.confirmClass}>
                {c.confirmLabel}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Settings = ({ isOpen, onClose }) => {
  const [user, setUser] = useState(null);
  const [modal, setModal] = useState(null);
  const [editUsernameOpen, setEditUsernameOpen] = useState(false);
  const navigate = useNavigate();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchUser = async () => {
      try {
        const res = await api.get("/user/userdata");
        setUser(res.data.data);
      } catch {
        toast.error("Failed to load profile");
      }
    };
    fetchUser();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || modal || editUsernameOpen) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, modal, editUsernameOpen]);

  const handleSignOut = async () => {
    try {
      await api.get("/user/logout");
      clearAccessToken();
      toast.success("Signed out");
      navigate("/Signup_login", { replace: true });
    } catch (err) {
      toast.error(err.message)
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete("/user/delete-account");
      clearAccessToken();
      toast.success("Account deleted");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
      setModal(null);
    }
  };

  const handleUsernameUpdated = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  };

  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : "??";

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              ref={panelRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-screen w-full max-w-sm bg-[#18181b] border-l border-zinc-800 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-zinc-800">
                <h2 className="text-white font-semibold text-base">Settings</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
                    Account
                  </p>

                  <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm truncate">
                        {user?.name ?? "—"}
                      </p>
                      <p className="text-zinc-400 text-xs truncate mt-0.5">
                        {user?.email ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 rounded-lg border border-zinc-800">
                      <User size={15} className="text-zinc-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-zinc-500">Username</p>
                        <p className="text-sm text-white truncate">
                          {user?.name ?? "—"}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditUsernameOpen(true)}
                        className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-white transition cursor-pointer shrink-0"
                        aria-label="Edit username"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 rounded-lg border border-zinc-800">
                      <Mail size={15} className="text-zinc-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-500">Email</p>
                        <p className="text-sm text-white truncate">
                          {user?.email ?? "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-800" />

                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
                    Session
                  </p>
                  <button
                    onClick={() => setModal("signout")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition text-sm"
                  >
                    <LogOut size={16} className="text-zinc-400" />
                    Sign out
                  </button>
                </div>

                <div>
                  <p className="text-xs text-red-500/70 uppercase tracking-wider mb-3">
                    Danger zone
                  </p>
                  <button
                    onClick={() => setModal("delete")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition text-sm border border-red-500/20 hover:border-red-500/40"
                  >
                    <Trash2 size={16} />
                    Delete my account
                  </button>
                  <p className="text-xs text-zinc-600 mt-2 px-1">
                    Permanently deletes all your data. Cannot be undone.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={modal === "signout"}
        onClose={() => setModal(null)}
        onConfirm={handleSignOut}
        type="signout"
      />
      <ConfirmModal
        isOpen={modal === "delete"}
        onClose={() => setModal(null)}
        onConfirm={handleDeleteAccount}
        type="delete"
      />
      <EditUsernameModal
        isOpen={editUsernameOpen}
        onClose={() => setEditUsernameOpen(false)}
        currentUsername={user?.name ?? ""}
        onUpdated={handleUsernameUpdated}
      />
    </>
  );
};

export default Settings;