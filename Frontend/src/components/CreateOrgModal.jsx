import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Loader2 } from "lucide-react";
import api from "../api/api.js";
import toast from "react-hot-toast";

const CreateOrgModal = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Organization name is required.");
      return;
    }
    if (trimmed.length < 3) {
      setError("Name must be at least 3 characters.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await api.post("/orgs/add", { name: trimmed });
      toast.success("Organization created!");
      onCreated?.(res.data.org);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create organization.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setName("");
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div
              className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md mx-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-800 p-2 rounded-lg">
                    <Building2 size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-sm">Create Workspace</h2>
                    <p className="text-zinc-500 text-xs">You'll be set as admin</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="text-zinc-500 hover:text-white transition p-1 rounded hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="e.g. Acme Corp"
                    maxLength={50}
                    className={`w-full bg-zinc-800 border rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition
                      ${error ? "border-red-500 focus:border-red-400" : "border-zinc-700 focus:border-blue-500"}`}
                    autoFocus
                  />
                  {error && (
                    <p className="text-red-400 text-xs mt-1.5">{error}</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-5 flex justify-end gap-2">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !name.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateOrgModal;