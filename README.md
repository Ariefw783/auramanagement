# 🥟 DAPUR MOM FITRI (AURA Core v5.0)
> **Automated Utility & Revenue Assistant**  
> Sistem Operasional Konsinyasi & Dapur Produksi Gorengan Krispi

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success?style=flat-square&logo=pwa)](https://github.com/Ariefw783/auramanagement)
[![Firebase Firestore](https://img.shields.io/badge/Firebase-Firestore%20Sync-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Zero Leakage](https://img.shields.io/badge/Accounting-Zero--Leakage-blue?style=flat-square)](https://github.com/Ariefw783/auramanagement)
[![License](https://img.shields.io/badge/License-Proprietary-lightgrey?style=flat-square)](https://github.com/Ariefw783/auramanagement)

---

## 📌 Ringkasan Sistem
**DAPUR MOM FITRI** adalah Progressive Web Application (PWA) taktis dan mandiri yang dirancang khusus untuk memandu rantai pasok dapur produksi gorengan konsinyasi:
1. **Gogumapia Mini Ubi Ungu Keju** (HPP Unit: Rp 638 | Setor: Rp 800)
2. **Lumpia Sayur Krispi Sosis** (HPP Unit: Rp 681 | Setor: Rp 800)
3. **Roti Goreng Choco Crunch Collins** (HPP Unit: Rp 605 | Setor: Rp 800)

Sistem ini menggabungkan pencatatan distribusi konsinyasi lapangan 6 mitra sekolah/kantin, pengeluaran kas belanja bahan harian, akuntansi arus kas dengan **Sistem 2 Amplop Dinamis**, inventaris stok dapur riil, dan kalkulator takaran subuh otomatis.

---

## 🚀 Fitur Unggulan

### 1. Executive Dashboard & Financial Scorecards
- **Single Source of Truth**: Seluruh angka keuangan (Omzet, Belanja, Laba Bersih, Gaji Bos, Endapan Kotak Dapur) dihitung secara real-time dan matematis dari data Distribusi (Buku 1) dan Kas Keluar (Buku 2).
- **Ranking Performa Mitra**: Mengurutkan 6 mitra berdasarkan tingkat laku penjualan (% sell-through rate) untuk memandu alokasi kuota produksi.
- **Akumulasi Kas Bersih**: Memisahkan secara transparan antara uang hak dapur (Amplop 1) dan uang laba bersih bos (Amplop 2).

### 2. Distribusi & Penjualan Mitra (Buku 1)
- **Lembar Kontrol Harian**: Mengontrol kuota kirim, bonus tester mitra, retur sore, barang laku, dan uang setoran.
- **Cetak Label Box**: Generator label tempel otomatis per box pengiriman mitra lengkap dengan rincian varian produk.
- **Slip Setoran Harian**: Format slip tanda terima setoran yang dapat dicetak atau disimpan.

### 3. Kas Keluar & Belanja Harian (Buku 2)
- **Kuitansi Bukti Kas Keluar (BKK)**: Format resmi BKK lengkap dengan nomor bukti, paraf pasar/toko, tanggal operasional, dan **terbilang rupiah otomatis**.
- **Plafon Modal Kerja**: Menjaga pengeluaran belanja bahan agar tetap berada dalam koridor modal kerja harian.
- **Fitur Edit & Hapus Cepat**: Memungkinkan koreksi belanjaan seketika tanpa merusak struktur database.

### 4. Arus Kas & Sistem 2 Amplop Dinamis (Buku 3)
- **Amplop 1 (Kotak Dapur)**: Plafon modal kerja operasional (dimulai dengan **Rp 100.000** pada siklus Senin, 26 Oktober 2026) untuk membeli bahan segar subuh.
- **Amplop 2 (Dompet Bos)**: Tempat murni laba bersih usaha.
- **Sabuk Pengaman Kas (Rolling Buffer Defisit)**: Jika belanja bahan di suatu hari melebihi target (misal belanja minyak/gas/selai bulk), sistem secara otomatis menutup defisit kas dapur dari omzet hari berikutnya sebelum mengalokasikan gaji ke dompet bos.

### 5. Inventaris & 25 Master Bahan Baku Terkalibrasi
- Katalog 25 bahan baku terstandarisasi dengan konversi satuan fisik ke gram (lembar, butir, tongkol, bungkus, kilogram).
- Dilengkapi sisa stok fisik aktual di dapur (Minyak, Panir, Collins, Terigu, Ubi Ungu, dll) dan sistem peringatan stok (Jalur A, B, C).

### 6. Standar Operasional Resep (BOM Dinamis)
- Resep dinamis per pcs produk dengan kalkulasi HPP otomatis berbasis harga beli master bahan.
- **Kalkulator Takaran Subuh Otomatis**: Generator takaran produksi pagi hari sekali klik dan salin ke clipboard WhatsApp.

### 7. Integrasi Cloud Firestore (Real-time & Offline Persistence)
- Sinkronisasi instan antar-perangkat via **Google Cloud Firestore**.
- **Offline First**: Didukung IndexedDB persistence lokal, data tetap aman tersimpan saat koneksi terputus dan otomatis disinkronkan saat kembali online.
- Indikator status koneksi Cloud interaktif (🟢 Terhubung / 🟡 Menyinkronkan / ⚪ Offline).

---

## 🛠️ Konfigurasi Cloud Firestore
Sistem terhubung ke instance Firestore dengan konfigurasi:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAQTrKW3j2hC94bD-bYWwG1F6xjl6CujO4",
  authDomain: "aplikasi-smart-coding.firebaseapp.com",
  projectId: "aplikasi-smart-coding",
  storageBucket: "aplikasi-smart-coding.firebasestorage.app",
  messagingSenderId: "330020798676",
  appId: "1:330020798676:web:26b7b4ad19987e99f8fb41"
};
```
Koleksi data disimpan pada: `dapur_mom_fitri/production_data`.

---

## 💻 Cara Menjalankan Aplikasi

### Opsi 1: Menjalankan Langsung via Localhost (Direkomendasikan untuk PWA)
1. Buka folder proyek di komputer.
2. Klik ganda file:
   ```cmd
   JALANKAN_PWA_MOM_FITRI.bat
   ```
3. Browser akan otomatis membuka `http://localhost:8080`.
4. Klik tombol **"Pasang Aplikasi (PWA)"** untuk memasang aplikasi ke desktop/laptop.

### Opsi 2: Menggunakan Node.js
```bash
node server.js
```
Akses `http://localhost:8080` dari peramban favorit Anda.

### Opsi 3: Pasang di Smartphone (Android / iOS)
- Buka tautan GitHub Pages atau server lokal dari browser HP.
- **Chrome Android**: Klik Menu (titik tiga) -> Pilih **"Tambahkan ke Layar Utama"** atau **"Pasang Aplikasi"**.
- **Safari iOS**: Klik tombol **Bagikan (Share)** -> Pilih **"Tambahkan ke Layar Utama" (Add to Home Screen)**.

---

## 📁 Struktur Berkas

```
pwa_dapur_resky/
├── index.html                           # Single Page Application HTML5
├── style.css                            # Dark Slate Theme CSS Blueprint
├── app.js                               # Core Accounting & Firestore Engine
├── sw.js                                # Service Worker Cache (v6.0)
├── manifest.json                        # Manifest PWA Standar
├── server.js                            # Server lokal Node.js port 8080
├── JALANKAN_PWA_MOM_FITRI.bat           # Launcher instan Windows
├── icon.svg                             # Master vektor icon
├── icon-192.png                         # PWA icon 192px
├── icon-512.png                         # PWA icon 512px
├── Panduan_Visual_Lumpia_Sayur_Sosis.jpg
├── Panduan_Visual_Lumpia_Ubi_Ungu_Keju.jpg
├── Panduan_Visual_Roti_Goreng_Collins.jpg
├── Panduan_Visual_Trio_Gorengan_Lengkap.jpg
└── README.md                            # Dokumentasi teknis proyek
```

---
*DAPUR MOM FITRI © 2026 • Dirancang untuk Ketelitian Finansial & Efisiensi Operasional UMKM.*
