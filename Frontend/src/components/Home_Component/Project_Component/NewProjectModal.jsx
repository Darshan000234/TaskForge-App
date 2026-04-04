import { useState, useEffect } from "react";
import {  ChevronDown,X } from "lucide-react";
import api from "../../../api/api.js";

const INITIAL_FORM = {
  name: "",
  Description: "",
  status: "Active",
  priority: "Medium",
  endDate: "",
  email: "",
  memberIds: [],
};

const NewProjectModal = ({ onClose, onCreated}) => {
    const [form, setForm] = useState(INITIAL_FORM);
    const org = JSON.parse(localStorage.getItem("org"));
    const [members,setMembers] = useState([]);
    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    useEffect(() => {
        const getMembers = async () =>{
            // console.log(org.id);
            const response = await api.get(`/orgs/${org.id}/members`);
            setMembers(response.data);
            // console.log(response.data);
        }
        getMembers();
    }, [])
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        onCreated({
            id: '',
            name: form.name,
            Description: form.Description,
            status: !form.status ? "active":form.status,
            priority: form.priority,
            email : form.email,
            endDate: form.endDate
        });
        // console.log(form.description);
    };

    const inputCls =
        "w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 px-3 text-[15px] text-zinc-200 focus:outline-none focus:border-zinc-500 transition";
    const selectCls =
        "w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 px-3 text-[15px] text-zinc-200 focus:outline-none focus:border-zinc-500 transition appearance-none cursor-pointer";
    const labelCls = "block text-sm text-zinc-300 mb-1.5";
    return (
        <div>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 w-full max-w-lg text-zinc-200">

                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold">Create New Project</h2>
                            <p className="text-sm text-zinc-400 mt-0.5">
                                In workspace:{" "}
                                <span className="text-blue-400 font-medium">{org.name}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-zinc-500 hover:text-zinc-200 transition mt-0.5"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Project Name */}
                        <div>
                            <label className={labelCls}>Project Name</label>
                            <input
                                value={form.name}
                                onChange={(e) => set("name", e.target.value)}
                                type="text"
                                placeholder="Enter project name"
                                className={inputCls}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className={labelCls}>Description</label>
                            <textarea
                                value={form.Description}
                                onChange={(e) => set("Description", e.target.value)}
                                placeholder="Describe your project"
                                rows={2}
                                className={`${inputCls} resize-y overflow-auto min-h-15 max-h-50`}
                            />
                        </div>

                        {/* Status + Priority */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Status</label>
                                <div className="relative">
                                    <select
                                        value={form.status}
                                        onChange={(e) => set("status", e.target.value)}
                                        className={selectCls}
                                    >
                                        <option value="active">Active</option>
                                        <option value="on_hold">On Hold</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Priority</label>
                                <div className="relative">
                                    <select
                                        value={form.priority}
                                        onChange={(e) => set("priority", e.target.value)}
                                        className={selectCls}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Start Date + End Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>End Date</label>
                                <input
                                    type="date"
                                    value={form.endDate}
                                    onChange={(e) => set("endDate", e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Project Lead */}
                        <div>
                            <label className={labelCls}>Project Lead</label>
                            <div className="relative">
                                <select
                                    value={form.email}
                                    onChange={(e) => set("email", e.target.value)}
                                    className={selectCls}
                                >
                                    <option value="">No lead</option>
                                    {members.map((m,idx) => (
                                        <option key={m.id} value={m.receiver_email}>{m.receiver_email}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>

                        
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="cursor-pointer px-5 py-2.5 rounded-lg border border-zinc-700 text-sm hover:border-zinc-500 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="cursor-pointer px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium transition"
                            >
                                Create Project
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default NewProjectModal