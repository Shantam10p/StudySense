import { useNavigate, useLocation } from "react-router-dom";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col py-6 bg-[#131313] w-64 z-50">
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#4b4166] rounded-xl flex items-center justify-center">
          <svg
            className="w-6 h-6 text-[#cdc0ec]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-[#cdc0ec]">Sensei</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#acabaa] opacity-60">The Digital Curator</p>
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
          onClick={() => navigate("/plan")}
          className={`w-full text-left px-4 py-3 transition-colors duration-300 flex items-center gap-3 font-medium text-sm tracking-tight rounded-lg ${
            isActive("/plan")
              ? "bg-[#4b4166]/40 text-[#cdc0ec]"
              : "text-[#acabaa] hover:text-[#e7e5e5] hover:bg-[#1f2020]"
          }`}
        >
          <span className="material-symbols-outlined">event_note</span>
          My plan
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
          onClick={() => navigate("/topics")}
          className={`w-full text-left px-4 py-3 transition-colors duration-300 flex items-center gap-3 font-medium text-sm tracking-tight rounded-lg ${
            isActive("/topics")
              ? "bg-[#4b4166]/40 text-[#cdc0ec]"
              : "text-[#acabaa] hover:text-[#e7e5e5] hover:bg-[#1f2020]"
          }`}
        >
          <span className="material-symbols-outlined">topic</span>
          Topics
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
        <div className="p-4 bg-[#0e0e0e] rounded-xl border border-[#484848]/10 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#4b4166] rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[#cdc0ec]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z"/>
              </svg>
            </div>
            <span className="text-xs font-semibold text-[#cdc0ec]">Status: Focused</span>
          </div>
          <p className="text-[11px] text-[#acabaa] leading-relaxed">
            "Knowledge is a garden that must be tended daily."
          </p>
        </div>

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
