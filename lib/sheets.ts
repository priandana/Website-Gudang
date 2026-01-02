export type Category = "Umum" | "Finishgood" | "Material";

export type SheetLink = {
  id: string;
  title: string;
  description?: string;
  category: Category;
  url: string;
  tags?: string[];
  updatedAt?: string; // optional: "2026-01-02"
};

export const SHEETS: SheetLink[] = [
  // ===== UMUM =====
  {
    id: "u-1",
    title: "Daily Warehouse Dashboard",
    description: "Ringkasan inbound/outbound harian + KPI.",
    category: "Umum",
    url: "https://docs.google.com/spreadsheets/d/XXXX",
    tags: ["dashboard", "harian"],
    updatedAt: "2026-01-02"
  },
  {
    id: "u-2",
    title: "Roster & Shift",
    description: "Jadwal shift + PIC.",
    category: "Umum",
    url: "https://docs.google.com/spreadsheets/d/YYYY",
    tags: ["shift", "pic"]
  },

  // ===== FINISHGOOD =====
  {
    id: "fg-1",
    title: "Stock FG - Master",
    description: "Master stok Finishgood per lokasi.",
    category: "Finishgood",
    url: "https://docs.google.com/spreadsheets/d/AAAA",
    tags: ["stock", "master"]
  },

  // ===== MATERIAL =====
  {
    id: "m-1",
    title: "Material Inbound Tracker",
    description: "Tracking kedatangan material + status QC.",
    category: "Material",
    url: "https://docs.google.com/spreadsheets/d/BBBB",
    tags: ["inbound", "qc"]
  }
];
