import { useState } from "react";
import {
  LayoutDashboard,
  Folder,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import plus from '../../assets/img/plus.png';
import folder from '../../assets/img/folder.png';
import blue_folder from '../../assets/img/blue_folder.png';
import checked from '../../assets/img/checked.png';
import purple_team from '../../assets/img/purple_team.png';
import orange_warn from '../../assets/img/orange_warn.png';
import white_folder from '../../assets/img/white_folder.png'
import user from '../../assets/img/user.png';
import warning from '../../assets/img/warning.png';
import clock from '../../assets/img/clock.png';

const navItems = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard" },
  { icon: white_folder, label: "Projects", isImage: true },
  { icon: <Users size={20} />, label: "Team" },
  { icon: <Settings size={20} />, label: "Settings" },
];

const stats = [
  { title: "Total Projects", icon: blue_folder, cs: "rounded-xl bg-blue-500/10 bg-opacity-20", w: "w-8.5" },
  { title: "Completed Projects", icon: checked, cs: "rounded-xl bg-emerald-500/10 bg-opacity-20", w: "w-7" },
  { title: "My Tasks", icon: purple_team, cs: "rounded-xl bg-purple-500/10 bg-opacity-20", w: "w-7" },
  { title: "Overdue", icon: orange_warn, cs: "rounded-xl bg-amber-500/10 bg-opacity-20", w: "w-7" }
];

const sideCards = [
  { title: "My Tasks", cs: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400", src: user },
  { title: "Overdue", cs: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400", src: warning },
  { title: "In Progress", cs: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400", src: clock },
];

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="text-white min-h-screen flex">

      {/* SIDEBAR */}
      <motion.aside
        animate={{ width: collapsed ? 120 : 280 }}
        transition={{ duration: 0.35 }}
        className="fixed left-0 top-0 h-screen bg-[#18181b] border-r border-gray-800 flex flex-col"
      >
        <div className="mt-8 px-6 pb-8 border-b border-gray-800">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <h1 className="text-[16px]">coinwise</h1>
                <p className="text-[12px] text-gray-400 mt-1">
                  1 workspace
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-6 py-8 space-y-4">
          {navItems.map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="h-13 flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#222225] cursor-pointer"
            >
              {item.isImage
                ? <img className="w-7" src={item.icon} alt="" />
                : item.icon
              }
              {!collapsed && item.label}
            </motion.div>
          ))}
        </nav>

        <div className="px-6 pb-6">
          <button onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </motion.aside>

      {/* MAIN */}
      <motion.div
        animate={{ marginLeft: collapsed ? 120 : 280 }}
        transition={{ duration: 0.35 }}
        className="flex-1"
      >
        {/* NAVBAR */}
        <div className="h-20 flex items-center justify-between px-12 border-b border-gray-800 bg-[#18181b] sticky top-0 z-10">
          <div className="flex items-center gap-3 bg-[#232326] px-4 py-2 rounded-lg w-105">
            <Search size={18} className="text-gray-400" />
            <input
              placeholder="Search projects, tasks..."
              className="bg-transparent outline-none w-full"
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className="px-20 pt-12 pb-16 space-y-15">

          {/* Header */}
          <div className="flex justify-between">
            <div>
              <h2 className="text-[22px] leading-7">
                Welcome back, Coder Darsh
              </h2>
              <p className="text-gray-400 mt-2">
                Here's what's happening with your projects today
              </p>
            </div>
            <div>
              <button className="flex items-center gap-2 px-7 py-3 text-[14px] rounded-[5px] bg-linear-to-br from-blue-500 to-blue-600 text-white space-x-2 hover:opacity-90 transition">
                <img className="w-4 h-4" src={plus} alt="" /> New Project
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-10">
            {stats.map((item, i) => (
              <div
                key={i}
                className="
                  bg-linear-to-br 
                  from-zinc-800/70 
                  to-zinc-900/10
                  border border-zinc-800
                  rounded-xl
                  px-8 py-5
                  flex items-center justify-between
                  text-[14px] leading-5
                  hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200
                "
              >
                <div>
                  <p className="text-zinc-400">
                    {item.title}
                  </p>

                  <h3 className="py-2 text-[30px] leading-9 font-bold text-white">
                    0
                  </h3>
                </div>

                <div className={`w-15 h-15 ${item.cs} flex items-center justify-center`}>
                  <img className={`${item.w}`} src={item.icon} alt="" />
                </div>
              </div>
            ))}
          </div>


          {/* Main Grid */}
          {/* Main Grid */}
          <div className="grid grid-cols-3 gap-10">

            {/* LEFT COLUMN (2 cols) */}
            <div className="col-span-2 space-y-10">

              {/* Project Overview */}
              <div className="
      bg-linear-to-br 
      from-zinc-800/60 
      to-zinc-900/20
      border border-zinc-800
      rounded-xl
      overflow-hidden
      hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200
    ">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                  <h3 className="text-white text-[14px]">Project Overview</h3>
                  <button className="text-zinc-400 text-[14px] hover:text-white transition">
                    View all →
                  </button>
                </div>

                {/* Body */}
                <div className="h-90 flex flex-col items-center justify-center text-zinc-400 ">
                  <img
                    className="w-20 h-20 p-4 bg-[#27272a] rounded-full"
                    src={folder}
                    alt=""
                  />
                  <p className="mt-6">No projects yet</p>
                  <button className="mt-4 px-6 py-3 text-[14px] rounded bg-linear-to-br from-blue-500 to-blue-600 text-white hover:opacity-90 transition">
                    Create your First Project
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="
      bg-linear-to-br 
      from-zinc-800/60 
      to-zinc-900/20
      border border-zinc-800
      rounded-xl
      overflow-hidden
      hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200
    ">
                <div className="px-6 py-4 border-b border-zinc-800">
                  <h3 className="text-white text-[14px]">Recent Activity</h3>
                </div>

                <div className="h-60 flex items-center justify-center text-zinc-400">
                  <img
                    className="w-16 h-16 p-3 bg-[#27272a] rounded-full"
                    src={clock}
                    alt=""
                  />
                  <p className="ml-4">No recent activity</p>
                </div>
              </div>

            </div>


            {/* RIGHT COLUMN */}
            <div className="space-y-10">
              {sideCards.map((item, i) => (
                <div
                  key={i}
                  className="
          bg-linear-to-br 
          from-zinc-800/60 
          to-zinc-900/20
          border border-zinc-800
          rounded-xl
          overflow-hidden
          hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200
        "
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#232326] flex items-center justify-center">
                        <img className="w-5" src={item.src} alt="" />
                      </div>

                      <h4 className="text-white text-[14px]">
                        {item.title}
                      </h4>
                    </div>

                    <span className={`px-3 py-0.75 rounded-md text-xs font-medium ${item.cs}`}>
                      0
                    </span>
                  </div>

                  {/* Body */}
                  <div className="h-auto flex items-center justify-center text-zinc-400 text-[14px] p-4 py-10">
                    No {item.title.toLowerCase()}
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </motion.div>
    </div>
  );
}
