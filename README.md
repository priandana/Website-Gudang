# Pergudangan Hub — PRO

Portal statis PRO untuk menampilkan daftar spreadsheet pergudangan. Siap di-host di Vercel, dengan dukungan **PWA** (bisa install & offline caching).
Aksen **oranye & biru**, sidebar, tampilan tersimpan, import/export, dan lainnya.

## Fitur PRO
- 🔎 Pencarian instan + filter kategori/owner/tag
- 🧠 **Saved Views** (tampilan tersimpan) di localStorage
- ↕️ Sorting (Terbaru, Judul A–Z/Z–A)
- 🧩 **Pagination** (18 item/halaman)
- ✅ Multi-select + **bulk open/copy**
- 🌙 **Tema Gelap/Terang**
- 🧭 **URL sync** (filter/halaman/tema tersimpan di query string untuk dibagikan)
- 📥 **Import JSON/CSV** (lokal) · 📤 **Export JSON/CSV** (hasil filter)
- 🧷 **Preview modal** otomatis untuk Google Sheets
- 📱 **PWA**: manifest + service worker (offline-first aset dasar)
- ⌨️ Shortcut: `/` fokus pencarian, `Ctrl/Cmd + K` fokus pencarian

## Struktur
```
/
├─ index.html
├─ sw.js
├─ manifest.webmanifest
├─ icon-512.png
├─ assets/
│  ├─ styles.css
│  └─ app.js
└─ data/
   └─ spreadsheets.json
```

## Data
Edit `data/spreadsheets.json`:
```json
{
  "items":[
    {
      "id":"stok-gudang-pusat",
      "title":"Stok Harian - Gudang Pusat",
      "description":"Monitoring stok barang.",
      "category":"Stok",
      "owner":"Tim Inventory",
      "tags": ["harian","stok"],
      "link":"https://docs.google.com/spreadsheets/d/...",
      "updated_at":"2025-12-21"
    }
  ]
}
```

### Import CSV
Format kolom: `title,link,category,owner,tags,description,updated_at`
- `tags` gunakan pemisah `|` (contoh: `stok|harian`).
- Semua hasil import tersimpan **lokal** (localStorage) agar aman.

## Deploy ke Vercel
1. Buat repo dan push semua file ini, atau upload ZIP langsung.
2. Di Vercel → **New Project** → pilih repo/ZIP.
3. Framework: **Other** (Static). Build command **kosong**. Output directory `/`.
4. Deploy 🚀

> Catatan: Jika spreadsheet bersifat privat, atur permission-nya di Google/SharePoint sesuai kebutuhan karyawan.

Dibuat: 2026-01-02
