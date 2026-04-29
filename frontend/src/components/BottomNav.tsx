import { useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "dashboard", path: "/dashboard", fillOnActive: true },
  { label: "Courses", icon: "auto_stories", path: "/courses", fillOnActive: false },
  { label: "Progress", icon: "leaderboard", path: "/progress", fillOnActive: false },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 md:hidden rounded-t-2xl bg-[#131313] shadow-[0_-4px_24px_rgba(0,0,0,0.4)] flex justify-around items-center h-16 px-4">
      {NAV_ITEMS.map(({ label, icon, path, fillOnActive }) => {
        const active = isActive(path);
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center gap-0.5 px-5 py-1 rounded-xl transition-all active:scale-90 ${
              active ? "text-[#cdc0ec]" : "text-[#acabaa]"
            }`}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={active && fillOnActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {icon}
            </span>
            <span className="text-[10px] font-medium tracking-wide uppercase">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
