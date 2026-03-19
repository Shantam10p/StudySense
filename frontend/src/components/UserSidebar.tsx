type UserSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
};

export function UserSidebar({ isOpen, onClose, onLogout }: UserSidebarProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <aside className="h-full w-72 border-r border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Menu</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>
      </aside>

      <button
        type="button"
        onClick={onClose}
        className="flex-1 bg-slate-900/30"
      />
    </div>
  );
}
