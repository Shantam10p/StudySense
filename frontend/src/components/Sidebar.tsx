import { useNavigate, useLocation } from "react-router-dom";
import senseiLogo from "../assets/sensei.png";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col py-6 bg-[#131313] w-64 z-50">
      <div className="px-6 mb-10 flex items-center gap-3">
        <img src={senseiLogo} alt="Sensei" className="w-14 h-14" />
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-[#cdc0ec]">Sensei</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#acabaa] opacity-60">Your AI Study Guide</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <button
          onClick={() => navigate("/dashboard")}
          className={`w-full text-left px-4 py-3 transition-colors duration-300 flex items-center gap-3 font-medium text-sm tracking-tight rounded-lg ${
            isActive("/dashboard")
              ? "bg-[#4b4166]/40 text-[#cdc0ec]"
              : "text-[#acabaa] hover:text-[#e7e5e5] hover:bg-[#1f2020]"
          }`}
        >
          <span className="material-symbols-outlined">dashboard</span>
          Dashboard
        </button>

        <button
          onClick={() => navigate("/courses")}
          className={`w-full text-left px-4 py-3 transition-colors duration-300 flex items-center gap-3 font-medium text-sm tracking-tight rounded-lg ${
            isActive("/courses")
              ? "bg-[#4b4166]/40 text-[#cdc0ec]"
              : "text-[#acabaa] hover:text-[#e7e5e5] hover:bg-[#1f2020]"
          }`}
        >
          <span className="material-symbols-outlined">menu_book</span>
          My courses
        </button>

        <button
          onClick={() => navigate("/progress")}
          className={`w-full text-left px-4 py-3 transition-colors duration-300 flex items-center gap-3 font-medium text-sm tracking-tight rounded-lg ${
            isActive("/progress")
              ? "bg-[#4b4166]/40 text-[#cdc0ec]"
              : "text-[#acabaa] hover:text-[#e7e5e5] hover:bg-[#1f2020]"
          }`}
        >
          <span className="material-symbols-outlined">analytics</span>
          Progress
        </button>
      </nav>

      <div className="px-4 mt-auto">
        <button
          onClick={() => navigate("/profile")}
          className="w-full text-left text-[#acabaa] hover:text-[#e7e5e5] px-4 py-3 transition-colors duration-300 flex items-center gap-3 font-medium text-sm tracking-tight hover:bg-[#1f2020] rounded-lg"
        >
          <span className="material-symbols-outlined">account_circle</span>
          User Profile
        </button>
      </div>
    </aside>
  );
}
