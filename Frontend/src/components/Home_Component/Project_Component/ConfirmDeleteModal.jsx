import { X, Trash2 } from "lucide-react";

const ConfirmDeleteModal = ({ project, onClose, onConfirm }) => {
  console.log(project);
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 w-full max-w-sm text-zinc-200">
        
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Trash2 size={18} className="text-red-400" />
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <h2 className="text-lg font-bold text-white">Delete Project</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Are you sure you want to delete{" "}
          <span className="text-white font-medium">"{project.name}"</span>?
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-sm hover:border-zinc-500 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(project.id)}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium transition cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;