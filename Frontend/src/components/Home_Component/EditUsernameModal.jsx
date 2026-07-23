import { useState, useEffect, useRef } from "react";
import { X, Pencil, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/api.js";
import toast from "react-hot-toast";

const MAX_LENGTH = 20;

const EditUsernameModal = ({ isOpen, onClose, currentUsername, onUpdated }) => {
  const [username, setUsername] = useState(currentUsername ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setUsername(currentUsername ?? "");
      setError("");
      setLoading(false);
    }
  }, [isOpen, currentUsername]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, loading]);

  const validate = (value) => {
    if (!value || value.trim() === "") {
      return "Username is required";
    }
    
    return "";
  };

  const handleChange = (e) => {
    const value = e.target.value.slice(0, MAX_LENGTH);
    setUsername(value);
    if (error) setError("");
  };

  const handleSave = async () => {
    const validationError = validate(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await api.patch("/setting/edit-username", { username });
      toast.success(res.data?.message || "Username updated successfully");
      onUpdated?.(res.data.data);
      onClose();
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      
      if (status === 409) {
        setError(message || "Username already exists");
      } else if (status === 400) {
        setError(message || "Username is required");
      } else {
        toast.error(message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) handleSave();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !loading) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-[#18181b] border border-zinc-800 rounded-xl p-5 sm:p-6 w-full max-w-sm shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-blue-500/10 shrink-0">
                <Pencil size={16} className="text-blue-400" />
              </div>
              <button
                onClick={() => !loading && onClose()}
                className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer shrink-0"
                disabled={loading}
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="text-white font-semibold text-base mb-1">
              Edit Username
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-5">
              Choose a unique username.
            </p>

            <div className="mb-1">
              <div
                className={`flex items-center rounded-lg border bg-zinc-900 px-3 transition ${
                  error
                    ? "border-red-500/60"
                    : "border-zinc-700 focus-within:border-blue-500"
                }`}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={username}
                  onChange={handleChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter a unique username"
                  disabled={loading}
                  autoFocus
                  className="flex-1 min-w-0 bg-transparent py-2.5 text-sm text-white placeholder-zinc-500 outline-none disabled:opacity-60"
                />
                <span className="text-xs text-zinc-500 shrink-0 ml-2 tabular-nums">
                  {username.length}/{MAX_LENGTH}
                </span>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 mt-2"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => !loading && onClose()}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#3b82f6] hover:bg-blue-600 text-white text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditUsernameModal;