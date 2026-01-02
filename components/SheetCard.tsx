"use client";

import { motion } from "framer-motion";
import { ExternalLink, Tag } from "lucide-react";
import type { SheetLink } from "@/lib/sheets";

export default function SheetCard({
  item,
  onOpen
}: {
  item: SheetLink;
  onOpen: (url: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="group rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 shadow-soft hover:shadow-md transition-shadow"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold leading-snug">{item.title}</h3>
            {item.description && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {item.description}
              </p>
            )}
          </div>

          <button
            onClick={() => onOpen(item.url)}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-2 text-sm font-semibold hover:opacity-90"
          >
            Buka <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        {(item.tags?.length || item.updatedAt) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {item.updatedAt && (
              <span className="text-xs rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-zinc-600 dark:text-zinc-300">
                Update: {item.updatedAt}
              </span>
            )}
            {item.tags?.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-zinc-700 dark:text-zinc-200"
              >
                <Tag className="h-3 w-3" />
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
