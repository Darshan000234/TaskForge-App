import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Folder,
  Users,
  Settings,
  Search,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import building from '../assets/img/building.png';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import plus from '../assets/img/plus1.png';
import minus from '../assets/img/minus.png';
import notification from '../assets/img/inbox.png';
import toast from "react-hot-toast";
import api from "../api/api.js";
import socket from "../socket/socket.js";
import CreateOrgModal from "./CreateOrgModal.jsx";
import Setting from "./Home_Component/Settings.jsx";
import { getAccessToken } from "../utils/authStore.js";

const navItems = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/user/dashboard" },
  { icon: <Folder size={20} />, label: "Projects", path: "/user/dashboard/projects" },
  { icon: <Users size={20} />, label: "Team", path: "/user/dashboard/team" },
  { icon: <Settings size={20} />, label: "Settings", path: "/user/dashboard/settings" },
];

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [show, setShow] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [activeorg, setActiveOrg] = useState(null);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  const handleActiveOrg = async (item) => {
    setShow(false);
    if (activeorg?.id === item.id) return;
    setActiveOrg(item);
    try {
      await api.get(`/orgs/activeorgs/${item.id}`);
      socket.emit("join_org", { id: item.id });
      socket.emit("join_org_member", { id: item.id });
    } catch (error) {
      toast.error("Failed to switch org");
    }
  };

  const handleOrgCreated = async (newOrg) => {
    try {
      setOrgs((prev) => [...prev, newOrg]);
      setActiveOrg(newOrg);
      await api.get(`/orgs/activeorgs/${newOrg.id}`);
      socket.emit("join_org", { id: newOrg.id });
      socket.emit("join_org_member", { id: newOrg.id });
    } catch (error) {
      console.log(error.response?.data?.message);
      toast.error("something went wrong");
    }
  };

  useEffect(() => {
    socket.auth = {
      token: getAccessToken()
    };
    socket.connect();

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const org = await api.get("/orgs");
        setOrgs(org.data);
        const res = await api.get('/orgs/activeorgs');
        socket.emit("join_org", { id: res.data.id });
        socket.emit("join_org_member", { id: res.data.id });
        setActiveOrg(res.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch organizations");
      }
    };
    fetchOrgs();
  }, [])

  useEffect(() => {
    const handleCreated = async (payload) => {
      const newOrg = payload.org;
      setOrgs((prev) => [...prev, newOrg]);
    }
    const handleOrgDeleted = () => {
      navigate('/user/dashboard', { replace: true });
    }
    socket.on("joined_org", handleCreated);
    socket.on("org deleted", handleOrgDeleted);
    return () => {
      socket.off("joined_org", handleCreated);
      socket.off("org deleted", handleOrgDeleted);
    }
  }, [])

  const toggleDrawer = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    setShow(newState ? false : show);
  };

  const handleDeleteOrg = async (orgId) => {
    if (orgs.length <= 1) {
      toast.error("You must have at least one organization");
      return;
    }
    try {

      const res = await api.delete(`/orgs/delete/${orgId}`);
      const updated = orgs.filter((o) => o.id !== orgId);
      setOrgs(updated);

      if (activeorg?.id === orgId) {
        const newActive = updated[0];
        setActiveOrg(newActive);
        await api.get(`/orgs/activeorgs/${newActive.id}`);
        socket.emit("join_org", { id: newActive.id });
        socket.emit("join_org_member", { id: newActive.id });
      }
      toast.success("Organization deleted");
    } catch (err) {
      console.log("ERROR:", err.response?.status, err.response?.data);
      toast.error("Delete failed");
    }
  };

  // console.log(activeorg);
  
  return (
    <div className="text-white min-h-screen flex">

      <motion.aside
        initial={{ width: collapsed ? 100 : 320 }}
        animate={{ width: collapsed ? 100 : 320 }}
        transition={{ duration: 0.35 }}
        className="fixed left-0 top-0 h-screen bg-[#18181b] border-r border-gray-800 flex flex-col"
      >
        <div className="m-4 relative h-10">
          <button onClick={(e) => {
            e.stopPropagation();
            setShow(!show);
          }} className="w-full flex items-center justify-between p-3 h-auto text-left rounded hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer">

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-3 w-full"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={building}
                      alt="coinwise"
                      className="w-8 h-8 rounded shadow"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                        {activeorg ? activeorg.name : "not created"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                        1 workspace
                      </p>
                    </div>
                  </div>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-4 h-4 text-gray-500 dark:text-zinc-400 shrink-0 transition-transform ${show ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m6 9 6 6 6-6"
                    />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {show && !collapsed && (

            <div className="absolute left-0 mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50">
              <div className="px-4 pt-4 pb-2">
                <p className="text-xs tracking-wider text-zinc-400 uppercase">
                  Workspaces
                </p>
              </div>

              {orgs.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleActiveOrg(item)}
                  className="px-2 pb-2"
                >
                  <div className="relative px-3 py-2 rounded-md hover:bg-zinc-800 cursor-pointer transition group">

                    <div className="absolute top-2 right-2 flex items-center gap-2 transition">

                      {activeorg && activeorg.id === item.id && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <div className="opacity-0 group-hover:opacity-100">
                        {orgs.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrg(item.id);
                            }}
                            title="Delete Organization"
                            className="p-1.5 rounded-md bg-zinc-800 
                        hover:bg-zinc-700 
                        text-zinc-400 hover:text-red-400 
                        transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 pr-12">
                      <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                        {item.name}
                      </p>

                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Role: {item.role}
                      </p>

                      <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400 mt-1">
                        <span>Members: {item.member_count}</span>
                        <span>
                          Created:{" "}
                          {new Date(item.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t border-zinc-800" />
              <div className="px-2 py-2">
                <div
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 cursor-pointer transition text-blue-500"
                  onClick={() => {
                    setShow(false);
                    setShowCreateOrg(true);
                  }}
                >
                  <p className="text-sm font-medium">+ Create Workspace</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <nav
          className={`flex-1 py-8 space-y-2 ${collapsed ? "px-2" : "px-6"}`}
        >
          <div>

            {navItems.map((item) =>
              item.label === "Settings" ? (
                <motion.div
                  key={item.path}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setShowSettings(true)}
                  title={collapsed ? item.label : ""}
                  className={`
                    h-10 rounded-lg hover:bg-[#222225] cursor-pointer
                    flex items-center
                    ${collapsed ? "justify-center" : "gap-3 px-2"}
                  `}
                >
                  {item.icon}
                  {!collapsed && <span className="text-[16px]">{item.label}</span>}
                </motion.div>
              ) : (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    title={collapsed ? item.label : ""}
                    className={`
                      h-10 rounded-lg hover:bg-[#222225] cursor-pointer
                      flex items-center
                      ${collapsed ? "justify-center" : "gap-3 px-2"}
                    `}
                  >
                    {item.icon}
                    {!collapsed && <span className="text-[16px]">{item.label}</span>}
                  </motion.div>
                </Link>
              )
            )}
          </div>

          <div className="mt-14 flex flex-col gap-4">
            <Link to="/user/dashboard/task">
              <div
                title={collapsed ? "My Tasks" : ""}
                className={`
        h-10 rounded-lg hover:bg-[#222225] cursor-pointer
        flex items-center
        ${collapsed ? "justify-center" : "gap-3 px-2"}
      `}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344" />
                  <path d="m9 11 3 3L22 4" />
                </svg>

                {!collapsed && (
                  <span className="text-[16px] font-medium text-zinc-300">
                    My Tasks
                  </span>
                )}
              </div>
            </Link>
            
            <Link to="/user/dashboard/notification">
              <div
                title={collapsed ? "Invites" : ""}
                className={`
        h-10 rounded-lg hover:bg-[#222225] cursor-pointer text-[16px] font-medium text-zinc-300
        flex items-center
        ${collapsed ? "justify-center" : "gap-3 px-2"}
      `}
              >
                <img src={notification} className="w-5 h-5" />
                {!collapsed && (
                  <span>
                    Notification
                  </span>
                )}
              </div>
            </Link>

          </div>

        </nav>

        <div className="px-8 pb-6 cursor-pointer">
          <button onClick={toggleDrawer}>
            {collapsed ? <img className="w-6 cursor-pointer" src={plus} alt="plus" /> : <img className="w-5 cursor-pointer" src={minus} alt="minus" />}
          </button>
        </div>
      </motion.aside>

      <motion.div
        initial={{ marginLeft: collapsed ? 100 : 320 }}
        animate={{ marginLeft: collapsed ? 100 : 320 }}
        transition={{ duration: 0.35 }}
        className="flex-1"
      >
        {/* <div className="h-20 flex items-center justify-between px-12 border-b border-gray-800 bg-[#18181b] sticky top-0 z-10">
          <div className="flex items-center gap-3 bg-[#232326] px-4 py-2 rounded-lg w-105 hover:border border-blue-400">
            <Search size={18} className="text-gray-400" />
            <input
              placeholder="Search projects, tasks..."
              className="bg-transparent outline-none w-full"
            />
          </div>
        </div> */}
        <Outlet context={{ org: activeorg }} />
      </motion.div>
      <CreateOrgModal
        isOpen={showCreateOrg}
        onClose={() => setShowCreateOrg(false)}
        onCreated={handleOrgCreated}
      />
      <Setting isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default DashboardLayout;