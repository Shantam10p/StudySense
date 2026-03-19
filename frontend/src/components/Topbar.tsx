import { useState } from "react";

import { Button } from "./Button";
import { UserSidebar } from "./UserSidebar";

type TopBarProps = {
  onNewPlan?: () => void;
  onLogout?: () => void;
};

export function TopBar({ onNewPlan, onLogout }: TopBarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1440px] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.118a7.5 7.5 0 0 1 15 0" />
              </svg>
            </button>

            <div className="text-xl font-semibold text-slate-900">
              StudySense
            </div>
          </div>

          <Button onClick={onNewPlan}>
            New Plan
          </Button>
        </div>
      </header>

      <UserSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={onLogout}
      />
    </>
  );
}