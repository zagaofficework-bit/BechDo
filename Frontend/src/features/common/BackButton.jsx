import { useNavigate } from "react-router-dom";

export default function BackButton({
  label = "Back",
  className = "",
  fallback = "/",
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate("/");
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`
        group inline-flex items-center gap-2
        px-4 py-2.5 rounded-xl
        bg-white/70 backdrop-blur-md
        border border-slate-200
        text-slate-700 text-sm font-semibold
        shadow-sm hover:shadow-md
        hover:bg-white transition-all duration-200
        active:scale-[0.97]
        ${className}
      `}
    >
      {/* Arrow */}
      <span
        className="
          flex items-center justify-center
          w-6 h-6 rounded-lg
          bg-slate-100 group-hover:bg-[#1132d4]
          text-slate-600 group-hover:text-white
          transition-all duration-200
        "
      >
        ←
      </span>

      <span className="group-hover:translate-x-0.5 transition-transform">
        {label}
      </span>
    </button>
  );
}