import plus from '../../assets/img/plus.png';
import folder from '../../assets/img/folder.png';
import blue_folder from '../../assets/img/blue_folder.png';
import checked from '../../assets/img/checked.png';
import purple_team from '../../assets/img/purple_team.png';
import orange_warn from '../../assets/img/orange_warn.png';
import user from '../../assets/img/user.png';
import warning from '../../assets/img/warning.png';
import clock from '../../assets/img/clock.png';

const Dashboard = () => {
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
  return (
    <div>
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
    </div>
  )
}

export default Dashboard;
