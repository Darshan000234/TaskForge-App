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
  AlertTriangle,
  CheckCircle,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import plus from '../../assets/img/plus.png';
import folder_open_regular from '../../assets/img/folder_open_regular.png';

const navItems = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard" },
  { icon: <Folder size={20} />, label: "Projects" },
  { icon: <Users size={20} />, label: "Team" },
  { icon: <Settings size={20} />, label: "Settings" },
];

const stats = [
  { title: "Total Projects", icon: <Folder size={22} /> },
  { title: "Completed Projects", icon: <CheckCircle size={22} /> },
  { title: "My Tasks", icon: <User size={22} /> },
  { title: "Overdue", icon: <AlertTriangle size={22} /> },
];

const sideCards = [
  { title: "My Tasks", color: "bg-green-600" },
  { title: "Overdue", color: "bg-red-600" },
  { title: "In Progress", color: "bg-blue-600" },
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
              {item.icon}
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
                  px-8 py-7
                  flex items-center justify-between
                  text-[14px] leading-5
                "
              >
                <div>
                  <p className="text-zinc-400">
                    {item.title}
                  </p>

                  <h3 className="text-[24px] leading-7.5 mt-3 text-white">
                    0
                  </h3>
                </div>

                <div className="w-12 h-12 bg-[#232326] rounded-lg flex items-center justify-center">
                  {item.icon}
                </div>
              </div>
            ))}
          </div>


          {/* Main Grid */}
          <div className="grid grid-cols-3 gap-10">
            <div className="col-span-2 bg-[#151518] border border-gray-800 rounded-[5px] p-10 h-95 flex flex-col items-center justify-center text-gray-400">
              <img className="px-4 py-4 w-20 h-20 bg-[#27272a] rounded-full" src={folder_open_regular} alt="" />
              <p className="mt-6">No projects yet</p>
              <button className="mt-4 flex items-center gap-2 px-7 py-3 text-[16px] rounded bg-linear-to-br from-blue-500 to-blue-600 text-white space-x-2 hover:opacity-90 transition">
                Create your First Project
              </button>
            </div>

            <div className="space-y-8">
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
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        
        <div className="flex items-center gap-3">
          {/* Icon Box */}
          <div className="w-9 h-9 rounded-lg bg-[#232326] flex items-center justify-center">
            {/* Put your icon here */}
          </div>

          <h4 className="text-[14px] leading-5 text-white">
            {item.title}
          </h4>
        </div>

        {/* Badge */}
        <span
          className={`
            text-[12px]
            px-3 py-0.75
            rounded-md
            ${item.color}
            text-white
          `}
        >
          0
        </span>
      </div>

      {/* Body */}
      <div className="py-10 flex items-center justify-center">
        <p className="text-zinc-400 text-[14px] leading-5">
          No {item.title.toLowerCase()}
        </p>
      </div>
    </div>
  ))}
</div>

          </div>

          {/* Recent Activity */}
          <div className="bg-[#151518] border border-gray-800 rounded-xl p-10 h-60 flex items-center justify-center text-gray-400">
            <Clock size={40} />
            <p className="ml-4">No recent activity</p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
