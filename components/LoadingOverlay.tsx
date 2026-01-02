"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function LoadingOverlay({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 8, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0, scale: 0.98 }}
            className="rounded-2xl bg-white/90 dark:bg-zinc-900/90 px-6 py-5 shadow-soft border border-zinc-200/60 dark:border-zinc-800"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div>
                <p className="font-semibold leading-tight">Membuka spreadsheet…</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Pastikan kamu login akun Google yang benar.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
