import { ChevronLeft,ChevronRight } from "lucide-react";

const Pagination = ({ page, total, limit, onChange }) => {
    const pages = Math.ceil(total / limit);
    if (pages <= 1) return null;
    return (
        <div className="flex items-center justify-between px-1 pt-4">
            <span className="text-xs text-zinc-500">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
                <button
                    disabled={page === 1}
                    onClick={() => onChange(page - 1)}
                    className="cursor-pointer p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                    <ChevronLeft size={14} />
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                        key={p}
                        onClick={() => onChange(p)}
                        className={`cursor-pointer w-7 h-7 rounded-lg text-xs font-medium transition ${p === page
                            ? "bg-blue-600 text-white"
                            : "border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
                            }`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    disabled={page === pages}
                    onClick={() => onChange(page + 1)}
                    className="cursor-pointer p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;