"use client";

type DeleteConfirmModalProps = {
  open: boolean;
  itemLabel: string;
  itemType: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  confirmLabel?: string;
  busy?: boolean;
};

export function DeleteConfirmModal({
  open,
  itemLabel,
  itemType,
  onCancel,
  onConfirm,
  confirmLabel = "Delete",
  busy = false,
}: DeleteConfirmModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-rose-300 bg-gradient-to-br from-rose-100 via-white to-rose-50 p-6 shadow-2xl">
        <div className="inline-flex rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          Confirm deletion
        </div>

        <h3 className="mt-4 text-2xl font-semibold text-rose-950">
          Delete {itemType}?
        </h3>

        <p className="mt-3 text-sm text-rose-900/80">
          This will permanently remove{" "}
          <span className="font-semibold text-rose-950">{itemLabel}</span>.
        </p>

        <p className="mt-2 text-sm text-rose-900/70">
          This action cannot be undone.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-900 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              void onConfirm();
            }}
            disabled={busy}
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
