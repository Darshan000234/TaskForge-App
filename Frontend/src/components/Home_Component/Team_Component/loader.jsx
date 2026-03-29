const Loader = ({ rows = 5 }) => {
  return (
    <div className="w-280 mt-8 border border-zinc-800 rounded-xl overflow-hidden animate-pulse">
      {/* Table header skeleton */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex gap-24">
        <div className="h-3 w-12 bg-zinc-700 rounded" />
        <div className="h-3 w-16 bg-zinc-700 rounded" />
        <div className="h-3 w-12 bg-zinc-700 rounded" />
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-6 border-b border-zinc-800 px-6 py-4"
        >
          {/* Avatar circle */}
          <div className="w-9 h-9 rounded-full bg-zinc-700 shrink-0" />

          {/* Email placeholder */}
          <div
            className="h-3 bg-zinc-700 rounded"
            style={{ width: `${140 + (i % 4) * 20}px` }}
          />

          {/* Badge placeholder */}
          <div className="ml-auto h-6 w-16 bg-zinc-800 rounded-md" />
        </div>
      ))}
    </div>
  );
};

export default Loader;