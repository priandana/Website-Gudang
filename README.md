# Pusat Spreadsheet Pergudangan

Portal statis untuk menampilkan daftar spreadsheet bertema pergudangan. Cocok untuk di-host di Vercel (tanpa backend).

## Fitur
- Pencarian cepat (judul, deskripsi, kategori, owner, URL)
- Filter kategori dan owner
- Tombol **Buka** (modal pratinjau untuk Google Sheets) atau buka di tab baru
- Tombol **Salin Link**
- Ringkasan total item/kategori/owner
- Tambah link **sementara** via `localStorage` (hanya di perangkat/browser pengguna)
- Desain tema industri (gelap) yang responsif

## Struktur
```
/
├─ index.html
├─ assets/
│  ├─ styles.css
│  └─ app.js
└─ data/
   └─ spreadsheets.json   ← edit file ini untuk menambah/ubah data
```

## Mengisi Data
Edit `data/spreadsheets.json` lalu deploy. Contoh format:
```json
{
  "items": [
    {
      "id": "stok-pusat",
      "title": "Stok Harian - Gudang Pusat",
      "description": "Monitoring stok barang masuk/keluar harian.",
      "category": "Stok",
      "owner": "Tim Inventory",
      "link": "https://docs.google.com/spreadsheets/d/...",
      "updated_at": "2025-12-21"
    }
  ]
}
```

> **Tips embed**: Link Google Sheets akan otomatis diubah ke mode **preview** di modal agar tampilan bersih. Untuk non‑Google Sheets, tombol **Buka** akan membuka tab baru.

## Deploy ke Vercel
1. Buat repo Git baru, salin seluruh folder ini.
2. Commit & push ke GitHub/GitLab/Bitbucket.
3. Di Vercel, **New Project** → impor repo tersebut.
4. **Framework Preset**: *Other* (Static). Build command kosong, Output directory root (`/`).
5. Deploy. Selesai ✅

Atau, upload ZIP langsung sebagai project statis di Vercel.

## Kustomisasi
- Ubah warna di `:root` pada `assets/styles.css`.
- Ganti favicon (di `<head>` pada `index.html`).
- Logo bisa diganti pada elemen `div.logo`.

## Keamanan & Akses
- Ini portal publik secara default (statis). Jika spreadsheet bersifat privat, atur permissions di Google/SharePoint agar hanya karyawan yang dapat mengakses.
- Tidak ada backend; tidak menyimpan data sensitif di website.

---
Dibuat oleh ChatGPT untuk Logycasystem.
