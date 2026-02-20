import { useState } from "react";
import {
  LayoutDashboard,
  Folder,
  Users,
  Settings,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import building from '../assets/img/building.png';
import { Link, Outlet } from 'react-router-dom';
import plus from '../assets/img/plus1.png';
import minus from '../assets/img/minus.png';

const navItems = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/user/dashboard" },
  { icon: <Folder size={20} />, label: "Projects", path: "/user/dashboard/projects" },
  { icon: <Users size={20} />, label: "Team", path: "/user/dashboard/team" },
  { icon: <Settings size={20} />, label: "Settings", path: "/user/dashboard/settings" },
];

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [show, setShow] = useState(false);

  const toggleDrawer = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    setShow(newState ? false : show);
  };


  return (
    <div className="text-white min-h-screen flex">

      {/* SIDEBAR */}
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
                        coinwise
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

          {/* WORKSPACE DROPDOWN */}
          {show && !collapsed && (
            <div className="absolute left-0 mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50">

              <div className="px-4 pt-4 pb-2">
                <p className="text-xs tracking-wider text-zinc-400 uppercase">
                  Workspaces
                </p>
              </div>

              <div className="px-2 pb-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-zinc-800 cursor-pointer transition">

                  <div className="flex items-center gap-3">
                    <img
                      src={building}
                      alt="coinwise"
                      className="w-8 h-8 rounded shadow"
                    />

                    <div>
                      <p className="text-sm font-semibold text-white">
                        coinwise
                      </p>
                      <p className="text-xs text-zinc-400">
                        1 members
                      </p>
                    </div>
                  </div>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <div className="border-t border-zinc-800" />

              <div className="px-2 py-2">
                <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 cursor-pointer transition text-blue-500">
                  <p className="text-sm font-medium">
                    + Create Workspace
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 px-6 py-8 space-y-2">
          {navItems.map((item, i) => (
            <Link key={i} to={item.path}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="h-10 flex items-center gap-3 px-2 rounded-lg hover:bg-[#222225] cursor-pointer"
              >
                {item.icon}
                {!collapsed && item.label}
              </motion.div>
            </Link>
          ))}
        </nav>

        <div className="px-6 pb-6">
          <button onClick={toggleDrawer}>
            {collapsed ? <img className="w-5" src={plus} alt="plus"/>: <img className="w-5" src={minus} alt="minus"/>}
          </button>
        </div>
      </motion.aside>

      <motion.div
        initial={{ marginLeft: collapsed ? 100 : 320 }}
        animate={{ marginLeft: collapsed ? 100 : 320 }}
        transition={{ duration: 0.35 }}
        className="flex-1"
      >
        {/* NAVBAR */}
        <div className="h-20 flex items-center justify-between px-12 border-b border-gray-800 bg-[#18181b] sticky top-0 z-10">
          <div className="flex items-center gap-3 bg-[#232326] px-4 py-2 rounded-lg w-105 hover:border border-blue-400">
            <Search size={18} className="text-gray-400" />
            <input
              placeholder="Search projects, tasks..."
              className="bg-transparent outline-none w-full"
            />
          </div>
        </div>
        <Outlet /> {/* render child route here this is production based route handling*/}
      </motion.div>
    </div>
  );
}

export default DashboardLayout;