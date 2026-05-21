import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  MessageCircle, Send, Paperclip, X, FileText,
  User, Calendar, Tag, Layers, ChevronRight, ChevronDown, ChevronUp,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../api/api";
import TaskInfoCard from "./TaskInfoCard";

// ─── Style maps ───────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  IN_PROGRESS: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  DONE: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  TODO: "bg-zinc-700/40 text-zinc-400 border border-zinc-700",
  BLOCKED: "bg-red-500/15 text-red-400 border border-red-500/20",
  PLANNING: "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  REVIEW: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
};

const PRIORITY_STYLE = {
  HIGH: "bg-red-500/15 text-red-400 border border-red-500/20",
  MEDIUM: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
  LOW: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
};

const badge = (label, styleMap, fallback = "bg-zinc-700/40 text-zinc-400 border border-zinc-700") => (
  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wide ${styleMap[label] ?? fallback}`}>
    {label}
  </span>
);

// ─── Timestamp formatter ──────────────────────────────────────────────────────

const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    " · " + d.toLocaleDateString([], { month: "short", day: "numeric" });
};

// ─── MessageItem ──────────────────────────────────────────────────────────────

const MessageItem = ({ msg, isOwn }) => (
  <div className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
    {/* Avatar */}
    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0 mt-0.5">
      {msg.author.name?.[0]?.toUpperCase() ?? "?"}
    </div>

    <div className={`max-w-[75%] space-y-1 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
      <div className={`flex items-center gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
        <span className="text-xs font-semibold text-white">{msg.author.name}</span>
        <span className="text-[10px] text-zinc-600">{formatTime(msg.createdAt)}</span>
      </div>

      {/* Text bubble */}
      {msg.text && (
        <div className={`text-sm leading-relaxed px-4 py-2.5 rounded-2xl ${isOwn
          ? "bg-blue-600 text-white rounded-tr-sm"
          : "bg-zinc-800 text-zinc-200 rounded-tl-sm border border-zinc-700/50"
          }`}>
          {msg.text}
        </div>
      )}

      {/* File attachment */}
      {msg.file && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${isOwn
          ? "bg-blue-700/40 border-blue-500/30 text-blue-200"
          : "bg-zinc-800 border-zinc-700 text-zinc-300"
          }`}>
          {msg.file.type?.startsWith("image/")
            ? <ImageIcon size={14} className="shrink-0" />
            : <FileText size={14} className="shrink-0" />
          }
          <span className="truncate max-w-45">{msg.file.name}</span>
        </div>
      )}
    </div>
  </div>
);

const FilePreview = ({ file, onRemove }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 max-w-xs">
    {file.type?.startsWith("image/")
      ? <ImageIcon size={13} className="text-blue-400 shrink-0" />
      : <FileText size={13} className="text-blue-400 shrink-0" />
    }
    <span className="truncate flex-1">{file.name}</span>
    <button
      onClick={onRemove}
      className="cursor-pointer text-zinc-500 hover:text-zinc-200 transition shrink-0"
    >
      <X size={13} />
    </button>
  </div>
);

const TaskDetail = ({
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const [task, setTask] = useState(null);
  const [author, setAuthor] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const getTaskData = async () => {
      try {
        const res = await api.get(`proj/task/${id}/one`);
        setTask(res.data.result);
      } catch (error) {
        toast.error(error.messages);
      }
    };
    getTaskData();
  }, [id]);

  useEffect(() => {
    const getAuthorData = async () => {
      try {
        const res = await api.get("/user/userdata");
        setAuthor(res.data.data)
      } catch (error) {
        toast.error(error.messages);
      }
    }
    getAuthorData();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePost = () => {
    const trimmed = input.trim();
    if (!trimmed && !file) return;
    try {
      const formdata = new FromData();

      // if (fileRef.current) fileRef.current.value = "";
    } catch (error) {
      toast.error(error.messages);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePost();
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

          {/* ── Left: Discussion ───────────────────────────────────── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden"
            style={{ minHeight: "600px", maxHeight: "80vh" }}>

            {/* Header */}
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-800 shrink-0">
              <MessageCircle size={16} className="text-zinc-400" />
              <h2 className="text-sm font-semibold text-white">
                Task Discussion
                <span className="ml-2 text-xs font-normal text-zinc-500">({messages.length})</span>
              </h2>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {messages.length==0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <MessageCircle size={32} className="text-zinc-700 mb-3" />
                  <p className="text-sm text-zinc-500">No comments yet. Be the first!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    msg={msg}
                    isOwn={msg.author.id === author.id}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* File preview */}
            {file && (
              <div className="px-5 pb-2 shrink-0">
                <FilePreview file={file} onRemove={() => {
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                }} />
              </div>
            )}

            {/* Input area */}
            <div className="px-5 py-4 border-t border-zinc-800 shrink-0">
              <div className="flex items-end gap-2">
                {/* Textarea */}
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Write a comment..."
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none transition"
                  />
                </div>

                {/* Right-side buttons */}
                <div className="flex flex-col gap-2 pb-0.5">
                  {/* Upload */}
                  <button
                    onClick={() => fileRef.current?.click()}
                    title="Attach file"
                    className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition"
                  >
                    <Paperclip size={16} />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {/* Post */}
                  <button
                    onClick={handlePost}
                    disabled={!input.trim() && !file}
                    className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>

              {/* Hint */}
              <p className="text-[10px] text-zinc-700 mt-2">
                Enter to send · Shift+Enter for new line · Attach images or .docx files
              </p>
            </div>
          </div>

          {/* ── Right: Task info + Project details ─────────────────── */}
          <div className="space-y-4">
            {task && <TaskInfoCard task={task} />}
          </div>

        </div>
      </div>
    </div>
  );
};

export default TaskDetail;

// ─── Mock data (remove when wired to API) ─────────────────────────────────