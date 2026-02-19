import { useState } from "react";
import {
  LayoutDashboard,
  Folder,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import building from '../assets/img/building.png';
import { Link, Outlet } from 'react-router-dom';

const navItems = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard",path:"/user/dashboard" },
  { icon: <Folder size={20} />, label: "Projects",path: "/user/dashboard/projects"},
  { icon: <Users size={20} />, label: "Team",path:"/user/dashboard/team" },
  { icon: <Settings size={20} />, label: "Settings",path:"/user/dashboard/settings" },
];

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("drawer") === "true";
  });

  const toggleDrawer = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("drawer", newState);
  };


  return (
    <div className="text-white min-h-screen flex">

      {/* SIDEBAR */}
      <motion.aside
        initial={{ width: collapsed ? 120 : 280 }}
        animate={{ width: collapsed ? 120 : 280 }}
        transition={{ duration: 0.35 }}
        className="fixed left-0 top-0 h-screen bg-[#18181b] border-r border-gray-800 flex flex-col"
      >
        <div className="mt-8 px-6 pb-6 border-b border-gray-800">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                {/* Icon */}
                <div className="w-10 h-10 bg-[#27272a] flex items-center justify-center rounded-md">
                  <img className="w-8 h-8" src={building} alt="workspace" />
                </div>

                {/* Text */}
                <div>
                  <h1 className="text-[14px] leading-3.5 font-semibold text-white ">
                    coinwise
                  </h1>
                  <p className="mt-1 text-[14px] text-gray-400 text-nowrap">
                    1 workspace
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </motion.aside>

      <motion.div
        initial={{ marginLeft: collapsed ? 120 : 280 }}
        animate={{ marginLeft: collapsed ? 120 : 280 }}
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
        <Outlet/> {/* render child route here this is production based route handling*/}
      </motion.div>
    </div>
  );
}

export default DashboardLayout;