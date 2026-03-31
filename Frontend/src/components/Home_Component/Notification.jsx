import React, { useEffect, useState } from "react";
import socket from "../../socket/socket.js";
import { Bell, Check, X } from "lucide-react";
import api from "../../api/api.js";
import toast from "react-hot-toast";
import NotificationSkeleton from "./Notification_Component/NotificationSkeleton.jsx"
import { useOutletContext } from "react-router-dom";

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(null);
  const { org } = useOutletContext();
  useEffect(() => {
    if (!org) return;
    const fetchInvites = async () => {
      try {
        const res = await api.get('/invites/data');
        setNotifications(res.data?.data || []);
        // console.log(res.data);
      } catch (err) {
        toast.error(err.message);
      }
    };
    fetchInvites();
  }, [org]);

  useEffect(() => {
    const handleInvite = (payload) => {
      const invite = payload.invite;
      setNotifications((prev) => [invite, ...prev]);
      toast.success(`New invite from ${invite.from}`);
    };

    socket.on("invite_received", handleInvite);
    return () => socket.off("invite_received", handleInvite);
  }, []);

  const acceptInvite = async (invite) => {
    try {
      setLoading(invite.id);
      const res = await api.post(`/invites/${invite.id}/accept`);
      setNotifications((prev) => prev.filter((n) => n.id !== invite.id));
      toast.success("Joined workspace");
    } catch (err) {
      toast.error("Failed to accept invite");
    } finally {
      setLoading(null);
    }
  };

  const rejectInvite = async (invite) => {
    try {
      setLoading(invite.id);
      const res = await api.post(`/invites/${invite.id}/reject`);
      setNotifications((prev) => prev.filter((n) => n.id !== invite.id));
      toast.success("Invite rejected");
      setLoading(null);
    } catch (err) {
      toast.error("Failed to reject invite");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-12 py-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Bell size={22} className="text-blue-500" />
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {notifications.length > 0 && (
          <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-blue-600 rounded-full">
            {notifications.length}
          </span>
        )}
      </div>

      {loading ? (
        <NotificationSkeleton rows={3} />
      ) : notifications.length === 0 ? (
        <div className="border border-zinc-800 rounded-xl p-10 text-center text-zinc-400">
          No notifications
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-xl overflow-hidden">

          <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 bg-zinc-900 border-b border-zinc-800 text-xs font-medium text-zinc-400 uppercase tracking-wider">
            <span>Message</span>
            <span className="w-24 text-center">Accept</span>
            <span className="w-24 text-center">Reject</span>
          </div>

          {/* Table Rows */}
          {notifications.map((invite, index) => (
            <div
              key={invite.id}
              className={`grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-4 hover:bg-zinc-900/60 transition-colors ${index !== notifications.length - 1 ? "border-b border-zinc-800" : ""
                }`}
            >
              {/* Message */}
              <div>
                <p className="text-[15px] text-zinc-400 mt-0.5">
                  {/* <span className="text-zinc-300">{invite.message}</span> */}
                  <span className="text-blue-400 font-medium">{invite.message}</span>
                </p>
              </div>

              {/* Accept */}
              <button
                onClick={() => acceptInvite(invite)}
                className="w-24 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-green-500 active:scale-95  text-[15px] font-medium transition-all cursor-pointer"
              >
                <Check size={13} />
                Accept
              </button>

              {/* Reject */}
              <button
                onClick={() => rejectInvite(invite)}
                className="w-24 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-red-600 active:scale-95 text-[15px] font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                <X size={13} />
                Reject
              </button>
            </div>
          ))}

        </div>
      )}
    </div>
  );
};

export default Notification;