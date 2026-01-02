"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Sparkles, Layers, Warehouse } from "lucide-react";
import LoadingOverlay from "@/components/LoadingOverlay";
import SheetCard from "@/components/SheetCard";
import ThemeToggle from "@/components/ThemeToggle";
import { SHEETS, type Category } from "@/lib/sheets";

const CATEGORIES: Category[] = ["Umum", "Finishgood", "Material"];

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[150px] rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 shadow-soft animate-pulse"
        />
      ))}
    </div>
  );
}

export default function Page() {
  const [active, setActive] = useState<Category>("Umum");
  const [q, setQ] = useState("");
  const [opening, setOpening] = useState(false);
  const [fakeLoading, setFakeLoading] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return SHEETS.filter((s) => {
      if (s.category !== active) return false;
      if (!query) return true;
      const hay = [
        s.title,
        s.description ?? "",
        (s.tags ?? []).join(" "),
        s.updatedAt ?? ""
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [active, q]);

  const onOpen = (url: string) => {
    setOpening(true);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => setOpening(false), 700);
  };

  const onSwitchCategory = (c: Category) => {
    setActive(c);
    setQ("");
    setFakeLoading(true);
    setTimeout(() => setFakeLoading(false), 350);
  };

  return (
    <div className="min-h-screen">
      <LoadingOverlay show={opening} />

      {/* Background accent */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl opacity-30 bg-zinc-400 dark:bg-zinc-700" />
        <div className="absolute top-32 right-10 h-72 w-72 rounded-full blur-3xl opacity-20 bg-zinc-300 dark:bg-zinc-800" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/70 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/50 px-4 py-2 shadow-soft">
              <Warehouse className="h-4 w-4" />
              <span className="text-sm font-semibold">Warehouse Spreadsheet Hub</span>
              <span className="text-xs text-zinc-600 dark:text-zinc-300">
                • akses cepat & rapi
              </span>
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Satu pintu untuk semua spreadsheet Warehouse.
            </h1>
            <p className="mt-3 text-zinc-600 dark:text-zinc-300">
              Pilih kategori, cari dokumen, klik “Buka” dan spreadsheet akan terbuka di tab baru.
              UI dibuat nyaman dipakai harian oleh tim.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              <Sparkles className="h-4 w-4" />
              Loading + dark mode + search
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 grid gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Cari di kategori ${active}…`}
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 px-10 py-3 text-sm shadow-soft outline-none focus:ring-2 focus:ring-zinc-400/40"
              />
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-2 shadow-soft">
              <Layers className="h-4 w-4 text-zinc-500 ml-2" />
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => onSwitchCategory(c)}
                  className={[
                    "rounded-xl px-3 py-2 text-sm font-semibold transition",
                    c === active
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  ].join(" ")}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300">
            <span>
              Menampilkan <b>{filtered.length}</b> link di kategori <b>{active}</b>
            </span>
            <span className="hidden sm:inline">Tip: pakai keyword tag / judul</span>
          </div>
        </div>

        {/* List */}
        <div className="mt-6">
          {fakeLoading ? (
            <SkeletonGrid />
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-8 shadow-soft"
            >
              <p className="text-lg font-bold">Tidak ada hasil.</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                Coba kata kunci lain atau tambahkan link di{" "}
                <code className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800">lib/sheets.ts</code>.
              </p>
            </motion.div>
          ) : (
            <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filtered.map((item) => (
                  <SheetCard key={item.id} item={item} onOpen={onOpen} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 text-xs text-zinc-500 dark:text-zinc-400">
          <p>
            Dibuat untuk akses cepat spreadsheet. Kalau kamu mau, berikutnya bisa ditambah:
            role-based access (login Google), audit click, analytics, dan pengaturan link via CMS.
          </p>
        </div>
      </div>
    </div>
  );
}
