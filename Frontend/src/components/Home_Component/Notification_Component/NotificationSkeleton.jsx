const NotificationSkeleton = ({ rows = 3 }) => {
  return (
    <div className="min-h-screen bg-black text-white px-12 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-5.5 h-5.5 rounded-full bg-zinc-800 animate-pulse" />
        <div className="w-36 h-6 rounded bg-zinc-800 animate-pulse" />
        <div className="w-7 h-5 rounded-full bg-zinc-800 animate-pulse" />
      </div>

      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 bg-zinc-900 border-b border-zinc-800">
          <div className="w-20 h-3 rounded bg-zinc-700 animate-pulse" />
          <div className="w-14 h-3 rounded bg-zinc-700 animate-pulse" />
          <div className="w-14 h-3 rounded bg-zinc-700 animate-pulse" />
        </div>

        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={`grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-4 ${
              i !== rows - 1 ? "border-b border-zinc-800" : ""
            }`}
          >
            <div className="w-3/4 h-4 rounded bg-zinc-800 animate-pulse" />
            <div className="w-24 h-9 rounded-lg bg-zinc-800 animate-pulse" />
            <div className="w-24 h-9 rounded-lg bg-zinc-800 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationSkeleton;