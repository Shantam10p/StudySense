// src/components/ConfirmModal.tsx

type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-[#131313] border border-[#3a3a3a] shadow-2xl shadow-black/50 px-7 py-5">

        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#cdc0ec]/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#cdc0ec] text-xl">delete</span>
          </div>
          <h2 className="text-base font-semibold text-[#e7e5e5]">{title}</h2>
        </div>

        {/* Message — aligned under title, not icon */}
        <p className="text-sm text-[#acabaa] leading-relaxed mb-5 ml-[48px]">{message}</p>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#acabaa] bg-[#1f2020] border border-[#3a3a3a] hover:text-[#e7e5e5] hover:border-[#4a4a4a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[#1a1726] bg-[#cdc0ec] hover:bg-[#bfb2de] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
