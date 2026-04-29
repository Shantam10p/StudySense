import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import senseiLogo from "../assets/sensei_face.png";
import { useSidebar } from "../context/SidebarContext";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, close } = useSidebar();
  const [userName, setUserName] = useState("Student");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("auth_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name || "Student");
        setUserEmail(user.email || "");
      }
    } catch {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    close();
    navigate("/");
  };

  const handleNav = (path: string) => {
    close();
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;
  const isPlanGenerating = !!sessionStorage.getItem("sensei_pending_plan");

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-full flex flex-col bg-[#131313] w-64 z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="px-6 pt-8 pb-6 flex items-center gap-3 border-b border-[#2a2a2a]">
          <img src={senseiLogo} alt="Sensei" className="w-11 h-11 shrink-0" />
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-[#cdc0ec] leading-none">Sensei</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#acabaa]/50 mt-1">AI Study Guide</p>
          </div>
        </div>

        {/* User block — mobile only */}
        <div className="md:hidden flex items-center gap-3 px-6 pt-5 pb-4 border-b border-[#2a2a2a]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#cdc0ec] to-[#9b8ec4] flex items-center justify-center shrink-0 shadow-md shadow-[#cdc0ec]/10">
            <span className="text-[#2a2040] text-xs font-bold tracking-wide">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#e7e5e5] truncate leading-tight">{userName}</p>
            {userEmail && (
              <p className="text-[10px] text-[#acabaa]/70 truncate mt-0.5">{userEmail}</p>
            )}
          </div>
        </div>

        {/* Nav links — desktop only */}
        <nav className="hidden md:flex flex-col flex-1 px-4 pt-4 space-y-1">
          <button
            onClick={() => handleNav("/dashboard")}
            disabled={isPlanGenerating}
            className={`w-full text-left px-4 py-3 transition-colors duration-300 flex items-center gap-3 font-medium text-sm tracking-tight rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${
              isActive("/dashboard")
                ? "bg-[#4b4166]/40 text-[#cdc0ec]"
                : "text-[#acabaa] hover:text-[#e7e5e5] hover:bg-[#1f2020]"
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </button>

          <button
            onClick={() => handleNav("/courses")}
            disabled={isPlanGenerating}
            className={`w-full text-left px-4 py-3 transition-colors duration-300 flex items-center gap-3 font-medium text-sm tracking-tight rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${
              isActive("/courses")
                ? "bg-[#4b4166]/40 text-[#cdc0ec]"
                : "text-[#acabaa] hover:text-[#e7e5e5] hover:bg-[#1f2020]"
            }`}
          >
            <span className="material-symbols-outlined">menu_book</span>
            My Courses
          </button>

          <button
            onClick={() => handleNav("/progress")}
            disabled={isPlanGenerating}
            className={`w-full text-left px-4 py-3 transition-colors duration-300 flex items-center gap-3 font-medium text-sm tracking-tight rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${
              isActive("/progress")
                ? "bg-[#4b4166]/40 text-[#cdc0ec]"
                : "text-[#acabaa] hover:text-[#e7e5e5] hover:bg-[#1f2020]"
            }`}
          >
            <span className="material-symbols-outlined">analytics</span>
            Progress
          </button>
        </nav>

        {/* Spacer — mobile only (desktop nav has flex-1) */}
        <div className="md:hidden flex-1" />

        {/* Logout */}
        <div className="px-4 pb-4 md:pb-8 mb-24 md:mb-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 md:py-2.5 rounded-lg text-[#acabaa] hover:text-[#ec7c8a] hover:bg-[#ec7c8a]/8 transition-all duration-200 text-base md:text-sm font-medium group"
          >
            <span className="material-symbols-outlined text-xl md:text-lg group-hover:translate-x-0.5 transition-transform duration-200">logout</span>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
