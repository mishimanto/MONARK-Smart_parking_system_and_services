import { RiCheckboxCircleLine, RiCloseLine, RiErrorWarningLine } from "react-icons/ri";
import toast from "react-hot-toast";

const themes = {
  success: {
    shell: "bg-[#b7efca]",
    panel: "bg-[#8ce7ab]",
    overlay: "bg-white/20",
    icon: "text-[#45b973]",
    title: "text-[#111827]",
    message: "text-[#253243]",
  },
  error: {
    shell: "bg-[#f7c2cb]",
    panel: "bg-[#f2a1b1]",
    overlay: "bg-white/20",
    icon: "text-[#cf3950]",
    title: "text-[#111827]",
    message: "text-[#253243]",
  },
};

export default function ToastBody({ type, title, message, toastId, visible = true }) {
  const Icon = type === "success" ? RiCheckboxCircleLine : RiErrorWarningLine;
  const theme = themes[type] || themes.success;

  return (
    <div
      className={[
        "grid min-h-16.5 w-[288px] max-w-[calc(100vw-28px)] grid-cols-[50px_1fr] overflow-hidden",
        "border border-black/5 shadow-[0_20px_38px_rgba(7,17,31,0.24)] transition duration-200 ease-out",
        visible ? "translate-y-0 scale-100 opacity-100" : "-translate-y-2 scale-[0.98] opacity-0",
        theme.shell,
      ].join(" ")}
    >
      <span className={`relative flex items-center justify-center overflow-hidden ${theme.panel}`}>
        <span className={`absolute -left-7 -top-4 h-24.5 w-11.5 rotate-[-22deg] ${theme.overlay}`} />
        <span className={`relative z-1 inline-flex items-center justify-center rounded-full text-[38px] ${theme.icon}`}>
          <Icon />
        </span>
      </span>

      <div className={`relative flex min-h-16.5 items-center px-1 py-3.25 ${theme.panel}`}>
        <div className="relative z-1 min-w-0">
          <strong className={`block text-sm font-extrabold leading-[1.15] text-gray-700`}>{title}</strong>
          {message && (
            <span className={`mt-1 block max-w-45 text-xs leading-[1.35] ${theme.message}`}>
              {message}
            </span>
          )}
        </div>
        <button
          type="button"
          className="absolute right-2 top-2 z-2 inline-flex h-5.5 w-5.5 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-[#253243] transition hover:bg-black/10 hover:text-[#111827]"
          onClick={() => toast.dismiss(toastId)}
          aria-label="Dismiss notification"
        >
          <RiCloseLine />
        </button>
      </div>
    </div>
  );
}
