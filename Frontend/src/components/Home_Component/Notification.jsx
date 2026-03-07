import React, { useEffect, useState } from "react";
import socket from "../../socket/socket.js";
import { Bell, Check, X } from "lucide-react";
import api from "../../api/api.js";
import toast from "react-hot-toast";

const Notification = () => {

  const [notifications, setNotifications] = useState([]);

  // fetch existing invites from backend
  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const res = await api.get("/invites");
        setNotifications(res.data.data);
        console.log(res);

      } catch (err) {
        toast.error(err.message);
      }
    };

    fetchInvites();
  }, []);

  useEffect(() => {

    const handleInvite = (invite) => {
      console.log(invite);
      setNotifications((prev) => [invite, ...prev]);
      
      toast.success(`New invite from ${invite.from}`);
    };

    socket.on("invite_received", handleInvite);

    return () => {
      socket.off("invite_received", handleInvite);
    };

  }, []);

  // accept invite
  const acceptInvite = async (id) => {
    try {
      await api.post(`/invite/${id}/accept`);

      setNotifications((prev) =>
        prev.filter((n) => n.id !== id)
      );

      toast.success("Joined workspace");
    } catch (err) {
      toast.error("Failed to accept invite");
    }
  };

  // reject invite
  const rejectInvite = async (id) => {
    try {
      await api.post(`/orgs/invite/${id}/reject`);

      setNotifications((prev) =>
        prev.filter((n) => n.id !== id)
      );

      toast.success("Invite rejected");
    } catch (err) {
      toast.error("Failed to reject invite");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-12 py-10">

      <div className="flex items-center gap-3 mb-8">
        <Bell size={22} className="text-blue-500"/>
        <h1 className="text-2xl font-semibold">Notifications</h1>
      </div>

      {notifications.length === 0 && (
        <div className="border border-zinc-800 rounded-xl p-10 text-center text-zinc-400">
          No notifications
        </div>
      )}

      <div className="space-y-4">

        {notifications.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between border border-zinc-800 bg-zinc-900 rounded-xl p-5 hover:border-zinc-600 transition"
          >

            <div>
              <p className="font-medium">
                Workspace Invite
              </p>

              <p className="text-sm text-zinc-400 mt-1">
                {invite.from} invited you to join{" "}
                <span className="text-blue-400">{invite.orgName}</span>
              </p>
            </div>

            <div className="flex gap-3">

              <button
                onClick={() => acceptInvite(invite.id)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm"
              >
                <Check size={16}/>
                Accept
              </button>

              <button
                onClick={() => rejectInvite(invite.id)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm"
              >
                <X size={16}/>
                Reject
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
};

export default Notification;