import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

function useClickOutside(ref, cb) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        cb();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

const CustomSelect = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useClickOutside(ref, () => setOpen(false));

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-1">
        {label}
      </p>

      <button
        onClick={() => setOpen((v) => !v)}
        className="
          flex items-center justify-between w-full
          px-3 py-1.5 rounded-lg
          bg-zinc-800 border border-zinc-700
          text-sm text-zinc-200 font-medium
          hover:border-zinc-500 transition
          focus:outline-none focus:border-zinc-500
        "
      >
        <span>
          <span className="text-zinc-400 font-normal">
            {label}:&nbsp;
          </span>
          {current ? current.label : "All"}
        </span>

        <ChevronDown
          size={13}
          className={`transition-transform ${
            open ? "rotate-180" : ""
          } text-zinc-500`}
        />
      </button>

      {open && (
        <div
          className="
            absolute left-0 top-full mt-1.5 z-50 w-full
            bg-zinc-900 border border-zinc-700 rounded-xl
            shadow-2xl overflow-hidden py-1
          "
        >
          <button
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`
              w-full text-left px-4 py-2 text-sm font-semibold
              ${!value
                ? "bg-zinc-800 text-white"
                : "text-white hover:bg-zinc-800/60"}
            `}
          >
            All {label}
          </button>

          <div className="border-t border-zinc-800 my-1" />

          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`
                w-full text-left px-4 py-2 text-sm transition
                ${value === o.value
                  ? "bg-zinc-800 text-white font-medium"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"}
              `}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;