import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import socket from "../../../socket/socket.js";
import {
  MessageCircle, Send, Paperclip, X, FileText,
  User, Calendar, Tag, Layers, ChevronRight, ChevronDown, ChevronUp,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../api/api";
import TaskInfoCard from "./TaskInfoCard";


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

const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    " · " + d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const MessageItem = ({ msg, isOwn }) => (
  <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>

    <div className="max-w-[75%] flex flex-col gap-1">

      {!isOwn && (
        <span className="text-xs text-zinc-400">
          {msg.user?.name}
        </span>
      )}

      {msg.content && (
        <div
          className={`px-4 py-2.5 text-sm rounded-2xl ${isOwn
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-zinc-800 text-zinc-200 rounded-bl-sm border border-zinc-700/50"
            }`}
        >
          {msg.content}

          <div className="text-[10px] mt-1 text-right opacity-70">
            {formatTime(msg.createdAt)}
          </div>
        </div>
      )}

      {msg.fileUrl && msg.mimeType?.startsWith("image/") && (
        <a
          href={msg.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div
            className={`px-3 py-2 rounded-xl text-xs cursor-pointer ${isOwn
              ? "bg-blue-700/40 text-blue-200"
              : "bg-zinc-800 text-zinc-300 border border-zinc-700"
              }`}
          >
            🖼 Image - Click to open

            <div className="text-[10px] mt-1 text-right opacity-70">
              {formatTime(msg.createdAt)}
            </div>
          </div>
        </a>
      )}

      {msg.fileUrl && msg.mimeType === "application/pdf" && (
        <a
          href={msg.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div
            className={`px-3 py-2 rounded-xl text-xs cursor-pointer ${isOwn
              ? "bg-blue-700/40 text-blue-200"
              : "bg-zinc-800 text-zinc-300 border border-zinc-700"
              }`}
          >
            📄 {msg.fileName}

            <div className="text-[10px] mt-1 text-right opacity-70">
              {formatTime(msg.createdAt)}
            </div>
          </div>
        </a>
      )}

      {msg.fileUrl &&
        !msg.mimeType?.startsWith("image/") &&
        msg.mimeType !== "application/pdf" && (
          <div className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs">
            <a
              href={msg.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline break-all"
            >
              {msg.fileName}
            </a>
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
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);
  const [task, setTask] = useState(null);
  const [author, setAuthor] = useState(null);
  const { id } = useParams();
  const isFirstLoad = useRef(true);

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
  }, [])
  useEffect(() => {
    if (isFirstLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      isFirstLoad.current = false;
    }
  }, [messages]);
  useEffect(() => {
    const getTaskData = async () => {
      try {
        const res = await api.get(`proj/task/${id}/one`);
        socket.emit('join_task', { id: id });
        setTask(res.data.result);
      } catch (error) {
        toast.error(error.messages);
      }
    };
    getTaskData();
  }, [id]);

  useEffect(() => {
    const getMessageData = async () => {
      try {
        const res = await api.get(`/proj/task/chat/messageData/${id}`);
        setMessages(res.data.result);
      } catch (error) {
        console.log(error);
        toast.error(error.messages);
      }
    }
    getMessageData();
  }, []);

  useEffect(() => {
    const handleUpdateData = async (id) => {
      const res = await api.get(`/proj/task/chat/messageData/${id}`);
      setMessages(res.data.result);
    }
    socket.on("updateTask", handleUpdateData);
    return () => {
      socket.off("updateTask", handleUpdateData);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!author) return;
    const handlenewMessage = (data) => {
      if (data.user_id == author?.id) return;
      setMessages((prev) => [...prev, data]);
    }
    socket.on("message", handlenewMessage);
    return () => {
      socket.off("message", handlenewMessage);
    }
  }, [author])

  const handlePost = async () => {
    const trimmed = input.trim();
    if (!trimmed && !file) return;
    try {
      const formData = new FormData();

      formData.append("task_id", id);

      if (file) {
        if (file.type.startsWith("image/")) {
          formData.append("type", "IMAGE");
        } else {
          formData.append("type", "FILE");
        }

        formData.append("file", file);
      } else {
        formData.append("type", "TEXT");
        formData.append("content", trimmed);
      }

      const res = await api.post("/proj/task/chat/message/sent", formData);
      setMessages((prev) => [...prev, res.data.result]);
      setInput("");

      if (fileRef.current) fileRef.current.value = "";
      if (file) setFile(null)
      toast.success("message sent");
    } catch (error) {
      console.log(error);

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

    if (!selected) return;

    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(selected.type)) {
      toast.error("Only PDF, image (jpg/png), or txt allowed");
      e.target.value = "";
      return;
    }

    setFile(selected);
  };

  const handleUpdateTask = async (data) => {
    try {
      console.log(data);
      
      await api.post("proj/task/update", { data : data });
      setTask(data);
    } catch (error) {
      toast.error(error.messages);
    }
  };
  return (
    <div className="h-scrren overflow-hidden bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 h-full flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 h-full mt-10">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col h-full overflow-hidden"
            style={{ minHeight: "600px", maxHeight: "80vh" }}>

            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-800 shrink-0">
              <MessageCircle size={16} className="text-zinc-400" />
              <h2 className="text-sm font-semibold text-white">
                Task Discussion
                <span className="ml-2 text-xs font-normal text-zinc-500">({messages.length})</span>
              </h2>
            </div>

            <div ref={containerRef}
              className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
            >
              {messages.length == 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <MessageCircle size={32} className="text-zinc-700 mb-3" />
                  <p className="text-sm text-zinc-500">No comments yet. Be the first!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    msg={msg}
                    isOwn={msg.user_id === author.id}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {file && (
              <div className="px-5 pb-2 shrink-0">
                <FilePreview file={file} onRemove={() => {
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                }} />
              </div>
            )}

            <div className="px-5 py-4 border-t border-zinc-800 shrink-0">
              <div className="flex items-end gap-2">
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

                <div className="flex flex-col gap-2 pb-0.5">
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
                    accept="image/jpeg,image/png,.pdf,.txt"
                    multiple={false}
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <button
                    onClick={handlePost}
                    disabled={!input.trim() && !file}
                    className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-zinc-700 mt-2">
                Enter to send · Shift+Enter for new line · Attach images or .docx files
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {task && <TaskInfoCard task={task} onUpdate={handleUpdateTask} />}
          </div>

        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
