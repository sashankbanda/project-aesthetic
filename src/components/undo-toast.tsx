"use client";
// Undo snackbar — one-tap deletes shouldn't be one-way. Call
// toastUndo("Deleted X", undoFn) after a destructive action; the
// toast shows for 5s above the tab bar with an Undo button.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Undo2 } from "lucide-react";
import { haptic } from "@/lib/fx";

interface Toast {
  id: number;
  message: string;
  undo: () => void;
}

let notify: ((t: Toast) => void) | null = null;
let seq = 0;

export function toastUndo(message: string, undo: () => void) {
  notify?.({ id: ++seq, message, undo });
}

export default function UndoToast() {
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    notify = (t) => setToast(t);
    return () => {
      notify = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[110] flex justify-center px-5 md:bottom-8">
      <div className="rise-in pointer-events-auto flex items-center gap-3 rounded-full border border-line bg-card px-4 py-2.5 shadow-lg">
        <span className="text-[13px] text-dim">{toast.message}</span>
        <button
          onClick={() => {
            haptic();
            toast.undo();
            setToast(null);
          }}
          className="pressable flex items-center gap-1.5 text-[13px] font-bold text-accent2"
        >
          <Undo2 size={14} /> Undo
        </button>
      </div>
    </div>,
    document.body,
  );
}
