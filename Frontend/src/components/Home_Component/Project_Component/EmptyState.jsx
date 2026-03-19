import React from 'react'
import { Plus, Folder } from "lucide-react";
const EmptyState = ({ onNew }) => {
    return (
        <div>
            <div className="flex flex-col items-center justify-center py-28 text-center">
                <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-5">
                    <Folder size={36} className="text-zinc-500" />
                </div>
                <h3 className="text-white font-bold text-lg">No projects found</h3>
                <p className="text-zinc-500 text-sm mt-1">Create your first project to get started</p>
                <button
                    onClick={onNew}
                    className="mt-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition px-5 py-2.5 rounded-lg text-sm font-medium"
                >
                    <Plus size={16} />Create Project
                </button>
            </div>
        </div>
    )
}

export default EmptyState