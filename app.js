// ==============================================================
// DAPUR MOM FITRI (AUTOMATED UTILITY & REVENUE ASSISTANT)
// SISTEM OPERASIONAL KONSINYASI & DAPUR PRODUKSI GORENGAN
// CORE CONTROLLER & TACTICAL SPREADSHEET ENGINE v4.0
// ==============================================================

const AURA_DB_KEY = 'dapur_mom_fitri_db_v5';
const LEGACY_KEY = 'aura_slate_db_v5';

// ==============================================================
// CLOUD FIRESTORE SYNCHRONIZATION ENGINE (REALTIME & PERSISTENCE)
// ==============================================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAQTrKW3j2hC94bD-bYWwG1F6xjl6CujO4",
  authDomain: "aplikasi-smart-coding.firebaseapp.com",
  projectId: "aplikasi-smart-coding",
  storageBucket: "aplikasi-smart-coding.firebasestorage.app",
  messagingSenderId: "330020798676",
  appId: "1:330020798676:web:26b7b4ad19987e99f8fb41"
};

let firestoreDb = null;
let cloudSyncTimeout = null;
let isFirestoreInitialized = false;

function setCloudStatusUI(status, label) {
  const pills = [document.getElementById('cloudSyncPillDesktop'), document.getElementById('cloudSyncPillMobile')];
  pills.forEach(pill => {
    if (!pill) return;
    pill.classList.remove('syncing', 'offline', 'error', 'connected');
    pill.classList.add(status);
    const textEl = pill.querySelector('.cloud-sync-text');
    if (textEl) textEl.innerText = label;
  });
}

function initFirestoreSync() {
  if (typeof firebase === 'undefined') {
    console.info('[Firestore] SDK belum termuat atau berjalan offline.');
    setCloudStatusUI('offline', 'Mode Offline');
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    firestoreDb = firebase.firestore();

    try {
      firestoreDb.enablePersistence({ synchronizeTabs: true }).catch(err => {
        if (err.code === 'failed-precondition') {
          console.warn('[Firestore] Multi-tab terbuka, persistensi berjalan di tab primer.');
        } else if (err.code === 'unimplemented') {
          console.warn('[Firestore] Browser tidak mendukung IndexedDB persistence.');
        }
      });
    } catch (e) {}

    isFirestoreInitialized = true;
    setCloudStatusUI('connected', 'Cloud Terhubung');

    const docRef = firestoreDb.collection('dapur_mom_fitri').doc('production_data');
    docRef.onSnapshot(doc => {
      if (doc.exists) {
        const cloudDoc = doc.data();
        if (cloudDoc && cloudDoc.payload && cloudDoc.lastUpdated) {
          const localUpdated = (auraData && auraData._lastUpdated) || 0;
          if (cloudDoc.lastUpdated > localUpdated) {
            console.log('[Firestore] Sinkronisasi real-time diterima dari Cloud:', cloudDoc.lastUpdated);
            auraData = cloudDoc.payload;
            auraData._lastUpdated = cloudDoc.lastUpdated;
            localStorage.setItem(AURA_DB_KEY, JSON.stringify(auraData));
            renderAllViews();
            const timeStr = new Date(cloudDoc.lastUpdated).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            setCloudStatusUI('connected', 'Tersinkron ' + timeStr);
            return;
          }
        }
      } else {
        console.log('[Firestore] Dokumen cloud belum tersedia, inisialisasi upload state perdana...');
        pushToFirestoreCloud(true);
      }
      setCloudStatusUI('connected', 'Cloud Terhubung');
    }, err => {
      console.warn('[Firestore] Realtime snapshot listener:', err.message);
      setCloudStatusUI('offline', 'Offline (Disimpan Lokal)');
    });

  } catch (err) {
    console.warn('[Firestore] Inisialisasi error:', err);
    setCloudStatusUI('offline', 'Mode Offline');
  }
}

function pushToFirestoreCloud(immediate = false) {
  if (!isFirestoreInitialized || !firestoreDb) return;
  if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);

  const performPush = () => {
    setCloudStatusUI('syncing', 'Menyinkronkan...');
    const now = Date.now();
    if (auraData) auraData._lastUpdated = now;
    const cleanPayload = JSON.parse(JSON.stringify(auraData));

    firestoreDb.collection('dapur_mom_fitri').doc('production_data').set({
      lastUpdated: now,
      clientAgent: 'PWA Dapur Mom Fitri Web',
      version: '5.0.0',
      payload: cleanPayload
    }, { merge: true })
    .then(() => {
      const timeStr = new Date(now).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setCloudStatusUI('connected', 'Tersinkron ' + timeStr);
    })
    .catch(err => {
      console.warn('[Firestore] Gagal push ke cloud:', err.message);
      setCloudStatusUI('offline', 'Offline (Disimpan Lokal)');
    });
  };

  if (immediate) {
    performPush();
  } else {
    cloudSyncTimeout = setTimeout(performPush, 1000);
  }
}

window.triggerCloudSync = function() {
  if (!isFirestoreInitialized) {
    initFirestoreSync();
  }
  pushToFirestoreCloud(true);
  if (typeof window.showSuccessModal === 'function') {
    window.showSuccessModal('Sinkronisasi Cloud', 'Data operasional Dapur Mom Fitri sedang disinkronkan ke Cloud Firestore.');
  }
};

// 25 Master Bahan Baku Terstandarisasi Dapur Mom Fitri (Dikalibrasi Sesuai Harga Beli Terkini)
const INITIAL_MASTER_BAHAN = [
  { id: 'mb-01', nama: 'Kulit Lumpia Segar', kategori: 'Pasar Subuh', satuan: 'Bungkus (isi 36 lbr)', unitFisik: 'lembar', qtyPerBeli: 36, gramPerUnit: 7, totalGram: 252, harga: 10000, vendor: 'Tukang Sayur Pasar Subuh', tglUpdate: '2026-10-24' },
  { id: 'mb-02', nama: 'Ubi Ungu Segar', kategori: 'Pasar Subuh', satuan: 'Kilogram (≈ 5 buah)', unitFisik: 'buah', qtyPerBeli: 5, gramPerUnit: 200, totalGram: 1000, harga: 11000, vendor: 'Pasar Sayur Induk', tglUpdate: '2026-10-24' },
  { id: 'mb-03', nama: 'Wortel Segar Super', kategori: 'Pasar Subuh', satuan: 'Pak 500g (≈ 4 buah)', unitFisik: 'buah', qtyPerBeli: 4, gramPerUnit: 125, totalGram: 500, harga: 7000, vendor: 'Pasar Sayur Induk', tglUpdate: '2026-10-24' },
  { id: 'mb-04', nama: 'Jagung Manis Segar', kategori: 'Pasar Subuh', satuan: 'Paket (3 tongkol ≈ 390g)', unitFisik: 'tongkol', qtyPerBeli: 3, gramPerUnit: 130, totalGram: 390, harga: 5000, vendor: 'Pasar Sayur Induk', tglUpdate: '2026-10-24' },
  { id: 'mb-05', nama: 'Telur Ayam Ras', kategori: 'Pasar Subuh', satuan: 'Paket (4 butir)', unitFisik: 'butir', qtyPerBeli: 4, gramPerUnit: 55, totalGram: 220, harga: 5000, vendor: 'Tukang Telur Pasar', tglUpdate: '2026-10-24' },
  { id: 'mb-06', nama: 'Daun Bawang & Seledri', kategori: 'Pasar Subuh', satuan: 'Ikat segar (≈ 4 btg)', unitFisik: 'ikat', qtyPerBeli: 1, gramPerUnit: 100, totalGram: 100, harga: 2000, vendor: 'Pasar Sayur Induk', tglUpdate: '2026-10-24' },
  { id: 'mb-07', nama: 'Bawang Putih Bersih', kategori: 'Pasar Subuh', satuan: 'Pak 250g (≈ 50 siung)', unitFisik: 'siung', qtyPerBeli: 50, gramPerUnit: 5, totalGram: 250, harga: 8000, vendor: 'Pasar Sayur Induk', tglUpdate: '2026-10-24' },
  { id: 'mb-08', nama: 'Sosis Ayam/Sapi Ekonomis', kategori: 'Toko / Minimarket', satuan: 'Pak (isi 40 batang)', unitFisik: 'batang', qtyPerBeli: 40, gramPerUnit: 22, totalGram: 880, harga: 18000, vendor: 'Toko Bahan Kue Karunia', tglUpdate: '2026-10-24' },
  { id: 'mb-09', nama: 'Roti Tawar Kupas', kategori: 'Toko / Minimarket', satuan: 'Bungkus (isi 14 lbr)', unitFisik: 'lembar', qtyPerBeli: 14, gramPerUnit: 35, totalGram: 490, harga: 10000, vendor: 'Minimarket Terdekat', tglUpdate: '2026-10-24' },
  { id: 'mb-10', nama: 'Keju Prochiz Spready', kategori: 'Toko / Minimarket', satuan: 'Box / Pouch (160g)', unitFisik: 'pouch', qtyPerBeli: 1, gramPerUnit: 160, totalGram: 160, harga: 12000, vendor: 'Minimarket Terdekat', tglUpdate: '2026-10-24' },
  { id: 'mb-11', nama: 'Susu Kental Manis (SKM) Putih', kategori: 'Toko / Minimarket', satuan: 'Pouch Ekonomis (200g)', unitFisik: 'pouch', qtyPerBeli: 1, gramPerUnit: 200, totalGram: 200, harga: 8500, vendor: 'Minimarket Terdekat', tglUpdate: '2026-10-24' },
  { id: 'mb-12', nama: 'Susu Bubuk Putih (Dancow/Curah)', kategori: 'Toko / Minimarket', satuan: 'Sachet (26g)', unitFisik: 'sachet', qtyPerBeli: 1, gramPerUnit: 26, totalGram: 26, harga: 4000, vendor: 'Toko Bahan Kue Karunia', tglUpdate: '2026-10-24' },
  { id: 'mb-13', nama: 'Selai Collins Choco Crunchy', kategori: 'Toko / Minimarket', satuan: 'Ember (1 kg)', unitFisik: 'ember', qtyPerBeli: 1, gramPerUnit: 1000, totalGram: 1000, harga: 53000, vendor: 'Toko Bahan Kue Karunia', tglUpdate: '2026-10-24' },
  { id: 'mb-14', nama: 'Saus Tiram Saori Sachet', kategori: 'Toko / Minimarket', satuan: 'Sachet (23ml)', unitFisik: 'sachet', qtyPerBeli: 1, gramPerUnit: 23, totalGram: 23, harga: 3000, vendor: 'Toko Kelontong Berkah', tglUpdate: '2026-10-24' },
  { id: 'mb-15', nama: 'Tepung Terigu Curah', kategori: 'Toko / Minimarket', satuan: 'Bungkus (500g)', unitFisik: 'bungkus', qtyPerBeli: 1, gramPerUnit: 500, totalGram: 500, harga: 6000, vendor: 'Toko Kelontong Berkah', tglUpdate: '2026-10-24' },
  { id: 'mb-16', nama: 'Tepung Panir Super Krispi', kategori: 'Toko / Minimarket', satuan: 'Kilogram (1 kg)', unitFisik: 'kg', qtyPerBeli: 1, gramPerUnit: 1000, totalGram: 1000, harga: 10000, vendor: 'Toko Bahan Kue Karunia', tglUpdate: '2026-10-24' },
  { id: 'mb-17', nama: 'Minyak Goreng Sawit Kemasan', kategori: 'Toko / Minimarket', satuan: 'Pouch / Botol (1.000g)', unitFisik: 'liter', qtyPerBeli: 1, gramPerUnit: 1000, totalGram: 1000, harga: 19000, vendor: 'Minimarket Terdekat', tglUpdate: '2026-10-24' },
  { id: 'mb-18', nama: 'Gas LPG 3kg Subsidi', kategori: 'Operasional & Gas', satuan: 'Tabung (3 kg)', unitFisik: 'tabung', qtyPerBeli: 1, gramPerUnit: 3000, totalGram: 3000, harga: 22000, vendor: 'Pangkalan Gas Resmi', tglUpdate: '2026-10-24' },
  { id: 'mb-19', nama: 'Mika Plastik Bening 7C', kategori: 'Kemasan', satuan: 'Pak (isi 100 pcs)', unitFisik: 'pcs', qtyPerBeli: 100, gramPerUnit: 3, totalGram: 300, harga: 12500, vendor: 'Toko Plastik Sentosa', tglUpdate: '2026-10-24' },
  { id: 'mb-20', nama: 'Kertas Nasi Alas Minyak', kategori: 'Kemasan', satuan: 'Pak (isi 250 lbr)', unitFisik: 'lembar', qtyPerBeli: 250, gramPerUnit: 4, totalGram: 1000, harga: 14000, vendor: 'Toko Plastik Sentosa', tglUpdate: '2026-10-24' },
  { id: 'mb-21', nama: 'Margarin Serbaguna', kategori: 'Toko / Minimarket', satuan: 'Bungkus (200g)', unitFisik: 'bungkus', qtyPerBeli: 1, gramPerUnit: 200, totalGram: 200, harga: 7500, vendor: 'Minimarket Terdekat', tglUpdate: '2026-10-24' },
  { id: 'mb-22', nama: 'Garam Dapur Halus', kategori: 'Pasar Subuh', satuan: 'Bungkus (250g)', unitFisik: 'bungkus', qtyPerBeli: 1, gramPerUnit: 250, totalGram: 250, harga: 4000, vendor: 'Pasar Sayur Induk', tglUpdate: '2026-10-24' },
  { id: 'mb-23', nama: 'Gula Pasir Kristal', kategori: 'Toko / Minimarket', satuan: 'Kilogram (1.000g)', unitFisik: 'kg', qtyPerBeli: 1, gramPerUnit: 1000, totalGram: 1000, harga: 17500, vendor: 'Minimarket Terdekat', tglUpdate: '2026-10-24' },
  { id: 'mb-24', nama: 'Royco Kaldu Ayam', kategori: 'Toko / Minimarket', satuan: 'Sachet (9g)', unitFisik: 'sachet', qtyPerBeli: 1, gramPerUnit: 9, totalGram: 9, harga: 500, vendor: 'Warung Kelontong', tglUpdate: '2026-10-24' },
  { id: 'mb-25', nama: 'Vanili Bubuk', kategori: 'Toko / Minimarket', satuan: 'Sachet (2g)', unitFisik: 'sachet', qtyPerBeli: 1, gramPerUnit: 2, totalGram: 2, harga: 500, vendor: 'Toko Bahan Kue Karunia', tglUpdate: '2026-10-24' }
];

// Standar Operasional Resep & Bill of Materials (BOM) Dinamis Dapur Mom Fitri
const DEFAULT_MASTER_RESEP = [
  {
    id: 'prod_ubi',
    nama: 'Gogumapia Mini Ubi Ungu Keju',
    shortName: 'Ubi',
    badgeColor: '#818CF8',
    lipatModel: 'Lipat Bantal Mini',
    sopWaktuSuhu: '160°C (Api Sedang • 3.5 - 4.0 Menit)',
    hargaSetorDefault: 800,
    imgSrc: './Panduan_Visual_Lumpia_Ubi_Ungu_Keju.jpg',
    badgeTag: 'Gogumapia Mini • 12g (1 Sdt Munjung)',
    catatanSOP: 'Ubi ungu kupas dikukus empuk (bukan direbus), dilumatkan garpu selagi hangat bersama Gula Pasir & SKM Putih hingga lumer seperti pasta. Kunci takaran 1 sdt munjung (~12g ubi) + semprotan 1g Keju Oles Prochiz Spready dari plastik segitiga. Lipat model bantal amplop mini.',
    videoRef: { author: '@mamabinti313 (Kedai313)', url: 'https://vt.tiktok.com/ZSgamAF29/' },
    defaultPcs: 66,
    isCustom: false,
    komposisi: [
      { bahanKey: 'Kulit Lumpia', nama: 'Kulit Lumpia Segar', qtyPerPcs: 1, unit: 'lembar', isGram: false, tipe: 'kulit' },
      { bahanKey: 'Ubi Ungu', nama: 'Ubi Ungu Kukus Lumat', qtyPerPcs: 13.2, unit: 'gram', isGram: true, tipe: 'isian' },
      { bahanKey: 'Keju', nama: 'Keju Oles Prochiz Spready', qtyPerPcs: 1.0, unit: 'gram', isGram: true, tipe: 'isian' },
      { bahanKey: 'Susu Kental Manis', nama: 'SKM Putih', qtyPerPcs: 0.45, unit: 'gram', isGram: true, tipe: 'bumbu' },
      { bahanKey: 'Gula Pasir', nama: 'Gula Pasir', qtyPerPcs: 0.6, unit: 'gram', isGram: true, tipe: 'bumbu', fallbackCost: 10 },
      { bahanKey: 'Susu Bubuk', nama: 'Susu Bubuk Putih (Opsional)', qtyPerPcs: 0.3, unit: 'gram', isGram: true, tipe: 'bumbu' },
      { bahanKey: 'Terigu', nama: 'Tepung Lem Perekat', qtyPerPcs: 0.3, unit: 'gram', isGram: true, tipe: 'kulit' },
      { bahanKey: 'Minyak Goreng', nama: 'Serapan Minyak Goreng', qtyPerPcs: 2.4, unit: 'gram', isGram: true, tipe: 'goreng' },
      { bahanKey: 'Gas LPG', nama: 'Konsumsi Gas LPG', qtyPerPcs: 2.0, unit: 'gram', isGram: true, tipe: 'goreng' }
    ]
  },
  {
    id: 'prod_sayur',
    nama: 'Lumpia Segitiga Sayur Telur Sosis',
    shortName: 'Sayur',
    badgeColor: '#34D399',
    lipatModel: 'Lipat Segitiga (Samosa)',
    sopWaktuSuhu: '160°C (Api Sedang • 3.5 - 4.0 Menit)',
    hargaSetorDefault: 800,
    imgSrc: './Panduan_Visual_Lumpia_Sayur_Sosis.jpg',
    badgeTag: 'Lipat Segitiga • 10g Tumis Asat',
    catatanSOP: 'Tumis bawang putih cincang, masukkan wortel dadu kecil, jagung manis pipil, sosis dadu mikro, daun bawang, saus tiram & bumbu. Tuang kocokan telur di tahap paling akhir hingga mengikat kering. Gunakan rasio 10g isian/pcs. Rekatkan dengan lem tepung kental.',
    videoRef: { author: '@anaayu16 (AnaAyu)', url: 'https://vt.tiktok.com/ZSgamKvdL/' },
    defaultPcs: 32,
    isCustom: false,
    komposisi: [
      { bahanKey: 'Kulit Lumpia', nama: 'Kulit Lumpia Segar', qtyPerPcs: 1, unit: 'lembar', isGram: false, tipe: 'kulit' },
      { bahanKey: 'Wortel', nama: 'Wortel Dadu Kecil', qtyPerPcs: 5.0, unit: 'gram', isGram: true, tipe: 'isian' },
      { bahanKey: 'Jagung', nama: 'Jagung Manis Pipil', qtyPerPcs: 3.5, unit: 'gram', isGram: true, tipe: 'isian' },
      { bahanKey: 'Sosis', nama: 'Sosis Dadu Mikro (1 btg=8 pcs)', qtyPerPcs: 2.75, unit: 'gram', isGram: true, tipe: 'isian' },
      { bahanKey: 'Telur', nama: 'Telur Ayam Kocok (Pengikat)', qtyPerPcs: 2.2, unit: 'gram', isGram: true, tipe: 'isian' },
      { bahanKey: 'Bawang Putih', nama: 'Bawang Putih Cincang', qtyPerPcs: 0.4, unit: 'gram', isGram: true, tipe: 'bumbu' },
      { bahanKey: 'Daun Bawang', nama: 'Daun Bawang Iris Segar', qtyPerPcs: 0.4, unit: 'gram', isGram: true, tipe: 'bumbu' },
      { bahanKey: 'Saus Tiram', nama: 'Saus Tiram & Kaldu Garam', qtyPerPcs: 0.75, unit: 'gram', isGram: true, tipe: 'bumbu' },
      { bahanKey: 'Terigu', nama: 'Tepung Lem Perekat', qtyPerPcs: 0.3, unit: 'gram', isGram: true, tipe: 'kulit' },
      { bahanKey: 'Minyak Goreng', nama: 'Serapan Minyak Goreng', qtyPerPcs: 2.4, unit: 'gram', isGram: true, tipe: 'goreng' },
      { bahanKey: 'Gas LPG', nama: 'Konsumsi Gas LPG', qtyPerPcs: 2.0, unit: 'gram', isGram: true, tipe: 'goreng' }
    ]
  },
  {
    id: 'prod_roti',
    nama: 'Roti Goreng Kantong Collins Choco',
    shortName: 'Roti',
    badgeColor: '#FBBF24',
    lipatModel: 'Belah 2 Kantong Persegi',
    sopWaktuSuhu: '160°C (Api Sedang • 3.0 - 3.5 Menit)',
    hargaSetorDefault: 800,
    imgSrc: './Panduan_Visual_Roti_Goreng_Collins.jpg',
    badgeTag: '1 Lembar = 2 Pcs Kantong',
    catatanSOP: 'Roti tawar utuh dipotong 2 persegi panjang; tumpuk 2 potong setengah-lembar secara kering, celup cepat ke adonan terigu cair encer, balut panir tipis. Goreng api sedang. Belah melintang jadi 2 kantong, semprot Collins 2.5g dari tengah ke bibir luar.',
    videoRef: { author: '@triretnanijcgl (Toko Jacko)', url: 'https://vt.tiktok.com/ZSgaawpCk/' },
    defaultPcs: 32,
    isCustom: false,
    komposisi: [
      { bahanKey: 'Roti Tawar', nama: 'Roti Tawar Kupas (0.5 lbr/pcs)', qtyPerPcs: 0.5, unit: 'lembar', isGram: false, tipe: 'kulit' },
      { bahanKey: 'Collins', nama: 'Collins Choco Crunchy (Bibir Luar)', qtyPerPcs: 2.5, unit: 'gram', isGram: true, tipe: 'isian' },
      { bahanKey: 'Panir', nama: 'Tepung Panir Halus', qtyPerPcs: 4.0, unit: 'gram', isGram: true, tipe: 'baluran' },
      { bahanKey: 'Terigu', nama: 'Terigu Adonan Celup Cepat', qtyPerPcs: 2.5, unit: 'gram', isGram: true, tipe: 'baluran' },
      { bahanKey: 'Minyak Goreng', nama: 'Serapan Minyak Celup Cepat', qtyPerPcs: 1.8, unit: 'gram', isGram: true, tipe: 'goreng' },
      { bahanKey: 'Gas LPG', nama: 'Konsumsi Gas LPG', qtyPerPcs: 1.5, unit: 'gram', isGram: true, tipe: 'goreng' }
    ]
  }
];

// Helper Deteksi Tanggal Kalender Lokal Aktual (Real-Time Clock)
function getRealTodayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function buildDayMetaFromIso(isoDate, idxNum) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const hariNamesFull = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const hariNamesShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const hFull = hariNamesFull[dt.getDay()] || 'Hari';
  const hShort = hariNamesShort[dt.getDay()] || 'Hri';
  const bName = bulanNames[(m || 1) - 1] || '';
  const b2Key = String(d).padStart(2, '0') + '/' + String(m).padStart(2, '0');
  return {
    isoDate: isoDate,
    b2Key: b2Key,
    tgl: idxNum || 5,
    hari: hShort,
    namaHari: hFull + ', ' + d + ' ' + bName + ' ' + y,
    shortLabel: hShort.toUpperCase() + ' (' + b2Key + ')',
    noBkk: 'BKK-' + isoDate.replace(/-/g, '') + '-0' + (idxNum || 5),
    modal: 60000,
    isTarget: true
  };
}

// Konfigurasi Master Hari Operasional & Plafon Amplop 1 (Siklus Produksi & Jual Mulai Senin 26 Okt 2026)
const OPERATIONAL_DAYS_CONFIG = [
  { isoDate: '2026-10-26', b2Key: '26/10', tgl: 1, hari: 'Sen', namaHari: 'Senin, 26 Oktober 2026', shortLabel: 'SEN (26/10)', noBkk: 'BKK-20261026-01', modal: 100000, isTarget: true },
  { isoDate: '2026-10-27', b2Key: '27/10', tgl: 2, hari: 'Sel', namaHari: 'Selasa, 27 Oktober 2026', shortLabel: 'SEL (27/10)', noBkk: 'BKK-20261027-02', modal: 100000, isTarget: true },
  { isoDate: '2026-10-28', b2Key: '28/10', tgl: 3, hari: 'Rab', namaHari: 'Rabu, 28 Oktober 2026', shortLabel: 'RAB (28/10)', noBkk: 'BKK-20261028-03', modal: 100000, isTarget: true },
  { isoDate: '2026-10-29', b2Key: '29/10', tgl: 4, hari: 'Kam', namaHari: 'Kamis, 29 Oktober 2026', shortLabel: 'KAM (29/10)', noBkk: 'BKK-20261029-04', modal: 100000, isTarget: true },
  { isoDate: '2026-10-30', b2Key: '30/10', tgl: 5, hari: 'Jum', namaHari: 'Jumat, 30 Oktober 2026', shortLabel: 'JUM (30/10)', noBkk: 'BKK-20261030-05', modal: 100000, isTarget: true },
  { isoDate: '2026-10-31', b2Key: '31/10', tgl: 6, hari: 'Sab', namaHari: 'Sabtu, 31 Oktober 2026', shortLabel: 'SAB (31/10)', noBkk: 'BKK-20261031-06', modal: 100000, isTarget: true }
];

// Deteksi Tanggal Kalender Lokal Aktual & Penentuan Tanggal Siklus Aktif
const REAL_TODAY_ISO = getRealTodayIso();
const DEFAULT_CYCLE_START_ISO = '2026-10-26';
if (!OPERATIONAL_DAYS_CONFIG.some(c => c.isoDate === REAL_TODAY_ISO)) {
  OPERATIONAL_DAYS_CONFIG.push(buildDayMetaFromIso(REAL_TODAY_ISO, OPERATIONAL_DAYS_CONFIG.length + 1));
}
const REAL_TODAY_META = OPERATIONAL_DAYS_CONFIG.find(c => c.isoDate === REAL_TODAY_ISO) || OPERATIONAL_DAYS_CONFIG[0];
const REAL_TODAY_B2KEY = REAL_TODAY_META.b2Key;

// Data Multi-Hari Buku 1 Kontrol Konsinyasi Lapangan (Target Bersih Hari Senin 26 Okt 2026)
const DEFAULT_BUKU1_HISTORY = {
  '2026-10-26': [
    { no: 1, nama: 'Koperasi Sekolah', admin: 'Pengurus Koperasi', ubi: 8, sayur: 5, roti: 7, kirim: 20, bonus: 2, retur: 0, laku: 0, setor: 0, hargaSetor: 800, marginMitra: 200 },
    { no: 2, nama: 'Warung Sayur Tara', admin: 'Ibu Tara', ubi: 13, sayur: 5, roti: 7, kirim: 25, bonus: 2, retur: 0, laku: 0, setor: 0, hargaSetor: 800, marginMitra: 200 },
    { no: 3, nama: 'Kantin Bu Martanto', admin: 'Bu Martanto', ubi: 13, sayur: 5, roti: 7, kirim: 25, bonus: 2, retur: 0, laku: 0, setor: 0, hargaSetor: 800, marginMitra: 200 },
    { no: 4, nama: 'Kantin Bu Rusdi', admin: 'Bu Rusdi', ubi: 13, sayur: 5, roti: 7, kirim: 25, bonus: 2, retur: 0, laku: 0, setor: 0, hargaSetor: 800, marginMitra: 200 },
    { no: 5, nama: 'Kantin Bu Parman', admin: 'Bu Parman', ubi: 10, sayur: 7, roti: 0, kirim: 17, bonus: 2, retur: 0, laku: 0, setor: 0, hargaSetor: 800, marginMitra: 200 },
    { no: 6, nama: 'Warung Mbak Ragil', admin: 'Mbak Ragil', ubi: 4, sayur: 4, roti: 0, kirim: 8, bonus: 1, retur: 0, laku: 0, setor: 0, hargaSetor: 800, marginMitra: 200 }
  ]
};

const INITIAL_AURA_DATA = {
  titik: [
    { id: 'koperasi', nama: 'Koperasi Sekolah', admin: 'Pengurus Koperasi', kirim: 20, retur: 0, laku: 0, setor: 0, status: 'progress', checked: false },
    { id: 'tara', nama: 'Warung Sayur Tara', admin: 'Ibu Tara', kirim: 25, retur: 0, laku: 0, setor: 0, status: 'progress', checked: false },
    { id: 'martanto', nama: 'Kantin Bu Martanto', admin: 'Bu Martanto', kirim: 25, retur: 0, laku: 0, setor: 0, status: 'progress', checked: false },
    { id: 'rusdi', nama: 'Kantin Bu Rusdi', admin: 'Bu Rusdi', kirim: 25, retur: 0, laku: 0, setor: 0, status: 'progress', checked: false },
    { id: 'parman', nama: 'Kantin Bu Parman', admin: 'Bu Parman', kirim: 17, retur: 0, laku: 0, setor: 0, status: 'progress', checked: false },
    { id: 'ragil', nama: 'Warung Mbak Ragil', admin: 'Mbak Ragil', kirim: 8, retur: 0, laku: 0, setor: 0, status: 'progress', checked: false }
  ],

  buku1Detail: DEFAULT_BUKU1_HISTORY['2026-10-26'],
  buku1History: DEFAULT_BUKU1_HISTORY,
  buku1SavedDates: {},
  buku1CustomDays: [],
  masterBahan: INITIAL_MASTER_BAHAN,
  masterResep: DEFAULT_MASTER_RESEP,

  buku2Belanja: [],

  buku3Kas: [
    { tgl: 1, hari: 'Sen', isoDate: '2026-10-26', b2Key: '26/10', kirim: 120, retur: 0, laku: 0, setor: 0, modal: 100000, gaji: 0, realBelanja: 0, endapan: 100000 }
  ],

  stokBahan: [
    { no: 1, nama: 'Kulit Lumpia Segar', kategori: 'Bahan Segar', satuan: 'bungkus', stok: 3, stokGram: 756, gramPerUnit: 252, minTrigger: 3, jalur: 'B', orderQty: '4 bungkus (isi 36 lbr)', status: 'Aman', action: 'Pakai produksi subuh' },
    { no: 2, nama: 'Ubi Ungu Segar', kategori: 'Bahan Segar', satuan: 'buah', stok: 3.8, stokGram: 765, gramPerUnit: 200, minTrigger: 4, jalur: 'B', orderQty: '1 kg (≈ 5 buah)', status: 'Aman', action: 'Sisa 765g (cukup subuh)' },
    { no: 3, nama: 'Wortel Segar Pasar', kategori: 'Sayuran', satuan: 'buah', stok: 1.7, stokGram: 213, gramPerUnit: 125, minTrigger: 1.5, jalur: 'B', orderQty: '500 gram (≈ 4 buah)', status: 'Aman', action: 'Sisa 213g (cukup subuh)' },
    { no: 4, nama: 'Jagung Manis', kategori: 'Sayuran', satuan: 'tongkol', stok: 2, stokGram: 260, gramPerUnit: 130, minTrigger: 1, jalur: 'B', orderQty: '1 paket (3 tongkol)', status: 'Aman', action: '2 tongkol (260g) cukup subuh' },
    { no: 5, nama: 'Telur Ayam Ras', kategori: 'Bahan Segar', satuan: 'butir', stok: 2, stokGram: 110, gramPerUnit: 55, minTrigger: 2, jalur: 'B', orderQty: '1 paket (4 butir / Rp 5.000)', status: 'Aman', action: '2 butir pengikat sayur' },
    { no: 6, nama: 'Daun Bawang & Seledri', kategori: 'Sayuran', satuan: 'ikat', stok: 1, stokGram: 100, gramPerUnit: 100, minTrigger: 1, jalur: 'B', orderQty: '1 ikat kecil segar (≈ 100g)', status: 'Aman', action: '1 ikat segar' },
    { no: 7, nama: 'Sosis Ayam/Sapi Ekonomis', kategori: 'Olahan Dingin', satuan: 'batang', stok: 19, stokGram: 418, gramPerUnit: 22, minTrigger: 8, jalur: 'C', orderQty: '1 pak isi 40 batang', status: 'Melimpah', action: 'Cukup 4-5 hari' },
    { no: 8, nama: 'Keju Prochiz Spready', kategori: 'Bahan Dingin', satuan: 'box', stok: 0.57, stokGram: 91, gramPerUnit: 160, minTrigger: 0.4, jalur: 'A', orderQty: '1 box (160g)', status: 'Aman', action: 'Sisa 91g (cukup subuh)' },
    { no: 9, nama: 'Roti Tawar Kupas', kategori: 'Bahan Baku', satuan: 'bungkus', stok: 0, stokGram: 0, gramPerUnit: 490, minTrigger: 2, jalur: 'A', orderQty: '2 bungkus (@ Rp 10.000)', status: 'Habis / 0', action: 'WAJIB BELI MALAM INI 2 BUNGKUS' },
    { no: 10, nama: 'Selai Collins Choco Crunch', kategori: 'Bahan Awet', satuan: 'ember', stok: 0.44, stokGram: 435, gramPerUnit: 1000, minTrigger: 0.1, jalur: 'C', orderQty: '1 ember (1.000g)', status: 'Aman', action: 'Sisa 435g (cukup 4-5 hari)' },
    { no: 11, nama: 'Bawang Putih', kategori: 'Bumbu Awet', satuan: 'siung', stok: 37, stokGram: 185, gramPerUnit: 5, minTrigger: 10, jalur: 'C', orderQty: '250 gram (≈ 50 siung)', status: 'Melimpah', action: 'Tahan 3 minggu' },
    { no: 12, nama: 'Tepung Panir Super Krispi', kategori: 'Bahan Kering', satuan: 'kg', stok: 0.33, stokGram: 330, gramPerUnit: 1000, minTrigger: 0.15, jalur: 'C', orderQty: '1 kg super krispi', status: 'Aman', action: 'Sisa 330g (cukup subuh)' },
    { no: 13, nama: 'Tepung Terigu Curah', kategori: 'Bahan Kering', satuan: 'bungkus', stok: 1.5, stokGram: 750, gramPerUnit: 500, minTrigger: 0.5, jalur: 'C', orderQty: '1 bungkus (500g)', status: 'Melimpah', action: 'Sisa 750g (+ box)' },
    { no: 14, nama: 'Susu Kental Manis (SKM) Putih', kategori: 'Bahan Dingin', satuan: 'pouch', stok: 0.69, stokGram: 138, gramPerUnit: 200, minTrigger: 0.3, jalur: 'A', orderQty: '1 pouch (200g)', status: 'Aman', action: 'Sisa 138g (cukup subuh)' },
    { no: 15, nama: 'Margarin Serbaguna', kategori: 'Bumbu Awet', satuan: 'bungkus', stok: 0.26, stokGram: 53, gramPerUnit: 200, minTrigger: 0.1, jalur: 'C', orderQty: '1 bungkus (200g)', status: 'Aman', action: 'Sisa 53g' },
    { no: 16, nama: 'Garam Dapur Halus', kategori: 'Bumbu Awet', satuan: 'bungkus', stok: 0.64, stokGram: 161, gramPerUnit: 250, minTrigger: 0.2, jalur: 'C', orderQty: '1 bungkus (250g)', status: 'Melimpah', action: 'Sisa 161g' },
    { no: 17, nama: 'Minyak Goreng Sawit', kategori: 'Minyak/Gas', satuan: 'liter', stok: 0.12, stokGram: 122, gramPerUnit: 1000, minTrigger: 0.5, jalur: 'A', orderQty: '1 pouch (1L / 1.000g)', status: 'Menipis', action: 'BELI MALAM INI 1 POUCH (1.000g)' },
    { no: 18, nama: 'Gula Pasir Kristal', kategori: 'Bahan Awet', satuan: 'kg', stok: 0.69, stokGram: 690, gramPerUnit: 1000, minTrigger: 0.2, jalur: 'C', orderQty: '1 kg kristal', status: 'Melimpah', action: 'Sisa 690g' },
    { no: 19, nama: 'Royco Kaldu Ayam', kategori: 'Bumbu Awet', satuan: 'sachet', stok: 2, stokGram: 18, gramPerUnit: 9, minTrigger: 2, jalur: 'A', orderQty: '1 renteng / 5 sachet', status: 'Aman', action: 'Sisa 2 sachet' },
    { no: 20, nama: 'Vanili Bubuk', kategori: 'Bumbu Awet', satuan: 'sachet', stok: 7, stokGram: 14, gramPerUnit: 2, minTrigger: 2, jalur: 'C', orderQty: '1 pak vanili', status: 'Melimpah', action: 'Sisa 7 sachet' },
    { no: 21, nama: 'Gas LPG 3kg', kategori: 'Minyak/Gas', satuan: 'tabung', stok: 1, stokGram: 3000, gramPerUnit: 3000, minTrigger: 1, jalur: 'C', orderQty: '1 tabung baru (3.000g)', status: 'Baru 100%', action: 'Aman untuk 1-2 minggu' }
  ]
};

let auraData = JSON.parse(localStorage.getItem(AURA_DB_KEY)) || INITIAL_AURA_DATA;
let activeDate = DEFAULT_CYCLE_START_ISO;
if (REAL_TODAY_ISO >= DEFAULT_CYCLE_START_ISO && OPERATIONAL_DAYS_CONFIG.some(c => c.isoDate === REAL_TODAY_ISO)) {
  activeDate = REAL_TODAY_ISO;
}
const activeDayCfg = OPERATIONAL_DAYS_CONFIG.find(c => c.isoDate === activeDate) || OPERATIONAL_DAYS_CONFIG[0];
let selectedBuku2Date = activeDayCfg.b2Key;
let currentChartPeriod = 'mingguan';
let currentMasterBahanFilterCat = 'all';
let currentTakaranUnitMode = 'all';
let buku1EditModeDates = {};

// Sinkronisasi Schema Database Baru (Stage 1 - 5) & Kalibrasi Data Historis
if (!auraData.masterBahan || auraData.masterBahan.length === 0) {
  auraData.masterBahan = JSON.parse(JSON.stringify(INITIAL_MASTER_BAHAN));
} else {
  // Kalibrasi properti konversi gram (unitFisik, qtyPerBeli, gramPerUnit, totalGram)
  // Cocokkan berdasarkan NAMA bahan baku (bukan ID) untuk mencegah tabrakan ID lama di LocalStorage
  auraData.masterBahan.forEach(item => {
    const itemNamaLower = (item.nama || '').toLowerCase();
    const def = INITIAL_MASTER_BAHAN.find(d => {
      const dNamaLower = d.nama.toLowerCase();
      if (dNamaLower === itemNamaLower) return true;
      if (itemNamaLower.includes('collins') && dNamaLower.includes('collins')) return true;
      if (itemNamaLower.includes('panir') && dNamaLower.includes('panir')) return true;
      if (itemNamaLower.includes('minyak') && dNamaLower.includes('minyak')) return true;
      if (itemNamaLower.includes('gas') && dNamaLower.includes('gas')) return true;
      if (itemNamaLower.includes('roti') && dNamaLower.includes('roti')) return true;
      if (itemNamaLower.includes('terigu') && dNamaLower.includes('terigu')) return true;
      if (itemNamaLower.includes('kulit') && dNamaLower.includes('kulit')) return true;
      if (itemNamaLower.includes('ubi') && dNamaLower.includes('ubi')) return true;
      if (itemNamaLower.includes('wortel') && dNamaLower.includes('wortel')) return true;
      if (itemNamaLower.includes('jagung') && dNamaLower.includes('jagung')) return true;
      if (itemNamaLower.includes('sosis') && dNamaLower.includes('sosis')) return true;
      if (itemNamaLower.includes('telur') && dNamaLower.includes('telur')) return true;
      if (itemNamaLower.includes('keju') && dNamaLower.includes('keju')) return true;
      if (itemNamaLower.includes('kental manis') && dNamaLower.includes('kental manis')) return true;
      if (itemNamaLower.includes('bawang putih') && dNamaLower.includes('bawang putih')) return true;
      if (itemNamaLower.includes('daun bawang') && dNamaLower.includes('daun bawang')) return true;
      return false;
    });

    if (def) {
      item.id = def.id;
      item.nama = def.nama;
      item.kategori = def.kategori;
      item.satuan = def.satuan;
      item.unitFisik = def.unitFisik;
      item.gramPerUnit = def.gramPerUnit;
      item.qtyPerBeli = def.qtyPerBeli;
      item.totalGram = def.totalGram;
      item.harga = def.harga; // Kalibrasi ke harga beli riil catatan terkini
    }
  });

  // Pastikan bahan baku yang belum ada di database lama terdaftarkan
  INITIAL_MASTER_BAHAN.forEach(def => {
    const exists = auraData.masterBahan.some(m => {
      const mn = (m.nama || '').toLowerCase();
      const dn = def.nama.toLowerCase();
      if (mn === dn) return true;
      if (dn.includes('terigu') && mn.includes('terigu')) return true;
      if (dn.includes('panir') && mn.includes('panir')) return true;
      if (dn.includes('collins') && mn.includes('collins')) return true;
      if (dn.includes('roti') && mn.includes('roti')) return true;
      if (dn.includes('minyak') && mn.includes('minyak')) return true;
      if (dn.includes('gas') && mn.includes('gas')) return true;
      if (dn.includes('kulit') && mn.includes('kulit')) return true;
      if (dn.includes('ubi') && mn.includes('ubi')) return true;
      if (dn.includes('wortel') && mn.includes('wortel')) return true;
      if (dn.includes('jagung') && mn.includes('jagung')) return true;
      if (dn.includes('sosis') && mn.includes('sosis')) return true;
      if (dn.includes('telur') && mn.includes('telur')) return true;
      if (dn.includes('keju') && mn.includes('keju')) return true;
      if (dn.includes('kental manis') && mn.includes('kental manis')) return true;
      if (dn.includes('susu bubuk') && mn.includes('susu bubuk')) return true;
      if (dn.includes('bawang putih') && mn.includes('bawang putih')) return true;
      if (dn.includes('daun bawang') && mn.includes('daun bawang')) return true;
      if (dn.includes('margarin') && mn.includes('margarin')) return true;
      if (dn.includes('garam') && mn.includes('garam')) return true;
      if (dn.includes('gula') && mn.includes('gula')) return true;
      if (dn.includes('royco') && mn.includes('royco')) return true;
      if (dn.includes('vanili') && mn.includes('vanili')) return true;
      if (dn.includes('saori') && mn.includes('saori')) return true;
      if (dn.includes('mika') && mn.includes('mika')) return true;
      if (dn.includes('kertas') && mn.includes('kertas')) return true;
      return false;
    });
    if (!exists) {
      auraData.masterBahan.push(JSON.parse(JSON.stringify(def)));
    }
  });

  // Sinkronkan sisa stok aktual dapur sesuai catatan fisik terkini
  INITIAL_AURA_DATA.stokBahan.forEach(defStok => {
    const cur = (auraData.stokBahan || []).find(s => {
      const sn = (s.nama || '').toLowerCase();
      const dn = defStok.nama.toLowerCase();
      if (sn === dn) return true;
      if (dn.includes('collins') && sn.includes('collins')) return true;
      if (dn.includes('panir') && sn.includes('panir')) return true;
      if (dn.includes('minyak') && sn.includes('minyak')) return true;
      if (dn.includes('gas') && sn.includes('gas')) return true;
      if (dn.includes('roti') && sn.includes('roti')) return true;
      if (dn.includes('terigu') && sn.includes('terigu')) return true;
      if (dn.includes('kulit') && sn.includes('kulit')) return true;
      if (dn.includes('ubi') && sn.includes('ubi')) return true;
      if (dn.includes('wortel') && sn.includes('wortel')) return true;
      if (dn.includes('jagung') && sn.includes('jagung')) return true;
      if (dn.includes('sosis') && sn.includes('sosis')) return true;
      if (dn.includes('telur') && sn.includes('telur')) return true;
      if (dn.includes('keju') && sn.includes('keju')) return true;
      if (dn.includes('kental manis') && sn.includes('kental manis')) return true;
      if (dn.includes('bawang putih') && sn.includes('bawang putih')) return true;
      if (dn.includes('daun bawang') && sn.includes('daun bawang')) return true;
      if (dn.includes('margarin') && sn.includes('margarin')) return true;
      if (dn.includes('garam') && sn.includes('garam')) return true;
      if (dn.includes('gula') && sn.includes('gula')) return true;
      if (dn.includes('royco') && sn.includes('royco')) return true;
      if (dn.includes('vanili') && sn.includes('vanili')) return true;
      return false;
    });

    if (cur) {
      cur.stok = defStok.stok;
      cur.stokGram = defStok.stokGram;
      cur.gramPerUnit = defStok.gramPerUnit;
      cur.satuan = defStok.satuan;
      cur.status = defStok.status;
      cur.action = defStok.action;
      cur.orderQty = defStok.orderQty;
      cur.jalur = defStok.jalur;
    } else {
      if (!auraData.stokBahan) auraData.stokBahan = [];
      auraData.stokBahan.push(JSON.parse(JSON.stringify(defStok)));
    }
  });
}
if (!auraData.buku1SavedDates) {
  auraData.buku1SavedDates = {
    '2026-10-19': true,
    '2026-10-20': true,
    '2026-10-21': true
  };
}
if (!auraData.buku1CustomDays) {
  auraData.buku1CustomDays = [];
}
auraData.buku1CustomDays.forEach(customIso => {
  if (!OPERATIONAL_DAYS_CONFIG.some(c => c.isoDate === customIso)) {
    const meta = buildDayMetaFromIso(customIso, OPERATIONAL_DAYS_CONFIG.length + 1);
    meta.isTarget = !auraData.buku1SavedDates[customIso];
    OPERATIONAL_DAYS_CONFIG.push(meta);
  }
});
if (!auraData.buku1History) {
  auraData.buku1History = JSON.parse(JSON.stringify(DEFAULT_BUKU1_HISTORY));
} else {
  if (!auraData.buku1History['2026-10-26']) {
    auraData.buku1History['2026-10-26'] = JSON.parse(JSON.stringify(DEFAULT_BUKU1_HISTORY['2026-10-26']));
  }
}
if (!auraData.buku2Belanja) {
  auraData.buku2Belanja = [];
}

if (!auraData.masterResep || !Array.isArray(auraData.masterResep) || auraData.masterResep.length === 0) {
  auraData.masterResep = JSON.parse(JSON.stringify(DEFAULT_MASTER_RESEP));
} else {
  // Kalibrasi otomatis jika formula standar (Ubi, Sayur, Roti) di LocalStorage mengandung anomali takaran (> Rp 1.500)
  ['prod_ubi', 'prod_sayur', 'prod_roti'].forEach(stdId => {
    const cur = auraData.masterResep.find(r => r.id === stdId);
    const def = DEFAULT_MASTER_RESEP.find(d => d.id === stdId);
    if (cur && def && (!cur.isUserModified || getProductUnitHPP(cur) > 1500)) {
      const idx = auraData.masterResep.findIndex(r => r.id === stdId);
      auraData.masterResep[idx] = JSON.parse(JSON.stringify(def));
    }
  });
}
try {
  localStorage.setItem(AURA_DB_KEY, JSON.stringify(auraData));
} catch (e) {}

// Sinkronisasi Satuan Fisik & Konversi Gram pada Manajemen Stok Bahan
function getStokGramRatio(stokItem) {
  const mbList = (auraData && auraData.masterBahan) ? auraData.masterBahan : INITIAL_MASTER_BAHAN;
  const n = (stokItem.nama || '').toLowerCase();
  if (n.includes('kulit lumpia')) {
    const m = mbList.find(x => x.nama.toLowerCase().includes('kulit lumpia'));
    return m ? (m.totalGram || 252) : 252; // 1 bungkus = 252g
  }
  if (n.includes('roti')) {
    const m = mbList.find(x => x.nama.toLowerCase().includes('roti'));
    return m ? (m.totalGram || 490) : 490; // 1 bungkus = totalGram
  }
  if (n.includes('ubi')) {
    const m = mbList.find(x => x.nama.toLowerCase().includes('ubi'));
    return m ? (m.gramPerUnit || 200) : 200; // 1 buah = 200g
  }
  if (n.includes('wortel')) {
    const m = mbList.find(x => x.nama.toLowerCase().includes('wortel'));
    return m ? (m.gramPerUnit || 125) : 125; // 1 buah = 125g
  }
  if (n.includes('jagung')) {
    const m = mbList.find(x => x.nama.toLowerCase().includes('jagung'));
    return m ? (m.gramPerUnit || 100) : 100; // 1 tongkol = 100g
  }
  if (n.includes('telur')) {
    const m = mbList.find(x => x.nama.toLowerCase().includes('telur'));
    return m ? (m.gramPerUnit || 55) : 55; // 1 butir = 55g
  }
  if (n.includes('daun bawang')) {
    const m = mbList.find(x => x.nama.toLowerCase().includes('daun bawang'));
    return m ? (m.gramPerUnit || 100) : 100; // 1 ikat = 100g
  }
  if (n.includes('sosis')) {
    const m = mbList.find(x => x.nama.toLowerCase().includes('sosis'));
    return m ? (m.gramPerUnit || 22) : 22; // 1 batang = 22g
  }
  if (n.includes('keju')) {
    const m = mbList.find(x => x.nama.toLowerCase().includes('keju'));
    return m ? (m.totalGram || 160) : 160; // 1 pouch = 160g
  }
  if (n.includes('collins')) {
    const m = mbList.find(x => x.nama.toLowerCase().includes('collins'));
    return m ? (m.totalGram || 1000) : 1000; // 1 ember = 1000g
  }
  if (n.includes('bawang putih')) {
    const m = mbList.find(x => x.nama.toLowerCase().includes('bawang putih'));
    return m ? (m.gramPerUnit || 5) : 5; // 1 siung = 5g
  }
  if (n.includes('panir')) {
    const m = mbList.find(x => x.nama.toLowerCase().includes('panir'));
    return m ? (m.totalGram || 1000) : 1000; // 1 bks = 1000g
  }
  if (n.includes('minyak')) {
    const m = mbList.find(x => x.nama.toLowerCase().includes('minyak'));
    return m ? (m.totalGram || 900) : 900; // 1 pouch = 900g
  }
  if (n.includes('gas')) {
    return 3000; // 1 tabung = 3000g
  }
  return stokItem.gramPerUnit || 100;
}

if (auraData.stokBahan) {
  auraData.stokBahan.forEach((s, idx) => {
    const def = INITIAL_AURA_DATA.stokBahan[idx];
    const ratio = getStokGramRatio(s);
    s.gramPerUnit = ratio;

    // Migrasi satuan lama 'gram' atau 'kg' menjadi satuan fisik alami (buah / siung / ember / bungkus) + stokGram
    if (s.nama.includes('Ubi') && s.satuan === 'kg') {
      s.stokGram = Math.round((s.stok || 0) * 1000);
      s.satuan = 'buah';
      s.stok = +(s.stokGram / ratio).toFixed(1);
      s.minTrigger = 5;
    } else if (s.nama.includes('Wortel') && s.satuan === 'gram') {
      s.stokGram = Math.round(s.stok || 0);
      s.satuan = 'buah';
      s.stok = +(s.stokGram / ratio).toFixed(1);
      s.minTrigger = 1.5;
    } else if (s.nama.includes('Bawang Putih') && s.satuan === 'gram') {
      s.stokGram = Math.round(s.stok || 0);
      s.satuan = 'siung';
      s.stok = Math.round(s.stokGram / ratio);
      s.minTrigger = 10;
    } else if (s.nama.includes('Collins') && s.satuan === 'gram') {
      s.stokGram = Math.round(s.stok || 0);
      s.satuan = 'ember';
      s.stok = +(s.stokGram / ratio).toFixed(2);
      s.minTrigger = 0.2;
    } else if (s.nama.includes('Panir') && s.satuan === 'gram') {
      s.stokGram = Math.round(s.stok || 0);
      s.satuan = 'bungkus';
      s.stok = +(s.stokGram / ratio).toFixed(2);
      s.minTrigger = 0.25;
    } else {
      if (!s.satuan && def) s.satuan = def.satuan;
      s.stokGram = Math.round((s.stok || 0) * ratio);
    }
  });
}
localStorage.setItem(AURA_DB_KEY, JSON.stringify(auraData));

function saveLocal() {
  if (auraData) auraData._lastUpdated = Date.now();
  localStorage.setItem(AURA_DB_KEY, JSON.stringify(auraData));
  renderAllViews();
  pushToFirestoreCloud();
}

// Ambil baris data Buku 1 untuk tanggal aktif
function getActiveBuku1Rows() {
  if (!auraData.buku1History) auraData.buku1History = JSON.parse(JSON.stringify(DEFAULT_BUKU1_HISTORY));
  if (!auraData.buku1History[activeDate]) {
    auraData.buku1History[activeDate] = JSON.parse(JSON.stringify(DEFAULT_BUKU1_HISTORY['2026-10-26'] || auraData.buku1Detail));
  }
  return auraData.buku1History[activeDate];
}

// ==============================================================
// MESIN AKUNTANSI TUNGGAL (SINGLE SOURCE OF TRUTH: DISTRIBUSI + KAS KELUAR -> ARUS KAS & DASHBOARD)
// SISTEM 2 AMPLOP DINAMIS: TARGET HPP + SABUK PENGAMAN KAS (ROLLING BUFFER DEFISIT)
// ==============================================================

function getProductUnitHPP(prod) {
  if (!prod || !prod.komposisi || !Array.isArray(prod.komposisi)) return 0;
  let totalHpp = 0;
  prod.komposisi.forEach(k => {
    if (k.isFixedCost) {
      totalHpp += (k.fixedCost || 0);
      return;
    }
    const meta = getMasterItemMeta(k.bahanKey, 10000, 100, k.isGram);
    let itemCost = 0;
    if (k.isGram) {
      itemCost = (k.qtyPerPcs || 0) * meta.gramCost;
    } else {
      itemCost = (k.qtyPerPcs || 0) * meta.unitCost;
    }
    if ((!itemCost || isNaN(itemCost) || itemCost <= 0) && k.fallbackCost) {
      itemCost = k.fallbackCost;
    }
    totalHpp += (itemCost || 0);
  });
  return Math.round(totalHpp);
}

function computeProductHPPUnits() {
  const recipes = (auraData && auraData.masterResep && auraData.masterResep.length > 0)
    ? auraData.masterResep
    : DEFAULT_MASTER_RESEP;
  const ubiProd = recipes.find(r => r.id === 'prod_ubi') || recipes[0];
  const sayurProd = recipes.find(r => r.id === 'prod_sayur') || recipes[1];
  const rotiProd = recipes.find(r => r.id === 'prod_roti') || recipes[2];

  const hppUbi = getProductUnitHPP(ubiProd);
  const hppSayur = getProductUnitHPP(sayurProd);
  const hppRoti = getProductUnitHPP(rotiProd);

  return { hppUbi, hppSayur, hppRoti };
}

function computeDayTargetHPP(isoDate) {
  const rows = (auraData.buku1History && auraData.buku1History[isoDate]) ? auraData.buku1History[isoDate] : [];
  let sumUbi = 0, sumSayur = 0, sumRoti = 0, sumBonus = 0;
  rows.forEach(r => {
    sumUbi += (r.ubi || 0);
    sumSayur += (r.sayur || 0);
    sumRoti += (r.roti || 0);
    sumBonus += (r.bonus || 0);
  });
  const bonusUbi = Math.ceil(sumBonus / 2);
  const bonusSayur = sumBonus - bonusUbi;
  const totalUbi = sumUbi + bonusUbi;
  const totalSayur = sumSayur + bonusSayur;
  const totalRoti = sumRoti;
  const totalPcs = totalUbi + totalSayur + totalRoti;

  if (totalPcs === 0) {
    const cfg = OPERATIONAL_DAYS_CONFIG.find(c => c.isoDate === isoDate);
    return cfg ? cfg.modal : 65000;
  }

  const { hppUbi, hppSayur, hppRoti } = computeProductHPPUnits();
  return Math.round((totalUbi * hppUbi) + (totalSayur * hppSayur) + (totalRoti * hppRoti));
}

function computeDayAccounting(isoDate, prevRollingEndapan) {
  const cfg = OPERATIONAL_DAYS_CONFIG.find(c => c.isoDate === isoDate) || {
    isoDate: isoDate,
    b2Key: isoDate.slice(8, 10) + '/' + isoDate.slice(5, 7),
    tgl: 5,
    hari: isoDate,
    namaHari: isoDate,
    shortLabel: isoDate,
    noBkk: 'BKK-' + isoDate.replace(/-/g, '') + '-01',
    modal: 65000,
    isTarget: false
  };

  const rows = (auraData.buku1History && auraData.buku1History[isoDate]) ? auraData.buku1History[isoDate] : [];
  let kirim = 0, bonus = 0, retur = 0, laku = 0, omzet = 0;
  rows.forEach(r => {
    kirim += (r.kirim || 0);
    bonus += (r.bonus || 0);
    retur += (r.retur || 0);
    laku += (r.laku || 0);
    omzet += (r.setor || 0);
  });

  const belanja = (auraData.buku2Belanja || [])
    .filter(b => b.tgl === cfg.b2Key)
    .reduce((sum, b) => sum + (b.biaya || 0), 0);

  const isSavedDay = !!(auraData.buku1SavedDates && auraData.buku1SavedDates[cfg.isoDate]);
  const isTarget = !isSavedDay && cfg.isTarget && belanja === 0 && retur === 0;

  // 1. Plafon Modal Dapur Dinamis: modal awal Amplop 1 adalah Rp 100.000 atau sesuai plafon operasional
  const targetHpp = computeDayTargetHPP(isoDate);
  let plafonModalBase = cfg.modal ? cfg.modal : (targetHpp > 0 ? targetHpp : 100000);
  // Jika belanja riil lebih besar dari plafon target (misal beli gas/minyak/collins bulk),
  // modal dapur tetap melindungi seluruh belanja aktual
  if (belanja > plafonModalBase) {
    plafonModalBase = belanja;
  }

  // 2. Sabuk Pengaman Kas: Tambal Defisit Kas Dapur Sebelumnya (jika ada)
  const prevEndapan = (prevRollingEndapan !== undefined) ? prevRollingEndapan : 0;
  const deficitToCover = prevEndapan < 0 ? Math.abs(prevEndapan) : 0;
  const totalAmplop1Needed = plafonModalBase + deficitToCover;

  let plafonModal = 0;
  let gajiBos = 0;

  if (omzet > 0) {
    if (omzet >= totalAmplop1Needed) {
      plafonModal = totalAmplop1Needed;
      gajiBos = omzet - totalAmplop1Needed;
    } else {
      plafonModal = omzet;
      gajiBos = 0;
    }
  } else {
    // Jika belum ada omzet (hari baru sebelum setor sore): Amplop 1 memegang modal kerja penuh
    plafonModal = plafonModalBase;
    gajiBos = 0;
  }

  const endapanHarian = plafonModal - belanja;
  const labaBersih = omzet - belanja;

  return {
    isoDate: cfg.isoDate,
    b2Key: cfg.b2Key,
    tgl: cfg.tgl,
    hari: cfg.hari,
    namaHari: cfg.namaHari,
    shortLabel: cfg.shortLabel,
    noBkk: cfg.noBkk,
    isTarget: isTarget,
    isSavedDay: isSavedDay,
    kirim,
    bonus,
    retur,
    laku,
    omzet,
    targetHpp,
    deficitToCover,
    plafonModal,
    gajiBos,
    belanja,
    endapanHarian,
    labaBersih
  };
}

function getAllDaysAccounting() {
  let cumGaji = 0;
  let cumEndapan = 0;
  let cumLaba = 0;
  return OPERATIONAL_DAYS_CONFIG.map(cfg => {
    const day = computeDayAccounting(cfg.isoDate, cumEndapan);
    if (!day.isTarget || day.isoDate === activeDate) {
      cumGaji += day.gajiBos;
      cumEndapan += day.endapanHarian;
      cumLaba += day.labaBersih;
    }
    day.cumGaji = cumGaji;
    day.cumEndapan = cumEndapan;
    day.cumLaba = cumLaba;
    return day;
  });
}

// ==============================================================
// STAGE 4: UNIVERSAL CUSTOM MODAL SYSTEM (REPLACES BROWSER ALERTS)
// ==============================================================
let modalConfirmCallback = null;
let modalCancelCallback = null;

window.closeAppModal = function() {
  const overlay = document.getElementById('appModalOverlay');
  const dialog = document.getElementById('appModalDialog');
  if (overlay) overlay.style.display = 'none';
  if (dialog) dialog.style.maxWidth = '';
  modalConfirmCallback = null;
  modalCancelCallback = null;
};

window.handleModalBackdropClick = function(event) {
  if (event.target && event.target.id === 'appModalOverlay') {
    window.closeAppModal();
  }
};

window.showSuccessModal = function(title, message, onOk) {
  const overlay = document.getElementById('appModalOverlay');
  const icon = document.getElementById('appModalIcon');
  const titleEl = document.getElementById('appModalTitle');
  const body = document.getElementById('appModalBody');
  const footer = document.getElementById('appModalFooter');

  if (!overlay) return;
  if (icon) { icon.innerHTML = ''; icon.style.display = 'none'; }
  if (titleEl) titleEl.innerText = title || 'Berhasil';
  if (body) body.innerHTML = '<p style="color: #F8FAFC; font-size: 0.9rem; line-height: 1.6;">' + message.replace(/\n/g, '<br>') + '</p>';
  if (footer) {
    footer.innerHTML = '<button type="button" class="tool-btn tool-btn-success" id="btnModalOk" style="min-width: 100px; font-weight: 800;">OK, Mengerti</button>';
    const btn = document.getElementById('btnModalOk');
    if (btn) {
      btn.onclick = () => {
        window.closeAppModal();
        if (typeof onOk === 'function') onOk();
      };
    }
  }
  overlay.style.display = 'flex';
};

window.showAlertModal = function(title, message, onOk) {
  const overlay = document.getElementById('appModalOverlay');
  const icon = document.getElementById('appModalIcon');
  const titleEl = document.getElementById('appModalTitle');
  const body = document.getElementById('appModalBody');
  const footer = document.getElementById('appModalFooter');

  if (!overlay) return;
  if (icon) { icon.innerHTML = ''; icon.style.display = 'none'; }
  if (titleEl) titleEl.innerText = title || 'Perhatian';
  if (body) body.innerHTML = '<p style="color: #FBBF24; font-size: 0.9rem; line-height: 1.6;">' + message.replace(/\n/g, '<br>') + '</p>';
  if (footer) {
    footer.innerHTML = '<button type="button" class="tool-btn" id="btnModalOk" style="min-width: 100px; font-weight: 800; background: #334155; color: white;">Tutup</button>';
    const btn = document.getElementById('btnModalOk');
    if (btn) {
      btn.onclick = () => {
        window.closeAppModal();
        if (typeof onOk === 'function') onOk();
      };
    }
  }
  overlay.style.display = 'flex';
};

window.showErrorModal = function(title, message, onOk) {
  const overlay = document.getElementById('appModalOverlay');
  const icon = document.getElementById('appModalIcon');
  const titleEl = document.getElementById('appModalTitle');
  const body = document.getElementById('appModalBody');
  const footer = document.getElementById('appModalFooter');

  if (!overlay) return;
  if (icon) { icon.innerHTML = ''; icon.style.display = 'none'; }
  if (titleEl) titleEl.innerText = title || 'Terjadi Kesalahan';
  if (body) body.innerHTML = '<p style="color: #F87171; font-size: 0.9rem; line-height: 1.6;">' + message.replace(/\n/g, '<br>') + '</p>';
  if (footer) {
    footer.innerHTML = '<button type="button" class="tool-btn" id="btnModalOk" style="min-width: 100px; font-weight: 800; background: #EF4444; color: white;">Tutup</button>';
    const btn = document.getElementById('btnModalOk');
    if (btn) {
      btn.onclick = () => {
        window.closeAppModal();
        if (typeof onOk === 'function') onOk();
      };
    }
  }
  overlay.style.display = 'flex';
};

window.showConfirmModal = function(title, message, onConfirm, onCancel) {
  const overlay = document.getElementById('appModalOverlay');
  const icon = document.getElementById('appModalIcon');
  const titleEl = document.getElementById('appModalTitle');
  const body = document.getElementById('appModalBody');
  const footer = document.getElementById('appModalFooter');

  if (!overlay) return;
  if (icon) { icon.innerHTML = ''; icon.style.display = 'none'; }
  if (titleEl) titleEl.innerText = title || 'Konfirmasi Tindakan';
  if (body) body.innerHTML = '<p style="color: #F8FAFC; font-size: 0.9rem; line-height: 1.6;">' + message.replace(/\n/g, '<br>') + '</p>';
  if (footer) {
    footer.innerHTML = 
      '<button type="button" class="tool-btn" id="btnModalCancel" style="background: #334155; color: #CBD5E1;">Batal</button>' +
      '<button type="button" class="tool-btn tool-btn-success" id="btnModalConfirm" style="font-weight: 800;">Ya, Lanjutkan</button>';

    const btnConf = document.getElementById('btnModalConfirm');
    const btnCanc = document.getElementById('btnModalCancel');
    if (btnConf) {
      btnConf.onclick = () => {
        window.closeAppModal();
        if (typeof onConfirm === 'function') onConfirm();
      };
    }
    if (btnCanc) {
      btnCanc.onclick = () => {
        window.closeAppModal();
        if (typeof onCancel === 'function') onCancel();
      };
    }
  }
  overlay.style.display = 'flex';
};

// ==============================================================
// STAGE 1: UNIVERSAL DATE STEPPER & CALENDAR DISPLAY ENGINE
// ==============================================================
function syncDateDisplays() {
  if (!OPERATIONAL_DAYS_CONFIG.some(c => c.isoDate === activeDate)) {
    OPERATIONAL_DAYS_CONFIG.push(buildDayMetaFromIso(activeDate, OPERATIONAL_DAYS_CONFIG.length + 1));
  }
  const curCfg = OPERATIONAL_DAYS_CONFIG.find(c => c.isoDate === activeDate) || buildDayMetaFromIso(activeDate, 1);
  const isSaved = !!(auraData.buku1SavedDates && auraData.buku1SavedDates[activeDate]);
  
  let statusSuffix = '';
  if (activeDate === REAL_TODAY_ISO) {
    statusSuffix = isSaved ? ' (Hari Ini • Tersimpan)' : ' (Hari Ini)';
  } else if (isSaved) {
    statusSuffix = ' (Tersimpan)';
  } else {
    statusSuffix = ' (Draft)';
  }

  const labelText = curCfg.namaHari + statusSuffix;

  // Update text label pada ketiga tab
  const dashTextEl = document.getElementById('dashboardDateText');
  const b1TextEl = document.getElementById('buku1DateText');
  const kuitansiTextEl = document.getElementById('kuitansiDateText');
  if (dashTextEl) dashTextEl.innerText = labelText;
  if (b1TextEl) b1TextEl.innerText = labelText;
  if (kuitansiTextEl) kuitansiTextEl.innerText = labelText;

  // Update input datepicker kalender agar kalender otomatis membuka tanggal aktif
  const pickerDash = document.getElementById('nativeDatePickerDashboard');
  const pickerB1 = document.getElementById('nativeDatePickerBuku1');
  const pickerB2 = document.getElementById('nativeDatePickerBuku2');
  if (pickerDash) pickerDash.value = activeDate;
  if (pickerB1) pickerB1.value = activeDate;
  if (pickerB2) pickerB2.value = activeDate;

  // Update Status Pill Tag
  const tagEl = document.getElementById('dateSessionTag');
  if (tagEl) {
    if (activeDate === REAL_TODAY_ISO) {
      tagEl.innerText = isSaved ? 'Hari Ini • Tersimpan' : 'Hari Ini • Mode Input';
      tagEl.style.background = isSaved ? 'rgba(52, 211, 153, 0.2)' : 'rgba(56, 189, 248, 0.2)';
      tagEl.style.color = isSaved ? '#34D399' : '#38BDF8';
    } else if (isSaved) {
      tagEl.innerText = 'Data Tersimpan';
      tagEl.style.background = 'rgba(52, 211, 153, 0.2)';
      tagEl.style.color = '#34D399';
    } else {
      tagEl.innerText = 'Draft Rencana';
      tagEl.style.background = 'rgba(251, 191, 36, 0.2)';
      tagEl.style.color = '#FBBF24';
    }
  }

  // Update print date display
  const b1PrintDateDisplay = document.getElementById('buku1PrintDateDisplay');
  if (b1PrintDateDisplay) b1PrintDateDisplay.innerText = curCfg.namaHari;
}

window.stepDate = function(offsetDays) {
  const parts = activeDate.split('-').map(Number);
  const y = parts[0];
  const m = parts[1] || 1;
  const d = parts[2] || 1;
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + offsetDays);

  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  const targetIso = ny + '-' + nm + '-' + nd;

  window.switchDate(targetIso);
};

window.goToToday = function() {
  const todayIso = getRealTodayIso();
  window.switchDate(todayIso);
};

window.switchDate = function(dateStr) {
  if (!dateStr) return;
  activeDate = dateStr;

  if (!OPERATIONAL_DAYS_CONFIG.some(c => c.isoDate === activeDate)) {
    OPERATIONAL_DAYS_CONFIG.push(buildDayMetaFromIso(activeDate, OPERATIONAL_DAYS_CONFIG.length + 1));
  }

  const matchedDayCfg = OPERATIONAL_DAYS_CONFIG.find(c => c.isoDate === activeDate);
  if (matchedDayCfg) {
    selectedBuku2Date = matchedDayCfg.b2Key;
    if (!KUITANSI_DATE_CONFIG[matchedDayCfg.b2Key]) {
      KUITANSI_DATE_CONFIG[matchedDayCfg.b2Key] = {
        namaHari: matchedDayCfg.namaHari,
        noBkk: matchedDayCfg.noBkk,
        modal: matchedDayCfg.modal || 100000
      };
    }
  }

  syncDateDisplays();
  renderAllViews();
};

window.switchBuku1Date = function(dateStr) {
  window.switchDate(dateStr);
};

window.switchBuku2Date = function(b2Key) {
  selectedBuku2Date = b2Key;
  const matchedCfg = OPERATIONAL_DAYS_CONFIG.find(c => c.b2Key === b2Key);
  if (matchedCfg) {
    activeDate = matchedCfg.isoDate;
  }
  syncDateDisplays();
  renderAllViews();
};

// Set Hari Ini pada Buku 1
window.setBuku1Today = function() {
  const todayIso = getRealTodayIso();
  if (!OPERATIONAL_DAYS_CONFIG.some(c => c.isoDate === todayIso)) {
    OPERATIONAL_DAYS_CONFIG.push(buildDayMetaFromIso(todayIso, OPERATIONAL_DAYS_CONFIG.length + 1));
  }
  if (!auraData.buku1History[todayIso]) {
    auraData.buku1History[todayIso] = JSON.parse(JSON.stringify(DEFAULT_BUKU1_HISTORY['2026-10-26'] || getActiveBuku1Rows()));
  }
  activeDate = todayIso;
  buku1EditModeDates[todayIso] = true;
  saveLocal();
  window.showSuccessModal(
    "Lembar Hari Ini Siap",
    "Lembar Kontrol Konsinyasi untuk hari ini (" + (OPERATIONAL_DAYS_CONFIG.find(c => c.isoDate === todayIso)?.namaHari || todayIso) + ") telah diaktifkan dalam Mode Input. Silakan isi data lalu klik 'Simpan Hari Ini'."
  );
};

// Tambah Lembar Tanggal Baru pada Buku 1
window.openAddBuku1DateModal = function() {
  const overlay = document.getElementById('appModalOverlay');
  const icon = document.getElementById('appModalIcon');
  const titleEl = document.getElementById('appModalTitle');
  const body = document.getElementById('appModalBody');
  const footer = document.getElementById('appModalFooter');

  if (!overlay) return;
  if (icon) { icon.innerHTML = ''; icon.style.display = 'none'; }
  if (titleEl) titleEl.innerText = 'Set Lembar Tanggal Konsinyasi Baru';

  body.innerHTML =
    '<div style="margin-bottom: 12px;">' +
      '<label class="form-label">Pilih Tanggal Operasional</label>' +
      '<input type="date" id="inputNewBuku1IsoDate" class="form-control-slate" value="' + REAL_TODAY_ISO + '">' +
    '</div>' +
    '<p style="font-size: 0.8rem; color: var(--text-secondary);">Sistem akan menyiapkan tabel 6 titik konsinyasi untuk tanggal tersebut agar Anda dapat mengatur rencana kirim maupun mencatat setoran.</p>';

  footer.innerHTML =
    '<button type="button" class="tool-btn" onclick="window.closeAppModal()" style="background: #334155; color: #CBD5E1;">Batal</button>' +
    '<button type="button" class="tool-btn tool-btn-success" id="btnConfirmNewBuku1Date" style="font-weight: 800;">Buka & Set Tanggal</button>';

  const btnConf = document.getElementById('btnConfirmNewBuku1Date');
  if (btnConf) {
    btnConf.onclick = () => {
      const isoVal = (document.getElementById('inputNewBuku1IsoDate')?.value || '').trim();
      if (!isoVal) return;

      if (!OPERATIONAL_DAYS_CONFIG.some(c => c.isoDate === isoVal)) {
        OPERATIONAL_DAYS_CONFIG.push(buildDayMetaFromIso(isoVal, OPERATIONAL_DAYS_CONFIG.length + 1));
      }
      if (!auraData.buku1CustomDays) auraData.buku1CustomDays = [];
      if (!auraData.buku1CustomDays.includes(isoVal)) {
        auraData.buku1CustomDays.push(isoVal);
      }
      if (!auraData.buku1History[isoVal]) {
        auraData.buku1History[isoVal] = JSON.parse(JSON.stringify(getActiveBuku1Rows()));
        auraData.buku1History[isoVal].forEach(r => {
          r.retur = 0;
          r.laku = r.kirim;
          const rate = r.hargaSetor !== undefined ? r.hargaSetor : (r.nama.includes('Ragil') ? 1000 : 800);
          r.setor = r.laku * rate;
        });
      }

      activeDate = isoVal;
      buku1EditModeDates[isoVal] = true;
      window.closeAppModal();
      saveLocal();
    };
  }
  overlay.style.display = 'flex';
};

// Simpan & Kunci Data Hari Aktif di Buku 1
window.saveAndLockBuku1Day = function() {
  if (!auraData.buku1SavedDates) auraData.buku1SavedDates = {};
  auraData.buku1SavedDates[activeDate] = true;
  buku1EditModeDates[activeDate] = false;

  const cfg = OPERATIONAL_DAYS_CONFIG.find(c => c.isoDate === activeDate);
  if (cfg) cfg.isTarget = false;

  saveLocal();
  window.showSuccessModal(
    "Data Hari Ini Tersimpan",
    "Data Kontrol Konsinyasi untuk tanggal " + (cfg ? cfg.namaHari : activeDate) + " telah disimpan dan dikunci. Jika sewaktu-waktu diperlukan perubahan, klik tombol 'Edit Data' atau tombol 'Edit' pada baris warung."
  );
};

// Buka Kembali Kunci Edit pada Buku 1
window.toggleEditBuku1Day = function() {
  buku1EditModeDates[activeDate] = true;
  renderAllViews();
};

// Modal Edit Per Baris Titik Konsinyasi di Buku 1
window.openEditBuku1RowModal = function(idx) {
  const rows = getActiveBuku1Rows();
  const r = rows[idx];
  if (!r) return;

  const overlay = document.getElementById('appModalOverlay');
  const icon = document.getElementById('appModalIcon');
  const titleEl = document.getElementById('appModalTitle');
  const body = document.getElementById('appModalBody');
  const footer = document.getElementById('appModalFooter');

  if (!overlay) return;
  if (icon) { icon.innerHTML = ''; icon.style.display = 'none'; }
  if (titleEl) titleEl.innerText = 'Edit Data Konsinyasi: ' + r.nama;

  const unitRate = r.hargaSetor !== undefined ? r.hargaSetor : (r.nama.includes('Ragil') ? 1000 : 800);

  body.innerHTML =
    '<form id="formEditBuku1Row">' +
      '<div style="margin-bottom: 10px;">' +
        '<label class="form-label">Nama Warung / Kantin</label>' +
        '<input type="text" id="b1EditNama" class="form-control-slate" value="' + r.nama + '" required>' +
      '</div>' +
      '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px;">' +
        '<div>' +
          '<label class="form-label">Ubi (Pcs)</label>' +
          '<input type="number" id="b1EditUbi" class="form-control-slate" value="' + r.ubi + '" min="0">' +
        '</div>' +
        '<div>' +
          '<label class="form-label">Sayur (Pcs)</label>' +
          '<input type="number" id="b1EditSayur" class="form-control-slate" value="' + r.sayur + '" min="0">' +
        '</div>' +
        '<div>' +
          '<label class="form-label">Roti (Pcs)</label>' +
          '<input type="number" id="b1EditRoti" class="form-control-slate" value="' + r.roti + '" min="0">' +
        '</div>' +
        '<div>' +
          '<label class="form-label">Bonus (Pcs)</label>' +
          '<input type="number" id="b1EditBonus" class="form-control-slate" value="' + r.bonus + '" min="0">' +
        '</div>' +
      '</div>' +
      '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px;">' +
        '<div>' +
          '<label class="form-label">Retur Sore (Pcs)</label>' +
          '<input type="number" id="b1EditRetur" class="form-control-slate" value="' + r.retur + '" min="0">' +
        '</div>' +
        '<div>' +
          '<label class="form-label">Tarif Setor / Pcs</label>' +
          '<input type="number" id="b1EditRate" class="form-control-slate" value="' + unitRate + '" min="0">' +
        '</div>' +
        '<div>' +
          '<label class="form-label">Setoran Net (Rp)</label>' +
          '<input type="number" id="b1EditSetor" class="form-control-slate" value="' + r.setor + '" min="0">' +
        '</div>' +
      '</div>' +
      '<p style="font-size: 0.75rem; color: var(--text-muted);">Catatan: Jika Ubi/Sayur/Roti atau Retur diubah, jumlah Laku dan Setoran Net akan menyesuaikan otomatis kecuali Anda mengetik Setoran Net secara spesifik.</p>' +
    '</form>';

  // Re-calculate setor preview inside modal when ubi/sayur/roti/retur/rate changes
  const recalcModalPreview = () => {
    const u = Math.max(0, parseInt(document.getElementById('b1EditUbi')?.value, 10) || 0);
    const s = Math.max(0, parseInt(document.getElementById('b1EditSayur')?.value, 10) || 0);
    const rt = Math.max(0, parseInt(document.getElementById('b1EditRoti')?.value, 10) || 0);
    const ret = Math.max(0, parseInt(document.getElementById('b1EditRetur')?.value, 10) || 0);
    const rate = Math.max(0, parseInt(document.getElementById('b1EditRate')?.value, 10) || 800);
    const kirim = u + s + rt;
    const laku = Math.max(0, kirim - ret);
    const setorEl = document.getElementById('b1EditSetor');
    if (setorEl) setorEl.value = laku * rate;
  };

  setTimeout(() => {
    ['b1EditUbi', 'b1EditSayur', 'b1EditRoti', 'b1EditRetur', 'b1EditRate'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', recalcModalPreview);
    });
  }, 20);

  footer.innerHTML =
    '<button type="button" class="tool-btn" onclick="window.closeAppModal()" style="background: #334155; color: #CBD5E1;">Batal</button>' +
    '<button type="button" class="tool-btn tool-btn-success" id="btnSaveB1RowModal" style="font-weight: 800;">Simpan Perubahan</button>';

  const btnSave = document.getElementById('btnSaveB1RowModal');
  if (btnSave) {
    btnSave.onclick = () => {
      const nama = (document.getElementById('b1EditNama')?.value || '').trim() || r.nama;
      const ubi = Math.max(0, parseInt(document.getElementById('b1EditUbi')?.value, 10) || 0);
      const sayur = Math.max(0, parseInt(document.getElementById('b1EditSayur')?.value, 10) || 0);
      const roti = Math.max(0, parseInt(document.getElementById('b1EditRoti')?.value, 10) || 0);
      const bonus = Math.max(0, parseInt(document.getElementById('b1EditBonus')?.value, 10) || 0);
      const kirim = ubi + sayur + roti;
      const retur = Math.min(kirim, Math.max(0, parseInt(document.getElementById('b1EditRetur')?.value, 10) || 0));
      const laku = Math.max(0, kirim - retur);
      const hargaSetor = Math.max(0, parseInt(document.getElementById('b1EditRate')?.value, 10) || 800);
      const setor = Math.max(0, parseInt(document.getElementById('b1EditSetor')?.value, 10) || 0);

      r.nama = nama;
      r.ubi = ubi;
      r.sayur = sayur;
      r.roti = roti;
      r.bonus = bonus;
      r.kirim = kirim;
      r.retur = retur;
      r.laku = laku;
      r.hargaSetor = hargaSetor;
      r.setor = setor;

      window.syncRecipeFromBuku1(false);
      window.closeAppModal();
      saveLocal();
      window.showSuccessModal("Baris Diperbarui", 'Data konsinyasi "' + nama + '" berhasil diperbarui dan disimpan.');
    };
  }

  overlay.style.display = 'flex';
};

window.switchChartPeriod = function(period) {
  currentChartPeriod = period;
  document.querySelectorAll('.chart-time-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-period') === period);
  });
  renderAccountingChart();
};

// Cetak Lembar Kontrol Konsinyasi A5
window.printBuku1 = function() {
  window.print();
};

window.saveBuku1 = function() {
  window.saveAndLockBuku1Day();
};

// Global Tab Switcher
window.switchTab = function(tabId) {
  document.querySelectorAll('.nav-item-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.app-tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === tabId);
  });
  window.toggleSidebar(false);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Drawer Navigasi Mobile
window.toggleSidebar = function(forceOpen) {
  const sidebar = document.querySelector('.app-sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!sidebar) return;
  const shouldOpen = forceOpen !== undefined ? forceOpen : !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', shouldOpen);
  if (backdrop) backdrop.classList.toggle('open', shouldOpen);
};

// Backup Data
window.backupData = function() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auraData, null, 2));
  const dlAnchor = document.createElement('a');
  const nowStr = new Date().toISOString().slice(0, 10);
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", "Dapur_Mom_Fitri_Backup_" + nowStr + ".json");
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
  window.showSuccessModal("Cadangan Terunduh", "File backup operasional berhasil diunduh. Simpan file ini di folder aman.");
};

// Restore Data
window.restoreData = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed && (parsed.titik || parsed.buku1Detail || parsed.buku1History)) {
        auraData = parsed;
        saveLocal();
        window.showSuccessModal("Pemulihan Berhasil", "Basis data operasional Dapur Mom Fitri berhasil dipulihkan dari file backup!");
      } else {
        window.showErrorModal("Format Salah", "Format file JSON tidak sesuai dengan basis data Dapur Mom Fitri!");
      }
    } catch (err) {
      window.showErrorModal("Gagal Membaca File", "Terjadi kesalahan saat membaca file backup: " + err.message);
    }
  };
  reader.readAsText(file);
};

// ==============================================================
// UPDATE BUKU 1 ROWS (RENCANA PRODUKSI, RETUR, SETOR) & SINKRONISASI REAKTIF
// ==============================================================
window.updateBuku1RowPlan = function(idx, field, val) {
  const num = Math.max(0, parseInt(val, 10) || 0);
  const rows = getActiveBuku1Rows();
  const row = rows[idx];
  if (!row) return;

  row[field] = num;
  row.kirim = (row.ubi || 0) + (row.sayur || 0) + (row.roti || 0);
  if (row.retur > row.kirim) row.retur = row.kirim;
  row.laku = Math.max(0, row.kirim - (row.retur || 0));
  const unitRate = row.hargaSetor !== undefined ? row.hargaSetor : (row.nama.includes('Ragil') ? 1000 : 800);
  row.setor = row.laku * unitRate;

  window.syncRecipeFromBuku1(false);
  saveLocal();
};

window.syncRecipeFromBuku1 = function(showNotice) {
  const rows = getActiveBuku1Rows();
  let sumUbi = 0, sumSayur = 0, sumRoti = 0, sumBonus = 0;
  rows.forEach(r => {
    sumUbi += (r.ubi || 0);
    sumSayur += (r.sayur || 0);
    sumRoti += (r.roti || 0);
    sumBonus += (r.bonus || 0);
  });

  // Alokasikan bonus secara proporsional atau ke varian utama (Ubi & Sayur)
  const bonusUbi = Math.ceil(sumBonus / 2);
  const bonusSayur = sumBonus - bonusUbi;

  const ubiInput = document.getElementById('calcUbiPcs');
  const sayurInput = document.getElementById('calcSayurPcs');
  const rotiInput = document.getElementById('calcRotiPcs');

  if (ubiInput) ubiInput.value = sumUbi + bonusUbi;
  if (sayurInput) sayurInput.value = sumSayur + bonusSayur;
  if (rotiInput) rotiInput.value = sumRoti;

  window.calculateTakaran();
  if (showNotice) {
    window.showSuccessModal(
      "Target Produksi Disinkronkan",
      "Rencana produksi subuh berhasil ditarik dari Distribusi Mitra (" + (sumUbi + sumSayur + sumRoti) + " pcs jatah jual + " + sumBonus + " pcs bonus pemilik = " + (sumUbi + sumSayur + sumRoti + sumBonus) + " pcs total)."
    );
  }
};

window.updateBuku1RowRetur = function(idx, val) {
  const r = parseInt(val, 10) || 0;
  const rows = getActiveBuku1Rows();
  const row = rows[idx];
  if (!row) return;

  row.retur = r;
  row.laku = Math.max(0, row.kirim - r);
  const unitRate = row.hargaSetor !== undefined ? row.hargaSetor : (row.nama.includes('Ragil') ? 1000 : 800);
  row.setor = row.laku * unitRate;

  // Sinkronkan ke titik jika tanggal aktif adalah 21 Okt
  if (activeDate === '2026-10-21' && auraData.titik[idx]) {
    auraData.titik[idx].retur = r;
    auraData.titik[idx].laku = row.laku;
    auraData.titik[idx].setor = row.setor;
    auraData.titik[idx].status = r === 0 ? 'done' : 'progress';
  }

  saveLocal();
};

window.updateBuku1RowSetor = function(idx, val) {
  const s = parseInt(val, 10) || 0;
  const rows = getActiveBuku1Rows();
  const row = rows[idx];
  if (!row) return;

  row.setor = Math.max(0, s);
  if (activeDate === '2026-10-21' && auraData.titik[idx]) {
    auraData.titik[idx].setor = row.setor;
  }
  saveLocal();
};

// Edit Tarif Slip Box
window.updateSlipRate = function(idx, field, val) {
  const rate = parseInt(val, 10) || 0;
  const rows = getActiveBuku1Rows();
  const row = rows[idx];
  if (!row) return;
  row[field] = Math.max(0, rate);

  if (field === 'hargaSetor') {
    row.setor = row.laku * row.hargaSetor;
    if (activeDate === '2026-10-21' && auraData.titik[idx]) {
      auraData.titik[idx].setor = row.setor;
    }
  }
  saveLocal();
};

// ==============================================================
// STAGE 1: ACCOUNTING CHARTS & EXECUTIVE SCORECARDS (100% REAL-TIME & BALANCE)
// ==============================================================
function renderExecutiveFinancials() {
  const allDays = getAllDaysAccounting();
  const curDay = allDays.find(d => d.isoDate === activeDate) || computeDayAccounting(activeDate);

  const pctTerjual = curDay.kirim > 0 ? ((curDay.laku / curDay.kirim) * 100).toFixed(1) : '0.0';
  const cumGaji = curDay.cumGaji !== undefined ? curDay.cumGaji : curDay.gajiBos;
  const cumEndapan = curDay.cumEndapan !== undefined ? curDay.cumEndapan : curDay.endapanHarian;
  const totalKasBersih = cumGaji + cumEndapan;

  // Update Top-Right Balance Card (Akumulasi Kas Bersih s/d Tanggal Terpilih)
  const balanceDisplay = document.getElementById('balanceDisplay');
  const balanceSubDisplay = document.getElementById('balanceSubDisplay');
  if (balanceDisplay) balanceDisplay.innerText = 'Rp ' + totalKasBersih.toLocaleString('id-ID');
  if (balanceSubDisplay) {
    balanceSubDisplay.innerText = 'Dompet Bos: Rp ' + cumGaji.toLocaleString('id-ID') + ' • Kotak Dapur: Rp ' + cumEndapan.toLocaleString('id-ID');
  }

  // Update 5 Financial Scorecards (100% Sinkron dengan Distribusi, Belanja, dan Arus Kas)
  const omzetEl = document.getElementById('kpiOmzetVal');
  const omzetSubEl = document.getElementById('kpiOmzetSub');
  const belanjaEl = document.getElementById('kpiBelanjaVal');
  const belanjaSubEl = document.getElementById('kpiBelanjaSub');
  const labaEl = document.getElementById('kpiLabaVal');
  const labaSubEl = document.getElementById('kpiLabaSub');
  const gajiEl = document.getElementById('kpiGajiVal');
  const gajiSubEl = document.getElementById('kpiGajiSub');
  const endapanEl = document.getElementById('kpiEndapanVal');
  const endapanSubEl = document.getElementById('kpiEndapanSub');

  if (omzetEl) omzetEl.innerText = 'Rp ' + curDay.omzet.toLocaleString('id-ID');
  if (omzetSubEl) omzetSubEl.innerText = curDay.laku + ' / ' + curDay.kirim + ' pcs terjual (' + pctTerjual + '%)';

  if (belanjaEl) belanjaEl.innerText = 'Rp ' + curDay.belanja.toLocaleString('id-ID');
  if (belanjaSubEl) {
    if (curDay.deficitToCover > 0) {
      belanjaSubEl.innerText = 'Plafon: Rp ' + curDay.plafonModal.toLocaleString('id-ID') + ' (tambal defisit Rp ' + curDay.deficitToCover.toLocaleString('id-ID') + ')';
    } else {
      belanjaSubEl.innerText = curDay.belanja > 0
        ? 'Plafon HPP: Rp ' + curDay.plafonModal.toLocaleString('id-ID')
        : 'Target HPP: Rp ' + curDay.plafonModal.toLocaleString('id-ID');
    }
  }

  if (labaEl) labaEl.innerText = 'Rp ' + curDay.labaBersih.toLocaleString('id-ID');
  if (labaSubEl) {
    const endapanPart = curDay.endapanHarian >= 0
      ? '+ Endapan Rp ' + curDay.endapanHarian.toLocaleString('id-ID')
      : '- Subsidi Rp ' + Math.abs(curDay.endapanHarian).toLocaleString('id-ID');
    labaSubEl.innerText = 'Gaji Rp ' + curDay.gajiBos.toLocaleString('id-ID') + ' ' + endapanPart;
  }

  if (gajiEl) gajiEl.innerText = 'Rp ' + curDay.gajiBos.toLocaleString('id-ID');
  if (gajiSubEl) {
    gajiSubEl.innerText = curDay.deficitToCover > 0
      ? 'Omzet - Plafon HPP - Defisit (Rp ' + curDay.deficitToCover.toLocaleString('id-ID') + ')'
      : 'Laba bersih dompet bos (Amplop 2)';
  }

  if (endapanEl) {
    endapanEl.innerText = curDay.endapanHarian < 0
      ? '-Rp ' + Math.abs(curDay.endapanHarian).toLocaleString('id-ID')
      : 'Rp ' + curDay.endapanHarian.toLocaleString('id-ID');
    endapanEl.style.color = curDay.endapanHarian < 0 ? '#FB7185' : '#FBBF24';
  }
  if (endapanSubEl) {
    endapanSubEl.innerText = 'Saldo cadangan kotak: Rp ' + cumEndapan.toLocaleString('id-ID');
  }

  const rankDateTag = document.getElementById('rankDateTag');
  if (rankDateTag) {
    rankDateTag.innerText = curDay.namaHari || activeDate;
  }
}

function renderAccountingChart() {
  const container = document.getElementById('accountingChartContainer');
  const subTitle = document.getElementById('chartSubtitleDisplay');
  const summaryBox = document.getElementById('chartPeriodSummary');
  if (!container) return;

  container.innerHTML = '';
  const allDays = getAllDaysAccounting();
  const d19 = allDays.find(d => d.isoDate === '2026-10-19') || computeDayAccounting('2026-10-19');
  const d20 = allDays.find(d => d.isoDate === '2026-10-20') || computeDayAccounting('2026-10-20');
  const d21 = allDays.find(d => d.isoDate === '2026-10-21') || computeDayAccounting('2026-10-21');
  const d22 = allDays.find(d => d.isoDate === '2026-10-22') || computeDayAccounting('2026-10-22');
  const d23 = allDays.find(d => d.isoDate === '2026-10-23') || computeDayAccounting('2026-10-23');

  // Hanya masukkan hari target (belum ada belanja/retur) jika hari tersebut sedang dipilih aktif
  const verifiedDays = allDays.filter(d => !d.isTarget || d.isoDate === activeDate);
  const w4Days = [d22, d23].filter(d => !d.isTarget || d.isoDate === activeDate);

  let chartData = [];

  if (currentChartPeriod === 'mingguan') {
    if (subTitle) subTitle.innerText = 'Rekapitulasi Mingguan (19 - 24 Oktober 2026)';
    chartData = [
      { label: 'SEN 19/10', omzet: d19.omzet, belanja: d19.belanja, laba: d19.labaBersih, gaji: d19.gajiBos, endapan: d19.endapanHarian, isCurrent: activeDate === '2026-10-19', isTarget: false },
      { label: 'SEL 20/10', omzet: d20.omzet, belanja: d20.belanja, laba: d20.labaBersih, gaji: d20.gajiBos, endapan: d20.endapanHarian, isCurrent: activeDate === '2026-10-20', isTarget: false },
      { label: 'RAB 21/10', omzet: d21.omzet, belanja: d21.belanja, laba: d21.labaBersih, gaji: d21.gajiBos, endapan: d21.endapanHarian, isCurrent: activeDate === '2026-10-21', isTarget: false },
      { label: 'KAM 22/10' + (d22.isTarget ? '*' : ''), omzet: d22.omzet, belanja: d22.belanja, laba: d22.labaBersih, gaji: d22.gajiBos, endapan: d22.endapanHarian, isCurrent: activeDate === '2026-10-22', isTarget: d22.isTarget },
      { label: 'JUM 23/10' + (d23.isTarget ? '*' : ''), omzet: d23.omzet, belanja: d23.belanja, laba: d23.labaBersih, gaji: d23.gajiBos, endapan: d23.endapanHarian, isCurrent: activeDate === '2026-10-23', isTarget: d23.isTarget },
      { label: 'SAB 24/10', omzet: 0, belanja: 0, laba: 0, gaji: 0, endapan: 0, isCurrent: activeDate === '2026-10-24', isTarget: false }
    ];
  } else if (currentChartPeriod === 'bulanan') {
    if (subTitle) subTitle.innerText = 'Akumulasi Bulanan (Oktober 2026)';
    const w3Omzet = d19.omzet + d20.omzet + d21.omzet;
    const w3Belanja = d19.belanja + d20.belanja + d21.belanja;
    const w3Laba = d19.labaBersih + d20.labaBersih + d21.labaBersih;
    const w3Gaji = d19.gajiBos + d20.gajiBos + d21.gajiBos;
    const w3Endapan = d19.endapanHarian + d20.endapanHarian + d21.endapanHarian;

    const w4Omzet = w4Days.reduce((s, x) => s + x.omzet, 0);
    const w4Belanja = w4Days.reduce((s, x) => s + x.belanja, 0);
    const w4Laba = w4Days.reduce((s, x) => s + x.labaBersih, 0);
    const w4Gaji = w4Days.reduce((s, x) => s + x.gajiBos, 0);
    const w4Endapan = w4Days.reduce((s, x) => s + x.endapanHarian, 0);

    chartData = [
      { label: 'Minggu 1', omzet: 0, belanja: 0, laba: 0, gaji: 0, endapan: 0, isCurrent: false, isTarget: false },
      { label: 'Minggu 2', omzet: 0, belanja: 0, laba: 0, gaji: 0, endapan: 0, isCurrent: false, isTarget: false },
      { label: 'Minggu 3', omzet: w3Omzet, belanja: w3Belanja, laba: w3Laba, gaji: w3Gaji, endapan: w3Endapan, isCurrent: activeDate <= '2026-10-21', isTarget: false },
      { label: 'Minggu 4*', omzet: w4Omzet, belanja: w4Belanja, laba: w4Laba, gaji: w4Gaji, endapan: w4Endapan, isCurrent: activeDate >= '2026-10-22', isTarget: w4Days.every(x => x.isTarget) }
    ];
  } else {
    if (subTitle) subTitle.innerText = 'Akumulasi Tahunan (Tahun Buku 2026)';
    const q4Omzet = verifiedDays.reduce((s, x) => s + x.omzet, 0);
    const q4Belanja = verifiedDays.reduce((s, x) => s + x.belanja, 0);
    const q4Laba = verifiedDays.reduce((s, x) => s + x.labaBersih, 0);
    const q4Gaji = verifiedDays.reduce((s, x) => s + x.gajiBos, 0);
    const q4Endapan = verifiedDays.reduce((s, x) => s + x.endapanHarian, 0);

    chartData = [
      { label: 'Q1 (Jan-Mar)', omzet: 0, belanja: 0, laba: 0, gaji: 0, endapan: 0, isCurrent: false, isTarget: false },
      { label: 'Q2 (Apr-Jun)', omzet: 0, belanja: 0, laba: 0, gaji: 0, endapan: 0, isCurrent: false, isTarget: false },
      { label: 'Q3 (Jul-Sep)', omzet: 0, belanja: 0, laba: 0, gaji: 0, endapan: 0, isCurrent: false, isTarget: false },
      { label: 'Q4 (Okt-Des)', omzet: q4Omzet, belanja: q4Belanja, laba: q4Laba, gaji: q4Gaji, endapan: q4Endapan, isCurrent: true, isTarget: false }
    ];
  }

  const sumOmzet = verifiedDays.reduce((s, x) => s + x.omzet, 0);
  const sumBelanja = verifiedDays.reduce((s, x) => s + x.belanja, 0);
  const sumLaba = verifiedDays.reduce((s, x) => s + x.labaBersih, 0);
  const sumGaji = verifiedDays.reduce((s, x) => s + x.gajiBos, 0);
  const sumEndapan = verifiedDays.reduce((s, x) => s + x.endapanHarian, 0);

  if (summaryBox) {
    summaryBox.innerHTML =
      '<div><span>Total Omzet</span><strong style="color: #38BDF8;">Rp ' + sumOmzet.toLocaleString('id-ID') + '</strong></div>' +
      '<div><span>Total Belanja (HPP)</span><strong style="color: #F87171;">Rp ' + sumBelanja.toLocaleString('id-ID') + '</strong></div>' +
      '<div><span>Total Laba Bersih</span><strong style="color: #34D399;">Rp ' + sumLaba.toLocaleString('id-ID') + '</strong></div>' +
      '<div><span>Gaji Bos + Endapan</span><strong style="color: #818CF8;">Rp ' + sumGaji.toLocaleString('id-ID') + ' + Rp ' + sumEndapan.toLocaleString('id-ID') + '</strong></div>';
  }

  const maxVal = Math.max(100000, ...chartData.map(d => d.omzet)) * 1.15;

  chartData.forEach(d => {
    const col = document.createElement('div');
    col.className = 'accounting-col-group';

    const hOmzet = d.omzet > 0 ? Math.min(100, Math.max(4, Math.round((d.omzet / maxVal) * 100))) : 2;
    const hBelanja = d.belanja > 0 ? Math.min(100, Math.max(4, Math.round((d.belanja / maxVal) * 100))) : 2;
    const hLaba = d.laba > 0 ? Math.min(100, Math.max(4, Math.round((d.laba / maxVal) * 100))) : 2;
    const hGaji = d.gaji > 0 ? Math.min(100, Math.max(4, Math.round((d.gaji / maxVal) * 100))) : 2;

    const subText = d.omzet > 0
      ? 'Rp ' + (d.omzet / 1000).toFixed(1).replace('.0', '') + 'rb'
      : '-';

    col.innerHTML = 
      '<div class="accounting-bar-cluster" style="' + (d.isTarget ? 'opacity: 0.72;' : '') + '" title="' + d.label + (d.isTarget ? ' (Target Berjalan)' : '') + ':\n• Omzet Setoran: Rp ' + d.omzet.toLocaleString('id-ID') + '\n• HPP Belanja: Rp ' + d.belanja.toLocaleString('id-ID') + '\n• Laba Bersih: Rp ' + d.laba.toLocaleString('id-ID') + '\n• Gaji Bos (Amplop 2): Rp ' + d.gaji.toLocaleString('id-ID') + '\n• Endapan Kotak: Rp ' + (d.endapan || 0).toLocaleString('id-ID') + '">' +
        '<div class="accounting-bar-sub omzet" style="height: ' + hOmzet + '%;"></div>' +
        '<div class="accounting-bar-sub belanja" style="height: ' + hBelanja + '%;"></div>' +
        '<div class="accounting-bar-sub laba" style="height: ' + hLaba + '%;"></div>' +
        '<div class="accounting-bar-sub gaji" style="height: ' + hGaji + '%;"></div>' +
      '</div>' +
      '<span class="accounting-col-label ' + (d.isCurrent ? 'highlight' : '') + '">' + d.label + '</span>' +
      '<span class="accounting-col-subval">' + subText + '</span>';

    container.appendChild(col);
  });
}

function renderOutletRanking() {
  const container = document.getElementById('outletRankingContainer');
  if (!container) return;

  const rows = [...getActiveBuku1Rows()];
  rows.sort((a, b) => (b.laku || 0) - (a.laku || 0));

  container.innerHTML = '';
  rows.forEach((r, idx) => {
    const pct = r.kirim > 0 ? Math.round((r.laku / r.kirim) * 100) : 0;
    let statusText = 'Terjual ' + pct + '%';
    if (pct === 100) {
      statusText = 'Ludes 100%';
    } else if (r.retur > 0) {
      statusText = 'Retur ' + r.retur + ' pcs (' + pct + '%)';
    }

    const card = document.createElement('div');
    card.className = 'outlet-ranking-card rank-' + (idx + 1);
    card.innerHTML = 
      '<div class="outlet-rank-pos">' + (idx + 1) + '</div>' +
      '<div class="outlet-rank-info">' +
        '<div class="outlet-rank-name">' + r.nama + '</div>' +
        '<div class="outlet-rank-sub">' +
          '<span>Kirim ' + r.kirim + ' pcs</span>' +
          '<span>•</span>' +
          '<span>' + statusText + '</span>' +
        '</div>' +
        '<div class="outlet-rank-bar-bg">' +
          '<div class="outlet-rank-bar-fill" style="width: ' + pct + '%;"></div>' +
        '</div>' +
      '</div>' +
      '<div class="outlet-rank-stats">' +
        '<div class="outlet-rank-vol">' + r.laku + ' pcs</div>' +
        '<div class="outlet-rank-pct">Rp ' + (r.setor || 0).toLocaleString('id-ID') + '</div>' +
      '</div>';

    container.appendChild(card);
  });
}

// ==============================================================
// STAGE 2: MASTER BAHAN BAKU CONTROLLER & MODAL FORMS
// ==============================================================
window.filterMasterBahanCat = function(cat) {
  currentMasterBahanFilterCat = cat;
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-cat') === cat);
  });
  window.renderMasterBahanTable();
};

window.renderMasterBahanTable = function() {
  const tbody = document.getElementById('masterBahanTableBody');
  const searchInput = document.getElementById('searchMasterBahan');
  if (!tbody) return;

  const query = (searchInput?.value || '').toLowerCase().trim();
  const list = auraData.masterBahan || [];

  const filtered = list.filter(item => {
    const matchCat = (currentMasterBahanFilterCat === 'all') || (item.kategori === currentMasterBahanFilterCat);
    const matchQuery = !query || item.nama.toLowerCase().includes(query) || (item.vendor && item.vendor.toLowerCase().includes(query));
    return matchCat && matchQuery;
  });

  tbody.innerHTML = '';
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted); font-style: italic;">Tidak ada bahan baku yang cocok dengan pencarian.</td></tr>';
    return;
  }

  filtered.forEach((item, idx) => {
    const globalIdx = auraData.masterBahan.findIndex(m => m === item);
    let catBadgeClass = 'badge-toko';
    if (item.kategori.includes('Pasar')) catBadgeClass = 'badge-pasar';
    else if (item.kategori.includes('Gas') || item.kategori.includes('Operasional')) catBadgeClass = 'badge-gas';
    else if (item.kategori.includes('Kemasan')) catBadgeClass = 'mini-tag';

    const unitFisik = item.unitFisik || 'pcs';
    const qtyPerBeli = item.qtyPerBeli || 1;
    const gramPerUnit = item.gramPerUnit || 100;
    const totalGram = item.totalGram || Math.round(qtyPerBeli * gramPerUnit);
    const gramInfoText = qtyPerBeli > 1
      ? ('1 ' + unitFisik + ' ≈ ' + gramPerUnit + 'g • Total: ' + totalGram.toLocaleString('id-ID') + 'g')
      : ('Berat Bersih: ' + totalGram.toLocaleString('id-ID') + 'g (1 ' + unitFisik + ')');

    const tr = document.createElement('tr');
    tr.innerHTML = 
      '<td style="text-align: center; font-family: var(--font-mono);">' + (idx + 1) + '</td>' +
      '<td><strong style="color: #FFFFFF;">' + item.nama + '</strong></td>' +
      '<td><span class="badge-kategori ' + catBadgeClass + '">' + item.kategori + '</span></td>' +
      '<td>' +
        '<div style="font-size: 0.82rem; color: #F8FAFC; font-weight: 600;">' + item.satuan + '</div>' +
        '<div style="font-size: 0.71rem; color: #38BDF8; font-family: var(--font-mono); margin-top: 2px;">' + gramInfoText + '</div>' +
      '</td>' +
      '<td style="font-family: var(--font-mono); font-weight: 800; color: #34D399; text-align: right;">' +
        '<div>Rp ' + (item.harga || 0).toLocaleString('id-ID') + '</div>' +
        '<div style="font-size: 0.68rem; color: var(--text-muted); font-weight: 600;">Rp ' + Math.round((item.harga || 0) / Math.max(1, qtyPerBeli)).toLocaleString('id-ID') + '/' + unitFisik + ' • Rp ' + ((item.harga || 0) / Math.max(1, totalGram)).toFixed(1) + '/g</div>' +
      '</td>' +
      '<td style="color: var(--text-secondary); font-size: 0.8rem;">' + (item.vendor || '-') + '</td>' +
      '<td style="text-align: center; font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">' + (item.tglUpdate || '-') + '</td>' +
      '<td style="text-align: center;" class="no-print">' +
        '<div style="display: flex; gap: 4px; justify-content: center;">' +
          '<button type="button" class="btn-del-row" style="color: #38BDF8;" onclick="window.openEditMasterBahanModal(' + globalIdx + ')" title="Edit Bahan"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>' +
          '<button type="button" class="btn-del-row" onclick="window.handleDeleteMasterBahan(' + globalIdx + ')" title="Hapus Bahan"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>' +
        '</div>' +
      '</td>';
    tbody.appendChild(tr);
  });
};

window.syncModalGramFields = function(prefix, source) {
  const qtyEl = document.getElementById(prefix + 'QtyPerBeli');
  const gpuEl = document.getElementById(prefix + 'GramPerUnit');
  const totEl = document.getElementById(prefix + 'TotalGram');
  if (!qtyEl || !gpuEl || !totEl) return;

  const qty = Math.max(0.1, parseFloat(qtyEl.value) || 1);
  if (source === 'total') {
    const tot = Math.max(1, parseFloat(totEl.value) || 0);
    gpuEl.value = +(tot / qty).toFixed(1);
  } else {
    const gpu = Math.max(0.5, parseFloat(gpuEl.value) || 0);
    totEl.value = Math.round(qty * gpu);
  }
};

window.openAddMasterBahanModal = function() {
  const overlay = document.getElementById('appModalOverlay');
  const icon = document.getElementById('appModalIcon');
  const titleEl = document.getElementById('appModalTitle');
  const body = document.getElementById('appModalBody');
  const footer = document.getElementById('appModalFooter');

  if (!overlay) return;
  if (icon) { icon.innerHTML = ''; icon.style.display = 'none'; }
  if (titleEl) titleEl.innerText = 'Tambah Master Bahan Baku (Multi-Satuan & Gram)';

  body.innerHTML = 
    '<form id="formModalMasterBahan">' +
      '<div style="margin-bottom: 10px;">' +
        '<label class="form-label">Nama Bahan Baku</label>' +
        '<input type="text" id="mbInputNama" class="form-control-slate" placeholder="Contoh: Jagung Manis Segar" required>' +
      '</div>' +
      '<div style="display: flex; gap: 10px; margin-bottom: 10px;">' +
        '<div style="flex: 1;">' +
          '<label class="form-label">Kategori</label>' +
          '<select id="mbInputKategori" class="form-control-slate">' +
            '<option value="Pasar Subuh">Pasar Subuh</option>' +
            '<option value="Toko / Minimarket">Toko / Minimarket</option>' +
            '<option value="Operasional & Gas">Operasional & Gas</option>' +
            '<option value="Kemasan">Kemasan</option>' +
          '</select>' +
        '</div>' +
        '<div style="flex: 1.2;">' +
          '<label class="form-label">Label Kemasan Beli</label>' +
          '<input type="text" id="mbInputSatuan" class="form-control-slate" placeholder="Contoh: Paket (3 tongkol)" required>' +
        '</div>' +
      '</div>' +
      '<div style="background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 6px; padding: 10px; margin-bottom: 10px;">' +
        '<div style="font-size: 0.74rem; color: #38BDF8; font-weight: 700; margin-bottom: 8px;">Konversi Satuan Fisik &lt;-&gt; Berat Gram (Contoh: 3 tongkol = 300g)</div>' +
        '<div style="display: grid; grid-template-columns: 1.1fr 0.9fr 1fr 1fr; gap: 8px;">' +
          '<div>' +
            '<label class="form-label" style="font-size: 0.68rem;">Satuan Fisik</label>' +
            '<input type="text" id="mbInputUnitFisik" class="form-control-slate" placeholder="tongkol/buah/lbr" value="buah">' +
          '</div>' +
          '<div>' +
            '<label class="form-label" style="font-size: 0.68rem;">Isi / Kemasan</label>' +
            '<input type="number" step="any" min="0.1" id="mbInputQtyPerBeli" class="form-control-slate" value="1" oninput="window.syncModalGramFields(\'mbInput\', \'qty\')">' +
          '</div>' +
          '<div>' +
            '<label class="form-label" style="font-size: 0.68rem;">Gram / 1 Fisik</label>' +
            '<input type="number" step="any" min="1" id="mbInputGramPerUnit" class="form-control-slate" value="100" oninput="window.syncModalGramFields(\'mbInput\', \'gpu\')">' +
          '</div>' +
          '<div>' +
            '<label class="form-label" style="font-size: 0.68rem;">Total Gram</label>' +
            '<input type="number" step="any" min="1" id="mbInputTotalGram" class="form-control-slate" value="100" oninput="window.syncModalGramFields(\'mbInput\', \'total\')">' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display: flex; gap: 10px; margin-bottom: 10px;">' +
        '<div style="flex: 1;">' +
          '<label class="form-label">Harga Beli Kemasan (Rp)</label>' +
          '<input type="number" id="mbInputHarga" class="form-control-slate" placeholder="Contoh: 15000" min="0" required>' +
        '</div>' +
        '<div style="flex: 1.2;">' +
          '<label class="form-label">Toko Vendor Langganan</label>' +
          '<input type="text" id="mbInputVendor" class="form-control-slate" placeholder="Contoh: Toko Karunia">' +
        '</div>' +
      '</div>' +
    '</form>';

  footer.innerHTML = 
    '<button type="button" class="tool-btn" onclick="window.closeAppModal()" style="background: #334155; color: #CBD5E1;">Batal</button>' +
    '<button type="button" class="tool-btn tool-btn-success" id="btnSaveMasterBahan" style="font-weight: 800;">Simpan Bahan</button>';

  const btnSave = document.getElementById('btnSaveMasterBahan');
  if (btnSave) {
    btnSave.onclick = () => {
      const nama = document.getElementById('mbInputNama')?.value.trim();
      const kat = document.getElementById('mbInputKategori')?.value;
      const satuan = document.getElementById('mbInputSatuan')?.value.trim();
      const unitFisik = document.getElementById('mbInputUnitFisik')?.value.trim() || 'pcs';
      const qtyPerBeli = parseFloat(document.getElementById('mbInputQtyPerBeli')?.value) || 1;
      const gramPerUnit = parseFloat(document.getElementById('mbInputGramPerUnit')?.value) || 100;
      const totalGram = parseFloat(document.getElementById('mbInputTotalGram')?.value) || Math.round(qtyPerBeli * gramPerUnit);
      const harga = parseInt(document.getElementById('mbInputHarga')?.value, 10) || 0;
      const vendor = document.getElementById('mbInputVendor')?.value.trim() || '-';

      if (!nama || !satuan || harga <= 0) {
        window.showAlertModal("Data Kurang Lengkap", "Harap isi nama bahan, satuan kemasan, dan nominal harga yang valid!");
        return;
      }

      auraData.masterBahan.push({
        id: 'mb-' + Date.now(),
        nama: nama,
        kategori: kat,
        satuan: satuan,
        unitFisik: unitFisik,
        qtyPerBeli: qtyPerBeli,
        gramPerUnit: gramPerUnit,
        totalGram: totalGram,
        harga: harga,
        vendor: vendor,
        tglUpdate: new Date().toISOString().slice(0, 10)
      });

      saveLocal();
      window.closeAppModal();
      window.showSuccessModal("Bahan Ditambahkan", 'Bahan "' + nama + '" (' + qtyPerBeli + ' ' + unitFisik + ' ≈ ' + totalGram + 'g) berhasil disimpan!');
    };
  }

  overlay.style.display = 'flex';
};

window.openEditMasterBahanModal = function(idx) {
  const item = auraData.masterBahan[idx];
  if (!item) return;

  const overlay = document.getElementById('appModalOverlay');
  const icon = document.getElementById('appModalIcon');
  const titleEl = document.getElementById('appModalTitle');
  const body = document.getElementById('appModalBody');
  const footer = document.getElementById('appModalFooter');

  if (!overlay) return;
  if (icon) { icon.innerHTML = ''; icon.style.display = 'none'; }
  if (titleEl) titleEl.innerText = 'Edit Master Bahan & Konversi Gram';

  const uFisik = item.unitFisik || 'pcs';
  const qBeli = item.qtyPerBeli || 1;
  const gUnit = item.gramPerUnit || 100;
  const tGram = item.totalGram || Math.round(qBeli * gUnit);

  body.innerHTML = 
    '<form id="formModalMasterBahan">' +
      '<div style="margin-bottom: 10px;">' +
        '<label class="form-label">Nama Bahan Baku</label>' +
        '<input type="text" id="mbEditNama" class="form-control-slate" value="' + item.nama + '" required>' +
      '</div>' +
      '<div style="display: flex; gap: 10px; margin-bottom: 10px;">' +
        '<div style="flex: 1;">' +
          '<label class="form-label">Kategori</label>' +
          '<select id="mbEditKategori" class="form-control-slate">' +
            '<option value="Pasar Subuh"' + (item.kategori === 'Pasar Subuh' ? ' selected' : '') + '>Pasar Subuh</option>' +
            '<option value="Toko / Minimarket"' + (item.kategori === 'Toko / Minimarket' ? ' selected' : '') + '>Toko / Minimarket</option>' +
            '<option value="Operasional & Gas"' + (item.kategori === 'Operasional & Gas' ? ' selected' : '') + '>Operasional & Gas</option>' +
            '<option value="Kemasan"' + (item.kategori === 'Kemasan' ? ' selected' : '') + '>Kemasan</option>' +
          '</select>' +
        '</div>' +
        '<div style="flex: 1.2;">' +
          '<label class="form-label">Label Kemasan Beli</label>' +
          '<input type="text" id="mbEditSatuan" class="form-control-slate" value="' + item.satuan + '" required>' +
        '</div>' +
      '</div>' +
      '<div style="background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 6px; padding: 10px; margin-bottom: 10px;">' +
        '<div style="font-size: 0.74rem; color: #38BDF8; font-weight: 700; margin-bottom: 8px;">Konversi Satuan Fisik &lt;-&gt; Berat Gram (Otomatis Sinkron ke Stok &amp; HPP)</div>' +
        '<div style="display: grid; grid-template-columns: 1.1fr 0.9fr 1fr 1fr; gap: 8px;">' +
          '<div>' +
            '<label class="form-label" style="font-size: 0.68rem;">Satuan Fisik</label>' +
            '<input type="text" id="mbEditUnitFisik" class="form-control-slate" value="' + uFisik + '">' +
          '</div>' +
          '<div>' +
            '<label class="form-label" style="font-size: 0.68rem;">Isi / Kemasan</label>' +
            '<input type="number" step="any" min="0.1" id="mbEditQtyPerBeli" class="form-control-slate" value="' + qBeli + '" oninput="window.syncModalGramFields(\'mbEdit\', \'qty\')">' +
          '</div>' +
          '<div>' +
            '<label class="form-label" style="font-size: 0.68rem;">Gram / 1 ' + uFisik + '</label>' +
            '<input type="number" step="any" min="1" id="mbEditGramPerUnit" class="form-control-slate" value="' + gUnit + '" oninput="window.syncModalGramFields(\'mbEdit\', \'gpu\')">' +
          '</div>' +
          '<div>' +
            '<label class="form-label" style="font-size: 0.68rem;">Total Gram</label>' +
            '<input type="number" step="any" min="1" id="mbEditTotalGram" class="form-control-slate" value="' + tGram + '" oninput="window.syncModalGramFields(\'mbEdit\', \'total\')">' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display: flex; gap: 10px; margin-bottom: 10px;">' +
        '<div style="flex: 1;">' +
          '<label class="form-label">Harga Terakhir (Rp)</label>' +
          '<input type="number" id="mbEditHarga" class="form-control-slate" value="' + item.harga + '" min="0" required>' +
        '</div>' +
        '<div style="flex: 1.2;">' +
          '<label class="form-label">Toko Vendor Langganan</label>' +
          '<input type="text" id="mbEditVendor" class="form-control-slate" value="' + (item.vendor || '') + '">' +
        '</div>' +
      '</div>' +
    '</form>';

  footer.innerHTML = 
    '<button type="button" class="tool-btn" onclick="window.closeAppModal()" style="background: #334155; color: #CBD5E1;">Batal</button>' +
    '<button type="button" class="tool-btn tool-btn-success" id="btnUpdateMasterBahan" style="font-weight: 800;">Simpan Perubahan</button>';

  const btnUpdate = document.getElementById('btnUpdateMasterBahan');
  if (btnUpdate) {
    btnUpdate.onclick = () => {
      const nama = document.getElementById('mbEditNama')?.value.trim();
      const kat = document.getElementById('mbEditKategori')?.value;
      const satuan = document.getElementById('mbEditSatuan')?.value.trim();
      const unitFisik = document.getElementById('mbEditUnitFisik')?.value.trim() || 'pcs';
      let qtyPerBeli = parseFloat(document.getElementById('mbEditQtyPerBeli')?.value) || 1;
      const gramPerUnit = parseFloat(document.getElementById('mbEditGramPerUnit')?.value) || 100;
      const totalGram = parseFloat(document.getElementById('mbEditTotalGram')?.value) || Math.round(qtyPerBeli * gramPerUnit);
      const harga = parseInt(document.getElementById('mbEditHarga')?.value, 10) || 0;
      const vendor = document.getElementById('mbEditVendor')?.value.trim() || '-';

      if (!nama || !satuan || harga <= 0) {
        window.showAlertModal("Data Kurang Lengkap", "Harap isi nama bahan, satuan standar, dan nominal harga yang valid!");
        return;
      }

      // Jika pengguna mengubah angka di teks Label Kemasan (misal "Bungkus (isi 10 lbr)") tanpa mengubah kolom Isi/Kemasan, sinkronkan otomatis
      const numInSatuan = satuan.match(/(\d+(?:[.,]\d+)?)/);
      if (numInSatuan && qtyPerBeli === (item.qtyPerBeli || 1) && satuan !== item.satuan) {
        const parsedNum = parseFloat(numInSatuan[1].replace(',', '.'));
        if (parsedNum > 0 && parsedNum <= 250) {
          qtyPerBeli = parsedNum;
        }
      }

      item.nama = nama;
      item.kategori = kat;
      item.satuan = satuan;
      item.unitFisik = unitFisik;
      item.qtyPerBeli = qtyPerBeli;
      item.gramPerUnit = gramPerUnit;
      item.totalGram = Math.round(qtyPerBeli * gramPerUnit);
      item.harga = harga;
      item.vendor = vendor;
      item.tglUpdate = new Date().toISOString().slice(0, 10);

      // Sinkronkan ulang rasio gram di stokBahan
      if (auraData.stokBahan) {
        auraData.stokBahan.forEach(s => {
          s.gramPerUnit = getStokGramRatio(s);
          s.stokGram = Math.round((s.stok || 0) * s.gramPerUnit);
        });
      }

      saveLocal();
      window.closeAppModal();
      window.showSuccessModal("Perubahan Disimpan", 'Data "' + nama + '" (1 ' + unitFisik + ' ≈ ' + gramPerUnit + 'g, Total ' + item.totalGram + 'g) berhasil diperbarui!');
    };
  }

  overlay.style.display = 'flex';
};

window.handleDeleteMasterBahan = function(idx) {
  const item = auraData.masterBahan[idx];
  if (!item) return;

  window.showConfirmModal(
    "Hapus Bahan Baku",
    'Apakah Anda yakin ingin menghapus bahan baku "' + item.nama + '" dari Master Katalog?',
    () => {
      auraData.masterBahan.splice(idx, 1);
      saveLocal();
      window.showSuccessModal("Terhapus", "Bahan baku berhasil dihapus dari Master Katalog.");
    }
  );
};

// ==============================================================
// STAGE 3: BUKU 2 KUITANSI PENGELUARAN KAS & EDIT ACTION
// ==============================================================
const KUITANSI_DATE_CONFIG = {
  '26/10': { namaHari: 'Senin, 26 Oktober 2026', noBkk: 'BKK-20261026-01', modal: 100000 },
  '27/10': { namaHari: 'Selasa, 27 Oktober 2026', noBkk: 'BKK-20261027-02', modal: 100000 },
  '28/10': { namaHari: 'Rabu, 28 Oktober 2026', noBkk: 'BKK-20261028-03', modal: 100000 },
  '29/10': { namaHari: 'Kamis, 29 Oktober 2026', noBkk: 'BKK-20261029-04', modal: 100000 },
  '30/10': { namaHari: 'Jumat, 30 Oktober 2026', noBkk: 'BKK-20261030-05', modal: 100000 },
  '31/10': { namaHari: 'Sabtu, 31 Oktober 2026', noBkk: 'BKK-20261031-06', modal: 100000 }
};
if (!KUITANSI_DATE_CONFIG[REAL_TODAY_B2KEY]) {
  KUITANSI_DATE_CONFIG[REAL_TODAY_B2KEY] = {
    namaHari: REAL_TODAY_META.namaHari,
    noBkk: REAL_TODAY_META.noBkk,
    modal: REAL_TODAY_META.modal
  };
}

function terbilangRupiah(n) {
  if (!n || n === 0) return "Nol Rupiah";
  const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  function spell(x) {
    x = Math.floor(x);
    if (x < 12) return satuan[x];
    if (x < 20) return spell(x - 10) + " Belas";
    if (x < 100) return spell(Math.floor(x / 10)) + " Puluh " + spell(x % 10);
    if (x < 200) return "Seratus " + spell(x - 100);
    if (x < 1000) return spell(Math.floor(x / 100)) + " Ratus " + spell(x % 100);
    if (x < 2000) return "Seribu " + spell(x - 1000);
    if (x < 1000000) return spell(Math.floor(x / 1000)) + " Ribu " + spell(x % 1000);
    if (x < 1000000000) return spell(Math.floor(x / 1000000)) + " Juta " + spell(x % 1000000);
    return x.toString();
  }
  const res = spell(Math.round(n)).trim().replace(/\s+/g, ' ');
  return res ? res + " Rupiah" : "Nol Rupiah";
}

window.switchBuku2Date = function(tgl) {
  selectedBuku2Date = tgl;
  renderAllViews();
};

window.handleCreateNewKuitansiDay = function() {
  const overlay = document.getElementById('appModalOverlay');
  const icon = document.getElementById('appModalIcon');
  const titleEl = document.getElementById('appModalTitle');
  const body = document.getElementById('appModalBody');
  const footer = document.getElementById('appModalFooter');

  if (!overlay) return;
  if (icon) { icon.innerHTML = ''; icon.style.display = 'none'; }
  if (titleEl) titleEl.innerText = 'Buat Lembar Kuitansi Tanggal Baru';

  body.innerHTML = 
    '<p>Masukkan tanggal lembar kuitansi baru (contoh format: 22/10 atau 23/10):</p>' +
    '<input type="text" id="inputNewKuitansiDate" class="form-control-slate" placeholder="Contoh: 22/10" value="22/10">';

  footer.innerHTML = 
    '<button type="button" class="tool-btn" onclick="window.closeAppModal()" style="background: #334155; color: #CBD5E1;">Batal</button>' +
    '<button type="button" class="tool-btn tool-btn-success" id="btnSubmitNewDate" style="font-weight: 800;">Buat Lembar</button>';

  const btnSubmit = document.getElementById('btnSubmitNewDate');
  if (btnSubmit) {
    btnSubmit.onclick = () => {
      const val = (document.getElementById('inputNewKuitansiDate')?.value || '').trim();
      if (!val) return;
      selectedBuku2Date = val;
      if (!KUITANSI_DATE_CONFIG[val]) {
        KUITANSI_DATE_CONFIG[val] = {
          namaHari: 'Hari ' + val,
          noBkk: 'BKK-' + val.replace(/[^0-9]/g, '') + '-01',
          modal: 60000
        };
      }
      window.closeAppModal();
      renderAllViews();
      window.showSuccessModal("Lembar Kuitansi Aktif", "Lembar kuitansi tanggal " + val + " siap digunakan.");
    };
  }

  overlay.style.display = 'flex';
};

window.printKuitansi = function() {
  window.print();
};

window.handleAddBelanjaToKuitansi = function(e) {
  if (e) e.preventDefault();
  const nama = (document.getElementById('kuitansiInputNama')?.value || '').trim();
  const qty = (document.getElementById('kuitansiInputQty')?.value || '').trim();
  const biaya = parseInt(document.getElementById('kuitansiInputBiaya')?.value, 10) || 0;
  const kategori = document.getElementById('kuitansiInputKategori')?.value || 'Toko / Minimarket';

  if (!nama || biaya <= 0) {
    window.showAlertModal('Form Belum Lengkap', 'Harap masukkan nama bahan dan nominal biaya belanjaan!');
    return;
  }

  const nextNo = (auraData.buku2Belanja && auraData.buku2Belanja.length > 0)
    ? Math.max(...auraData.buku2Belanja.map(b => b.no || 0)) + 1
    : 1;

  auraData.buku2Belanja.push({
    no: nextNo,
    tgl: selectedBuku2Date,
    nama: nama,
    qty: qty,
    biaya: biaya,
    paraf: kategori
  });

  if (document.getElementById('kuitansiInputNama')) document.getElementById('kuitansiInputNama').value = '';
  if (document.getElementById('kuitansiInputQty')) document.getElementById('kuitansiInputQty').value = '';
  if (document.getElementById('kuitansiInputBiaya')) document.getElementById('kuitansiInputBiaya').value = '';

  saveLocal();
  window.showSuccessModal("Dicatat ke Kuitansi", 'Item "' + nama + '" senilai Rp ' + biaya.toLocaleString('id-ID') + ' berhasil dicatat.');
};

// Fitur Edit Item Belanja Kuitansi (Stage 3)
window.openEditBelanjaModal = function(globalIdx) {
  const item = auraData.buku2Belanja[globalIdx];
  if (!item) return;

  const overlay = document.getElementById('appModalOverlay');
  const icon = document.getElementById('appModalIcon');
  const titleEl = document.getElementById('appModalTitle');
  const body = document.getElementById('appModalBody');
  const footer = document.getElementById('appModalFooter');

  if (!overlay) return;
  if (icon) { icon.innerHTML = ''; icon.style.display = 'none'; }
  if (titleEl) titleEl.innerText = 'Edit Item Pengeluaran Kuitansi';

  body.innerHTML = 
    '<form id="formModalEditBelanja">' +
      '<div style="margin-bottom: 12px;">' +
        '<label class="form-label">Nama Bahan / Rincian</label>' +
        '<input type="text" id="editBelanjaNama" class="form-control-slate" value="' + item.nama + '" required>' +
      '</div>' +
      '<div style="display: flex; gap: 10px; margin-bottom: 12px;">' +
        '<div style="flex: 1.2;">' +
          '<label class="form-label">Kategori Belanja</label>' +
          '<select id="editBelanjaKategori" class="form-control-slate">' +
            '<option value="Toko / Minimarket"' + (item.paraf.includes('Toko') ? ' selected' : '') + '>Toko / Minimarket</option>' +
            '<option value="Pasar Subuh"' + (item.paraf.includes('Pasar') ? ' selected' : '') + '>Pasar Subuh</option>' +
            '<option value="Operasional & Gas"' + (item.paraf.includes('Operasional') || item.paraf.includes('Gas') ? ' selected' : '') + '>Operasional / Gas</option>' +
          '</select>' +
        '</div>' +
        '<div style="flex: 1;">' +
          '<label class="form-label">Kuantitas / Takaran</label>' +
          '<input type="text" id="editBelanjaQty" class="form-control-slate" value="' + item.qty + '" required>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom: 12px;">' +
        '<label class="form-label">Biaya Riil (Rp)</label>' +
        '<input type="number" id="editBelanjaBiaya" class="form-control-slate" value="' + item.biaya + '" min="0" required>' +
      '</div>' +
    '</form>';

  footer.innerHTML = 
    '<button type="button" class="tool-btn" onclick="window.closeAppModal()" style="background: #334155; color: #CBD5E1;">Batal</button>' +
    '<button type="button" class="tool-btn tool-btn-success" id="btnSaveEditBelanja" style="font-weight: 800;">Simpan Perubahan</button>';

  const btnSave = document.getElementById('btnSaveEditBelanja');
  if (btnSave) {
    btnSave.onclick = () => {
      const nama = document.getElementById('editBelanjaNama')?.value.trim();
      const kat = document.getElementById('editBelanjaKategori')?.value;
      const qty = document.getElementById('editBelanjaQty')?.value.trim();
      const biaya = parseInt(document.getElementById('editBelanjaBiaya')?.value, 10) || 0;

      if (!nama || biaya <= 0) {
        window.showAlertModal("Form Belum Lengkap", "Harap isi nama bahan dan biaya pengeluaran dengan benar!");
        return;
      }

      item.nama = nama;
      item.paraf = kat;
      item.qty = qty;
      item.biaya = biaya;

      saveLocal();
      window.closeAppModal();
      window.showSuccessModal("Berhasil Diperbarui", "Item kuitansi berhasil diperbarui dan total kas disesuaikan!");
    };
  }

  overlay.style.display = 'flex';
};

window.handleDeleteBelanjaFromKuitansi = function(idx) {
  const item = auraData.buku2Belanja[idx];
  if (!item) return;

  window.showConfirmModal(
    "Hapus Pengeluaran",
    'Hapus item belanja "' + item.nama + '" senilai Rp ' + item.biaya.toLocaleString('id-ID') + ' dari lembar kuitansi ini?',
    () => {
      auraData.buku2Belanja.splice(idx, 1);
      auraData.buku2Belanja.forEach((b, i) => b.no = i + 1);
      saveLocal();
      window.showSuccessModal("Terhapus", "Item belanja berhasil dihapus dari lembar kuitansi.");
    }
  );
};

// ==============================================================
// STAGE 5: RESEP ANTI-TEKOR, AUDIT HPP REAL-TIME & KALKULATOR TAKARAN SUBUH (GRAM + TBSP / TSP)
// ==============================================================
function getMasterItemMeta(keyword, fallbackHarga, fallbackQty, isGramOrMl) {
  const list = (auraData && auraData.masterBahan) ? auraData.masterBahan : INITIAL_MASTER_BAHAN;
  const found = list.find(m => m.nama.toLowerCase().includes(keyword.toLowerCase()));
  const harga = (found && found.harga > 0) ? found.harga : fallbackHarga;
  let qty = fallbackQty;
  let gramPerUnit = found && found.gramPerUnit ? found.gramPerUnit : 100;
  let unitFisik = found && found.unitFisik ? found.unitFisik : 'pcs';

  if (found) {
    if (isGramOrMl && found.totalGram > 0) {
      qty = found.totalGram;
    } else if (!isGramOrMl && found.qtyPerBeli > 0) {
      qty = found.qtyPerBeli;
    } else if (found.satuan) {
      const s = String(found.satuan).toLowerCase();
      const numMatch = s.match(/(\d+(?:[.,]\d+)?)/);
      const hasKgOrLiter = /\b(kg|kilogram|liter|ltr)\b/.test(s);

      if (numMatch) {
        const parsed = parseFloat(numMatch[1].replace(',', '.'));
        if (parsed > 0) {
          if (isGramOrMl && hasKgOrLiter && parsed <= 20) {
            qty = parsed * 1000;
          } else {
            qty = parsed;
          }
        }
      } else if (isGramOrMl && hasKgOrLiter) {
        qty = 1000;
      }
    }
  }

  return {
    harga: harga,
    qty: qty > 0 ? qty : fallbackQty,
    gramPerUnit: gramPerUnit,
    totalGram: found && found.totalGram ? found.totalGram : (isGramOrMl ? qty : qty * gramPerUnit),
    unitFisik: unitFisik,
    unitCost: harga / (qty > 0 ? qty : fallbackQty),
    gramCost: harga / Math.max(1, (found && found.totalGram) ? found.totalGram : (isGramOrMl ? qty : qty * gramPerUnit)),
    satuanLabel: found ? found.satuan : ''
  };
}

window.setTakaranUnitMode = function(mode) {
  currentTakaranUnitMode = mode || 'all';
  ['All', 'Spoon', 'Gram'].forEach(k => {
    const btn = document.getElementById('btnUnitMode' + k);
    if (btn) {
      btn.classList.toggle('active', k.toLowerCase() === currentTakaranUnitMode);
    }
  });
  window.calculateTakaran();
};

function fmtTakaranVal(gramText, spoonText, fisikText) {
  if (currentTakaranUnitMode === 'spoon') {
    return spoonText + (gramText ? ' (' + gramText + (fisikText ? ' • ' + fisikText : '') + ')' : '');
  }
  if (currentTakaranUnitMode === 'gram') {
    return gramText + (fisikText ? ' (' + fisikText + ')' : '');
  }
  // Default 'all': Gram + Tbsp/Tsp + Fisik
  return gramText + (spoonText ? ' • ' + spoonText : '') + (fisikText ? ' (' + fisikText + ')' : '');
}

function formatMarginLine(marginVal) {
  const pct = Math.round((marginVal / 800) * 100);
  if (marginVal >= 0) {
    return '<span style="font-size: 0.72rem; color: #34D399; display: block; margin-top: 2px;">Margin: +Rp ' + marginVal.toLocaleString('id-ID') + '/pcs (' + pct + '%)</span>';
  }
  return '<span style="font-size: 0.72rem; color: #FB7185; font-weight: 700; display: block; margin-top: 2px;">Tekor: -Rp ' + Math.abs(marginVal).toLocaleString('id-ID') + '/pcs (' + pct + '%)</span>';
}

function getRecipeIngredientQty(prod, bahanKeyKeyword, fallbackVal) {
  if (!prod || !prod.komposisi) return fallbackVal;
  const item = prod.komposisi.find(k => k.bahanKey.toLowerCase().includes(bahanKeyKeyword.toLowerCase()) || (k.nama && k.nama.toLowerCase().includes(bahanKeyKeyword.toLowerCase())));
  return item ? (Number(item.qtyPerPcs) || 0) : fallbackVal;
}

window.calculateTakaran = function() {
  const ubiInput = document.getElementById('calcUbiPcs');
  const sayurInput = document.getElementById('calcSayurPcs');
  const rotiInput = document.getElementById('calcRotiPcs');
  if (!ubiInput || !sayurInput || !rotiInput) return;

  const ubiPcs = parseInt(ubiInput.value, 10) || 0;
  const sayurPcs = parseInt(sayurInput.value, 10) || 0;
  const rotiPcs = parseInt(rotiInput.value, 10) || 0;
  let totalPcs = ubiPcs + sayurPcs + rotiPcs;

  const recipes = (auraData && auraData.masterResep && auraData.masterResep.length > 0)
    ? auraData.masterResep
    : DEFAULT_MASTER_RESEP;
  const ubiProd = recipes.find(r => r.id === 'prod_ubi') || recipes[0];
  const sayurProd = recipes.find(r => r.id === 'prod_sayur') || recipes[1];
  const rotiProd = recipes.find(r => r.id === 'prod_roti') || recipes[2];
  const customProducts = recipes.filter(r => r.isCustom);

  customProducts.forEach(cp => {
    const cpInput = document.getElementById('calcPcs_' + cp.id);
    const cpPcs = cpInput ? (parseInt(cpInput.value, 10) || 0) : (cp.defaultPcs || 20);
    totalPcs += cpPcs;
  });

  const totalEl = document.getElementById('calcTotalPcs');
  if (totalEl) totalEl.value = totalPcs + ' pcs';

  const container = document.getElementById('takaranResultContainer');
  if (!container) return;

  // Baca kapasitas satuan, konversi gram, & harga langsung dari Master Bahan
  const metaKulit = getMasterItemMeta('Kulit Lumpia', 10000, 36, false);
  const metaUbi = getMasterItemMeta('Ubi Ungu', 11000, 1000, true);
  const metaWortel = getMasterItemMeta('Wortel', 7000, 500, true);
  const metaJagung = getMasterItemMeta('Jagung', 5000, 3, false);
  const metaTelur = getMasterItemMeta('Telur', 5000, 4, false);
  const metaSosis = getMasterItemMeta('Sosis', 18000, 40, false);
  const metaRoti = getMasterItemMeta('Roti Tawar', 10000, 14, false);
  const metaKeju = getMasterItemMeta('Keju', 11500, 160, true);
  const metaSKM = getMasterItemMeta('Susu Kental Manis', 15500, 545, true);
  const metaCollins = getMasterItemMeta('Collins', 48000, 1000, true);
  const metaPanir = getMasterItemMeta('Panir', 16000, 1000, true);
  const metaTerigu = getMasterItemMeta('Terigu', 6000, 500, true);
  const metaBawangPutih = getMasterItemMeta('Bawang Putih', 8000, 250, true);

  // 1. Takaran Gogumapia Mini Ubi Ungu Keju (Dinamis dari masterResep)
  const ubiPerPcs = getRecipeIngredientQty(ubiProd, 'Ubi', 13.2);
  const kejuPerPcs = getRecipeIngredientQty(ubiProd, 'Keju', 1.0);
  const skmPerPcs = getRecipeIngredientQty(ubiProd, 'Susu Kental Manis', 0.45);
  const gulaPerPcs = getRecipeIngredientQty(ubiProd, 'Gula Pasir', 0.6);
  const susuBubukPerPcs = getRecipeIngredientQty(ubiProd, 'Susu Bubuk', 0.3);

  const ubiGram = Math.round(ubiPcs * ubiPerPcs);
  const ubiKg = (ubiGram / 1000).toFixed(2);
  const ubiBuah = (ubiGram / Math.max(1, metaUbi.gramPerUnit || 200)).toFixed(1);
  const ubiTbsp = Math.round(ubiGram / 15);
  const gulaGram = Math.round(ubiPcs * gulaPerPcs);
  const gulaTbsp = (gulaGram / 10).toFixed(1);
  const gulaTsp = (gulaGram / 3.3).toFixed(1);
  const skmGram = Math.round(ubiPcs * skmPerPcs);
  const skmTbsp = (skmGram / 15).toFixed(1);
  const skmTsp = (skmGram / 5).toFixed(1);
  const susuBubukGram = Math.round(ubiPcs * susuBubukPerPcs);
  const susuBubukTbsp = (susuBubukGram / 10).toFixed(1);
  const susuBubukTsp = (susuBubukGram / 3.3).toFixed(1);
  const kejuGram = Math.round(ubiPcs * kejuPerPcs);
  const kejuTbsp = (kejuGram / 15).toFixed(1);
  const kejuTsp = (kejuGram / 5).toFixed(1);

  // 2. Takaran Lumpia Segitiga Sayur Telur Sosis (Dinamis dari masterResep)
  const wortelPerPcs = getRecipeIngredientQty(sayurProd, 'Wortel', 5.0);
  const jagungPerPcs = getRecipeIngredientQty(sayurProd, 'Jagung', 3.5);
  const sosisPerPcs = getRecipeIngredientQty(sayurProd, 'Sosis', 2.75);
  const telurPerPcs = getRecipeIngredientQty(sayurProd, 'Telur', 2.2);
  const bwgPutihPerPcs = getRecipeIngredientQty(sayurProd, 'Bawang Putih', 0.4);
  const sausTiramPerPcs = getRecipeIngredientQty(sayurProd, 'Saus Tiram', 0.75);

  const wortelGram = Math.round(sayurPcs * wortelPerPcs);
  const wortelBuah = (wortelGram / Math.max(1, metaWortel.gramPerUnit || 125)).toFixed(1);
  const wortelTbsp = Math.round(wortelGram / 10);
  const wortelTsp = Math.round(wortelGram / 3.3);
  const jagungGram = Math.round(sayurPcs * jagungPerPcs);
  const jagungTongkol = (jagungGram / Math.max(1, metaJagung.gramPerUnit || 100)).toFixed(1);
  const jagungTbsp = Math.round(jagungGram / 10);
  const sosisGram = Math.round(sayurPcs * sosisPerPcs);
  const sosisBatang = (sosisGram / Math.max(1, metaSosis.gramPerUnit || 22)).toFixed(1);
  const sosisTbsp = Math.round(sosisGram / 10);
  const telurGram = Math.round(sayurPcs * telurPerPcs);
  const telurButir = (telurGram / Math.max(1, metaTelur.gramPerUnit || 55)).toFixed(1);
  const telurTbsp = (telurGram / 15).toFixed(1);
  const bwgPutihGram = Math.round(sayurPcs * bwgPutihPerPcs);
  const bwgPutihSiung = Math.max(1, Math.round(bwgPutihGram / Math.max(1, metaBawangPutih.gramPerUnit || 5)));
  const bwgPutihTsp = bwgPutihSiung;
  const sausTiramGram = Math.round(sayurPcs * sausTiramPerPcs);
  const sausTiramTbsp = (sausTiramGram / 15).toFixed(1);
  const sausTiramTsp = (sausTiramGram / 5).toFixed(1);

  // 3. Takaran Roti Goreng Kantong Collins (Dinamis dari masterResep)
  const rotiPerPcs = getRecipeIngredientQty(rotiProd, 'Roti Tawar', 0.5);
  const collinsPerPcs = getRecipeIngredientQty(rotiProd, 'Collins', 2.5);
  const panirPerPcs = getRecipeIngredientQty(rotiProd, 'Panir', 4.0);
  const teriguPerPcs = getRecipeIngredientQty(rotiProd, 'Terigu', 2.5);

  const rotiLembar = Math.ceil(rotiPcs * rotiPerPcs);
  const rotiGram = Math.round(rotiLembar * (metaRoti.gramPerUnit || 35));
  const rotiBagianGoreng = Math.ceil(rotiPcs / 2);
  const rotiIsiPerBks = metaRoti.qty;
  const rotiBks = (rotiLembar / rotiIsiPerBks).toFixed(1);
  const collinsGram = Math.round(rotiPcs * collinsPerPcs);
  const collinsTbsp = (collinsGram / 15).toFixed(1);
  const collinsTsp = (collinsGram / 5).toFixed(1);
  const panirGram = Math.round(rotiPcs * panirPerPcs);
  const panirTbsp = Math.round(panirGram / 8);
  const panirTsp = Math.round(panirGram / 2.7);
  const teriguCelupGram = Math.round(rotiPcs * teriguPerPcs);
  const teriguCelupTbsp = Math.max(1, Math.round((rotiLembar / 9) * 10));
  const teriguCelupTsp = teriguCelupTbsp * 3;
  const garamCelupTsp = ((rotiLembar / 9) * 0.5).toFixed(1);

  // 4. Total Kemasan Kulit & Minyak
  const totalKulit = ubiPcs + sayurPcs;
  const totalKulitGram = Math.round(totalKulit * (metaKulit.gramPerUnit || 7));
  const kulitIsiPerBks = metaKulit.qty;
  const kulitBks = Math.ceil(totalKulit / kulitIsiPerBks);

  // Boxes
  let customBoxesHtml = '';
  customProducts.forEach((cp, cIdx) => {
    const cpInput = document.getElementById('calcPcs_' + cp.id);
    const cpPcs = cpInput ? (parseInt(cpInput.value, 10) || 0) : (cp.defaultPcs || 20);
    const cpHpp = getProductUnitHPP(cp);
    let itemsLi = '';
    (cp.komposisi || []).forEach(k => {
      const tot = ((k.qtyPerPcs || 0) * cpPcs).toFixed(1);
      const isLiquid = /keju|selai|saus|minyak|susu|telur/i.test(k.bahanKey);
      const tbsp = isLiquid ? (tot / 15).toFixed(1) : (tot / 10).toFixed(1);
      const tsp = isLiquid ? (tot / 5).toFixed(1) : (tot / 3.3).toFixed(1);
      const valStr = k.isGram
        ? fmtTakaranVal(tot + 'g', tbsp + ' tbsp (' + tsp + ' tsp)', '(' + k.qtyPerPcs + 'g/pcs)')
        : tot + ' ' + (k.unit || 'unit');
      itemsLi += '<li><span>' + k.nama + ':</span> <strong>' + valStr + '</strong></li>';
    });
    customBoxesHtml +=
      '<div class="takaran-box">' +
        '<div class="takaran-box-header">' +
          '<div class="takaran-box-title" style="color: ' + (cp.badgeColor || '#38BDF8') + ';">' + (cIdx + 4) + '. ' + cp.nama + ' (' + cpPcs + ' pcs)</div>' +
          '<span class="mini-tag" style="background: rgba(56, 189, 248, 0.2); color: ' + (cp.badgeColor || '#38BDF8') + ';">HPP Rp ' + cpHpp.toLocaleString('id-ID') + '/pcs</span>' +
        '</div>' +
        '<ul class="takaran-list">' +
          itemsLi +
        '</ul>' +
      '</div>';
  });

  container.innerHTML = 
    '<div class="takaran-box">' +
      '<div class="takaran-box-header">' +
        '<div class="takaran-box-title" style="color: #818CF8;">1. ' + ubiProd.nama + ' (' + ubiPcs + ' pcs)</div>' +
        '<span class="mini-tag" style="background: rgba(129, 140, 248, 0.2); color: #818CF8;">' + ubiPerPcs + 'g • 1 tbsp / 2.5 tsp</span>' +
      '</div>' +
      '<ul class="takaran-list">' +
        '<li><span>Ubi Ungu Kukus Empuk:</span> <strong>' + fmtTakaranVal(ubiKg + ' kg (' + ubiGram + 'g)', ubiTbsp + ' tbsp lumat', '≈ ' + ubiBuah + ' buah') + '</strong></li>' +
        '<li><span>Takaran Isian per Pcs:</span> <strong>' + fmtTakaranVal(ubiPerPcs + 'g ubi', '1 tbsp peres / 2.5 tsp', 'lipat bantal') + '</strong></li>' +
        '<li><span>Gula Pasir:</span> <strong>' + fmtTakaranVal(gulaGram + 'g', gulaTbsp + ' tbsp (' + gulaTsp + ' tsp)', '') + '</strong></li>' +
        '<li><span>SKM Putih:</span> <strong>' + fmtTakaranVal(skmGram + 'g', skmTbsp + ' tbsp (' + skmTsp + ' tsp)', '') + '</strong></li>' +
        '<li><span>Susu Bubuk Putih (Opsional):</span> <strong>' + fmtTakaranVal(susuBubukGram + 'g', susuBubukTbsp + ' tbsp (' + susuBubukTsp + ' tsp)', '') + '</strong></li>' +
        '<li><span>Keju Oles Prochiz:</span> <strong>' + fmtTakaranVal(kejuGram + 'g', kejuTbsp + ' tbsp / ' + kejuTsp + ' tsp', kejuPerPcs + 'g/pcs') + '</strong></li>' +
        '<li><span>Kulit Lumpia Segar:</span> <strong>' + ubiPcs + ' lbr (≈ ' + Math.round(ubiPcs * (metaKulit.gramPerUnit || 7)) + 'g)</strong></li>' +
      '</ul>' +
    '</div>' +

    '<div class="takaran-box">' +
      '<div class="takaran-box-header">' +
        '<div class="takaran-box-title" style="color: #34D399;">2. ' + sayurProd.nama + ' (' + sayurPcs + ' pcs)</div>' +
        '<span class="mini-tag" style="background: rgba(16, 185, 129, 0.2); color: #34D399;">' + (wortelPerPcs + jagungPerPcs + sosisPerPcs).toFixed(1) + 'g • 1 tbsp / 2 tsp</span>' +
      '</div>' +
      '<ul class="takaran-list">' +
        '<li><span>Wortel Potong Dadu Kecil:</span> <strong>' + fmtTakaranVal(wortelGram + 'g', wortelTbsp + ' tbsp (' + wortelTsp + ' tsp)', '≈ ' + wortelBuah + ' buah') + '</strong></li>' +
        '<li><span>Jagung Manis Pipil:</span> <strong>' + fmtTakaranVal(jagungGram + 'g', jagungTbsp + ' tbsp pipil', '≈ ' + jagungTongkol + ' tongkol') + '</strong></li>' +
        '<li><span>Sosis Dadu Mikro:</span> <strong>' + fmtTakaranVal(sosisGram + 'g', sosisTbsp + ' tbsp dadu', sosisBatang + ' batang') + '</strong></li>' +
        '<li><span>Telur Kocok (Tuang Akhir):</span> <strong>' + fmtTakaranVal(telurGram + 'g', telurTbsp + ' tbsp kocok', telurButir + ' butir') + '</strong></li>' +
        '<li><span>Bawang Putih Cincang:</span> <strong>' + fmtTakaranVal(bwgPutihGram + 'g', bwgPutihTsp + ' tsp', bwgPutihSiung + ' siung') + '</strong></li>' +
        '<li><span>Saus Tiram &amp; Bumbu:</span> <strong>' + fmtTakaranVal(sausTiramGram + 'g Saus Tiram', sausTiramTbsp + ' tbsp (' + sausTiramTsp + ' tsp)', '') + '</strong></li>' +
        '<li><span>Isian per Kulit (Lipat Segitiga):</span> <strong>' + fmtTakaranVal((wortelPerPcs + jagungPerPcs + sosisPerPcs).toFixed(1) + 'g/pcs', '1 tbsp peres / 2 tsp', sayurPcs + ' lbr kulit') + '</strong></li>' +
      '</ul>' +
    '</div>' +

    '<div class="takaran-box">' +
      '<div class="takaran-box-header">' +
        '<div class="takaran-box-title" style="color: #FBBF24;">3. ' + rotiProd.nama + ' (' + rotiPcs + ' pcs)</div>' +
        '<span class="mini-tag" style="background: rgba(245, 158, 11, 0.2); color: #FBBF24;">1 Lbr = 2 Kantong</span>' +
      '</div>' +
      '<ul class="takaran-list">' +
        '<li><span>Roti Tawar Utuh:</span> <strong>' + rotiLembar + ' lbr (≈ ' + rotiGram + 'g • ' + rotiBks + ' bks @ ' + rotiIsiPerBks + ' lbr)</strong></li>' +
        '<li><span>Potong 2 &amp; Tumpuk Kering:</span> <strong>' + rotiBagianGoreng + ' blok tumpuk goreng</strong></li>' +
        '<li><span>Adonan Terigu Celup Cepat:</span> <strong>' + fmtTakaranVal('serapan ~' + teriguCelupGram + 'g', teriguCelupTbsp + ' tbsp (' + teriguCelupTsp + ' tsp) terigu + ' + garamCelupTsp + ' tsp garam', '') + '</strong></li>' +
        '<li><span>Tepung Panir Tipis Merata:</span> <strong>' + fmtTakaranVal(panirGram + 'g (~' + panirPerPcs + 'g/pcs)', panirTbsp + ' tbsp (' + panirTsp + ' tsp)', '') + '</strong></li>' +
        '<li><span>Belah 2 Usai Goreng:</span> <strong>Jadi ' + rotiPcs + ' kantong persegi</strong></li>' +
        '<li><span>Collins Choco (Trik Bibir Luar):</span> <strong>' + fmtTakaranVal(collinsGram + 'g (~' + collinsPerPcs + 'g/pcs)', collinsTbsp + ' tbsp / ' + collinsTsp + ' tsp', '1/2 tsp/pcs') + '</strong></li>' +
      '</ul>' +
    '</div>' +

    '<div class="takaran-box">' +
      '<div class="takaran-box-header">' +
        '<div class="takaran-box-title" style="color: #38BDF8;">4. Total Kulit & Penggorengan</div>' +
        '<span class="mini-tag" style="background: rgba(56, 189, 248, 0.2); color: #38BDF8;">Operasional Subuh</span>' +
      '</div>' +
      '<ul class="takaran-list">' +
        '<li><span>Total Kebutuhan Kulit Lumpia:</span> <strong>' + totalKulit + ' lembar (≈ ' + totalKulitGram + ' gram)</strong></li>' +
        '<li><span>Ambil Bungkus Kulit di Kulkas:</span> <strong>' + kulitBks + ' bungkus (@ isi ' + kulitIsiPerBks + ' lbr)</strong></li>' +
        '<li><span>Larutan Lem Tepung Kulit:</span> <strong>2 tbsp (6 tsp / 20g) terigu + 4 tbsp air</strong></li>' +
        '<li><span>Minyak Goreng Wajan:</span> <strong>1.5 - 2.0 Liter (1.350 - 1.800g)</strong></li>' +
        '<li><span>Suhu &amp; Waktu Goreng:</span> <strong>160°C (Api Sedang • 3.5 - 4.0 Menit)</strong></li>' +
      '</ul>' +
    '</div>' +
    customBoxesHtml;

  // 5. AUDIT HPP & ESTIMASI PROFIT REAL-TIME (DARI DYNAMIC MASTER RESEP)
  const hppBox = document.getElementById('hppAuditContainer');
  if (hppBox) {
    const hppUbiUnit = getProductUnitHPP(ubiProd);
    const hppSayurUnit = getProductUnitHPP(sayurProd);
    const hppRotiUnit = getProductUnitHPP(rotiProd);

    let totalHPPProduksi = (ubiPcs * hppUbiUnit) + (sayurPcs * hppSayurUnit) + (rotiPcs * hppRotiUnit);
    customProducts.forEach(cp => {
      const cpInput = document.getElementById('calcPcs_' + cp.id);
      const cpPcs = cpInput ? (parseInt(cpInput.value, 10) || 0) : (cp.defaultPcs || 20);
      totalHPPProduksi += (cpPcs * getProductUnitHPP(cp));
    });

    const rowsB1 = getActiveBuku1Rows();
    const totalBonusB1 = rowsB1.reduce((s, r) => s + (r.bonus || 0), 0);
    const totalKirimB1 = rowsB1.reduce((s, r) => s + (r.kirim || 0), 0);
    const weightedAvgTarif = totalKirimB1 > 0
      ? Math.round(rowsB1.reduce((s, r) => s + ((r.kirim || 0) * (r.hargaSetor || 800)), 0) / totalKirimB1)
      : 800;
    const estPcsJual = Math.max(0, totalPcs - totalBonusB1);
    const estOmzetSetor = estPcsJual * weightedAvgTarif;
    const estLabaBersih = estOmzetSetor - totalHPPProduksi;

    const formatMarginLine = (margin) => {
      const col = margin >= 0 ? '#34D399' : '#FB7185';
      const sign = margin >= 0 ? '+' : '';
      return '<span style="font-size: 0.72rem; color: ' + col + '; font-weight: 700; display: block; margin-top: 2px;">Margin: ' + sign + 'Rp ' + margin.toLocaleString('id-ID') + ' / pcs</span>';
    };

    // Sisa stok check
    const getStokGramByKey = (kw) => {
      const foundStok = (auraData.stokBahan || []).find(s => s.nama.toLowerCase().includes(kw.toLowerCase()));
      if (!foundStok) return 0;
      const r = getStokGramRatio(foundStok);
      return foundStok.stokGram !== undefined ? foundStok.stokGram : Math.round((foundStok.stok || 0) * r);
    };
    const checks = [
      { label: 'Kulit Lumpia', needG: totalKulitGram, availG: getStokGramByKey('Kulit'), needTxt: totalKulit + ' lbr (' + totalKulitGram + 'g)' },
      { label: 'Ubi Ungu', needG: ubiGram, availG: getStokGramByKey('Ubi'), needTxt: ubiGram + 'g' },
      { label: 'Keju Prochiz', needG: kejuGram, availG: getStokGramByKey('Keju'), needTxt: kejuGram + 'g' },
      { label: 'Wortel', needG: wortelGram, availG: getStokGramByKey('Wortel'), needTxt: wortelGram + 'g' },
      { label: 'Jagung', needG: jagungGram, availG: getStokGramByKey('Jagung'), needTxt: jagungGram + 'g' },
      { label: 'Sosis', needG: sosisGram, availG: getStokGramByKey('Sosis'), needTxt: sosisGram + 'g' },
      { label: 'Telur', needG: telurGram, availG: getStokGramByKey('Telur'), needTxt: telurGram + 'g' },
      { label: 'Roti Tawar', needG: rotiGram, availG: getStokGramByKey('Roti'), needTxt: rotiLembar + ' lbr (' + rotiGram + 'g)' },
      { label: 'Collins Choco', needG: collinsGram, availG: getStokGramByKey('Collins'), needTxt: collinsGram + 'g' },
      { label: 'Tepung Panir', needG: panirGram, availG: getStokGramByKey('Panir'), needTxt: panirGram + 'g' }
    ];
    const kurangList = checks.filter(c => c.needG > 0 && c.availG < c.needG);
    const stokSyncHtml = kurangList.length === 0
      ? '<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 0.74rem; color: #34D399;"><strong>Integrasi Stok Dapur:</strong> Seluruh sisa stok fisik/gram di dapur mencukupi untuk target produksi ' + totalPcs + ' pcs ini.</div>'
      : '<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 0.74rem; color: #FBBF24;"><strong>Peringatan Integrasi Stok Dapur (Kurang ' + kurangList.length + ' Bahan):</strong> ' +
        kurangList.map(k => k.label + ' (Butuh ' + k.needTxt + ', Stok ' + k.availG + 'g -> <span style="color:#FB7185;font-weight:700;">Kurang ' + (k.needG - k.availG) + 'g</span>)').join(' • ') +
        '</div>';

    hppBox.innerHTML =
      '<div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-left: 3px solid #10B981; border-radius: var(--radius-md); padding: 14px 16px;">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06);">' +
          '<strong style="font-size: 0.85rem; color: var(--text-primary);">Audit HPP, Omzet &amp; Integrasi Stok Dapur Real-Time (Formula Dinamis)</strong>' +
          '<span style="font-size: 0.75rem; color: var(--text-secondary);">Rata-rata Setor Mitra: <strong style="color: #38BDF8; font-family: var(--font-mono);">Rp ' + weightedAvgTarif.toLocaleString('id-ID') + ' / pcs</strong></span>' +
        '</div>' +
        '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">' +
          '<div style="background: rgba(255,255,255,0.02); padding: 10px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">' +
            '<span style="font-size: 0.72rem; color: var(--text-secondary); display: block;">HPP ' + ubiProd.nama + '</span>' +
            '<strong style="font-family: var(--font-mono); font-size: 1rem; color: #818CF8;">Rp ' + hppUbiUnit.toLocaleString('id-ID') + ' / pcs</strong>' +
            formatMarginLine(weightedAvgTarif - hppUbiUnit) +
          '</div>' +
          '<div style="background: rgba(255,255,255,0.02); padding: 10px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">' +
            '<span style="font-size: 0.72rem; color: var(--text-secondary); display: block;">HPP ' + sayurProd.nama + '</span>' +
            '<strong style="font-family: var(--font-mono); font-size: 1rem; color: #34D399;">Rp ' + hppSayurUnit.toLocaleString('id-ID') + ' / pcs</strong>' +
            formatMarginLine(weightedAvgTarif - hppSayurUnit) +
          '</div>' +
          '<div style="background: rgba(255,255,255,0.02); padding: 10px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">' +
            '<span style="font-size: 0.72rem; color: var(--text-secondary); display: block;">HPP ' + rotiProd.nama + '</span>' +
            '<strong style="font-family: var(--font-mono); font-size: 1rem; color: #FBBF24;">Rp ' + hppRotiUnit.toLocaleString('id-ID') + ' / pcs</strong>' +
            formatMarginLine(weightedAvgTarif - hppRotiUnit) +
          '</div>' +
          '<div style="background: rgba(16, 185, 129, 0.08); padding: 10px 12px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.25);">' +
            '<span style="font-size: 0.72rem; color: var(--text-secondary); display: block;">Total HPP ' + totalPcs + ' Pcs vs Omzet (Rp ' + estOmzetSetor.toLocaleString('id-ID') + ')</span>' +
            '<strong style="font-family: var(--font-mono); font-size: 1rem; color: #F8FAFC;">Modal Rp ' + totalHPPProduksi.toLocaleString('id-ID') + '</strong>' +
            '<span style="font-size: 0.72rem; color: ' + (estLabaBersih >= 0 ? '#34D399' : '#FB7185') + '; font-weight: 700; display: block; margin-top: 2px;">Est. Profit Bersih: ' + (estLabaBersih >= 0 ? '+Rp ' : '-Rp ') + Math.abs(estLabaBersih).toLocaleString('id-ID') + '</span>' +
          '</div>' +
        '</div>' +
        stokSyncHtml +
      '</div>';
  }
};

window.applyRecipePreset = function(ubi, sayur, roti) {
  const ubiInput = document.getElementById('calcUbiPcs');
  const sayurInput = document.getElementById('calcSayurPcs');
  const rotiInput = document.getElementById('calcRotiPcs');
  if (ubiInput) ubiInput.value = ubi;
  if (sayurInput) sayurInput.value = sayur;
  if (rotiInput) rotiInput.value = roti;
  window.calculateTakaran();
};

// ==============================================================
// STAGE 5B: SISTEM FORMULA RESEP DINAMIS (EDIT TAKARAN & TAMBAH PRODUK BARU)
// ==============================================================
function renderRecipeVisualGrid() {
  const container = document.getElementById('recipeVisualGridContainer');
  if (!container) return;

  const recipes = (auraData && auraData.masterResep && auraData.masterResep.length > 0)
    ? auraData.masterResep
    : DEFAULT_MASTER_RESEP;

  container.innerHTML = '';
  recipes.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'recipe-visual-card';

    const hpp = getProductUnitHPP(p);
    const hargaSetor = p.hargaSetorDefault || 800;
    const margin = hargaSetor - hpp;
    const marginColor = margin >= 0 ? '#34D399' : '#FB7185';
    const marginSign = margin >= 0 ? '+' : '';

    const defaultImg = p.imgSrc || './Panduan_Visual_Trio_Gorengan_Lengkap.jpg';
    const videoHtml = p.videoRef
      ? '<li><strong>Referensi Video:</strong> <a href="' + p.videoRef.url + '" target="_blank" rel="noopener" style="color: ' + (p.badgeColor || '#38BDF8') + '; text-decoration: underline;">TikTok ' + p.videoRef.author + '</a></li>'
      : '';

    // Rincian komposisi ringkas
    const bahanSummary = (p.komposisi || []).map(k => {
      const unitLabel = k.unit || (k.isGram ? 'g' : 'unit');
      return '<span>' + k.nama + ': <strong>' + k.qtyPerPcs + ' ' + unitLabel + '</strong></span>';
    }).join(' • ');

    const deleteBtnHtml = p.isCustom
      ? '<button type="button" class="tool-btn" style="border-color: rgba(251, 113, 133, 0.4); color: #FB7185; padding: 4px 8px; font-size: 0.72rem;" onclick="window.deleteCustomProduct(\'' + p.id + '\')">Hapus Produk</button>'
      : '<button type="button" class="tool-btn" style="padding: 4px 8px; font-size: 0.72rem; color: #94A3B8;" onclick="window.resetFormulaToDefault(\'' + p.id + '\')">Reset Kalibrasi</button>';

    card.innerHTML =
      '<div class="recipe-visual-img-wrap">' +
        '<img src="' + defaultImg + '" alt="' + p.nama + '" onerror="this.src=\'./Panduan_Visual_Trio_Gorengan_Lengkap.jpg\'">' +
        '<div class="recipe-badge-tag" style="background: ' + (p.badgeColor || '#38BDF8') + 'ee;">' + (p.badgeTag || p.lipatModel || 'Varian Mom Fitri') + '</div>' +
      '</div>' +
      '<div class="recipe-visual-body">' +
        '<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">' +
          '<h4 style="color: ' + (p.badgeColor || '#38BDF8') + '; margin-bottom: 4px;">' + (idx + 1) + '. ' + p.nama + '</h4>' +
          '<span class="mini-tag" style="background: rgba(255,255,255,0.06); color: ' + marginColor + '; font-weight: 800; font-family: var(--font-mono); font-size: 0.72rem; padding: 2px 6px;">HPP Rp ' + hpp.toLocaleString('id-ID') + ' (' + marginSign + 'Rp ' + margin.toLocaleString('id-ID') + ')</span>' +
        '</div>' +
        '<ul class="sop-detail-list">' +
          '<li><strong>Teknik &amp; SOP Penggorengan:</strong> ' + (p.sopWaktuSuhu || '160°C • 3.5 Menit') + '</li>' +
          '<li><strong>Standar Gramasi &amp; Metode:</strong> ' + (p.catatanSOP || '-') + '</li>' +
          '<li><strong>Rincian Formula Takaran / Pcs:</strong> <div style="font-size: 0.73rem; color: #94A3B8; margin-top: 3px; line-height: 1.4;">' + bahanSummary + '</div></li>' +
          videoHtml +
        '</ul>' +
        '<div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; gap: 6px;">' +
          '<button type="button" class="tool-btn tool-btn-success" style="padding: 4px 10px; font-size: 0.72rem; font-weight: 700;" onclick="window.openManageFormulaModal(\'' + p.id + '\')">Edit Formula Takaran</button>' +
          deleteBtnHtml +
        '</div>' +
      '</div>';

    container.appendChild(card);
  });
}

window.openManageFormulaModal = function(selectedProdId) {
  const overlay = document.getElementById('appModalOverlay');
  const dialog = document.getElementById('appModalDialog');
  const icon = document.getElementById('appModalIcon');
  const titleEl = document.getElementById('appModalTitle');
  const body = document.getElementById('appModalBody');
  const footer = document.getElementById('appModalFooter');

  if (!overlay || !dialog) return;
  dialog.style.maxWidth = '780px';
  if (icon) { icon.innerHTML = ''; icon.style.display = 'none'; }
  if (titleEl) titleEl.innerText = 'Kelola Formula Resep & Takaran Presisi';

  const recipes = (auraData && auraData.masterResep && auraData.masterResep.length > 0)
    ? auraData.masterResep
    : DEFAULT_MASTER_RESEP;
  
  let activeId = selectedProdId || recipes[0].id;
  const prod = recipes.find(r => r.id === activeId) || recipes[0];

  const tabsHtml = recipes.map(r => {
    const isActive = r.id === prod.id;
    return '<button type="button" class="filter-pill ' + (isActive ? 'active' : '') + '" style="font-weight: 700; font-size: 0.78rem;" onclick="window.openManageFormulaModal(\'' + r.id + '\')">' +
      r.nama +
    '</button>';
  }).join('');

  const allMb = (auraData && auraData.masterBahan) ? auraData.masterBahan : INITIAL_MASTER_BAHAN;

  let rowsHtml = '';
  (prod.komposisi || []).forEach((k, idx) => {
    const meta = getMasterItemMeta(k.bahanKey, 10000, 100, k.isGram);
    const lineCost = k.isGram ? Math.round((k.qtyPerPcs || 0) * meta.gramCost) : Math.round((k.qtyPerPcs || 0) * meta.unitCost);

    rowsHtml += 
      '<tr>' +
        '<td style="text-align: center; font-family: var(--font-mono);">' + (idx + 1) + '</td>' +
        '<td>' +
          '<select class="form-control-slate f-item-key" style="padding: 4px 6px; font-size: 0.78rem;" onchange="window.recalcFormulaModalLine()">' +
            allMb.map(m => {
              const sel = (m.nama.toLowerCase() === k.nama.toLowerCase() || m.nama.toLowerCase().includes(k.bahanKey.toLowerCase())) ? 'selected' : '';
              return '<option value="' + m.nama + '" ' + sel + '>' + m.nama + '</option>';
            }).join('') +
          '</select>' +
        '</td>' +
        '<td>' +
          '<input type="number" step="0.1" min="0" class="form-control-slate f-item-qty" style="padding: 4px 6px; font-size: 0.78rem; text-align: center; font-family: var(--font-mono); font-weight: 800;" value="' + (k.qtyPerPcs || 0) + '" oninput="window.recalcFormulaModalLine()">' +
        '</td>' +
        '<td>' +
          '<select class="form-control-slate f-item-unit" style="padding: 4px 6px; font-size: 0.78rem;" onchange="window.recalcFormulaModalLine()">' +
            ['gram', 'lembar', 'buah', 'batang', 'butir', 'ikat', 'porsi'].map(u => {
              const sel = (k.unit === u || (k.isGram && u === 'gram')) ? 'selected' : '';
              return '<option value="' + u + '" ' + sel + '>' + u + '</option>';
            }).join('') +
          '</select>' +
        '</td>' +
        '<td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: #38BDF8;" id="fLineCost_' + idx + '">Rp ' + lineCost.toLocaleString('id-ID') + '</td>' +
        '<td style="text-align: center;">' +
          '<button type="button" class="btn-del-row" style="color: #FB7185; padding: 2px 6px; font-size: 0.85rem;" onclick="this.closest(\'tr\').remove(); window.recalcFormulaModalLine();" title="Hapus baris">&times;</button>' +
        '</td>' +
      '</tr>';
  });

  const curHpp = getProductUnitHPP(prod);
  const targetHarga = prod.hargaSetorDefault || 800;
  const marginEst = targetHarga - curHpp;
  const marginColor = marginEst >= 0 ? '#34D399' : '#FB7185';

  body.innerHTML =
    '<div style="margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 6px; padding-bottom: 10px; border-bottom: 1px solid var(--card-border);">' +
      tabsHtml +
      '<button type="button" class="tool-btn" style="padding: 4px 10px; font-size: 0.75rem;" onclick="window.openAddProductModal()">+ Varian Baru</button>' +
    '</div>' +

    '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 14px;">' +
      '<div>' +
        '<label class="form-label">Nama Produk</label>' +
        '<input type="text" id="fProdNama" class="form-control-slate" value="' + prod.nama + '" required>' +
      '</div>' +
      '<div>' +
        '<label class="form-label">Target Harga Setor Mitra (Rp / Pcs)</label>' +
        '<input type="number" id="fProdHargaSetor" class="form-control-slate" value="' + targetHarga + '" required oninput="window.recalcFormulaModalLine()">' +
      '</div>' +
      '<div>' +
        '<label class="form-label">Model Lipat / Waktu Penggorengan</label>' +
        '<input type="text" id="fProdLipat" class="form-control-slate" value="' + (prod.lipatModel || '') + '">' +
      '</div>' +
    '</div>' +

    '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
      '<strong style="font-size: 0.82rem; color: #FFFFFF;">Daftar Komposisi Bahan per 1 Pcs:</strong>' +
      '<button type="button" class="tool-btn" style="font-size: 0.72rem; padding: 3px 8px;" onclick="window.addFormulaIngredientLine()">+ Tambah Bahan Baku</button>' +
    '</div>' +

    '<div class="table-responsive-wrapper" style="max-height: 280px; overflow-y: auto; margin-bottom: 14px;">' +
      '<table class="slate-table">' +
        '<thead>' +
          '<tr>' +
            '<th style="width: 32px; text-align: center;">No</th>' +
            '<th>Bahan Baku (Dari Master)</th>' +
            '<th style="width: 100px; text-align: center;">Takaran</th>' +
            '<th style="width: 95px;">Satuan</th>' +
            '<th style="width: 105px; text-align: right;">Est. Biaya</th>' +
            '<th style="width: 40px; text-align: center;">Aksi</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody id="formulaTableBody">' +
          rowsHtml +
        '</tbody>' +
      '</table>' +
    '</div>' +

    '<div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 6px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">' +
      '<div>' +
        '<span style="font-size: 0.72rem; color: var(--text-secondary); display: block;">Estimasi HPP per Pcs:</span>' +
        '<strong style="font-family: var(--font-mono); font-size: 1.05rem; color: #FFFFFF;" id="fTotalHppDisplay">Rp ' + curHpp.toLocaleString('id-ID') + '</strong>' +
      '</div>' +
      '<div>' +
        '<span style="font-size: 0.72rem; color: var(--text-secondary); display: block;">Estimasi Margin Mitra:</span>' +
        '<strong style="font-family: var(--font-mono); font-size: 1.05rem; color: ' + marginColor + ';" id="fTotalMarginDisplay">' + (marginEst >= 0 ? '+' : '') + 'Rp ' + marginEst.toLocaleString('id-ID') + '</strong>' +
      '</div>' +
    '</div>';

  const resetBtnHtml = (!prod.isCustom)
    ? '<button type="button" class="tool-btn" style="background: #334155; color: #CBD5E1; font-size: 0.75rem;" onclick="window.resetFormulaToDefault(\'' + prod.id + '\')">Reset Kalibrasi Standar</button>'
    : '<button type="button" class="tool-btn" style="border-color: rgba(251, 113, 133, 0.4); color: #FB7185; font-size: 0.75rem;" onclick="window.deleteCustomProduct(\'' + prod.id + '\')">Hapus Varian Ini</button>';

  footer.innerHTML =
    '<div style="display: flex; gap: 8px; width: 100%; justify-content: space-between; align-items: center; flex-wrap: wrap;">' +
      resetBtnHtml +
      '<div style="display: flex; gap: 8px; margin-left: auto;">' +
        '<button type="button" class="tool-btn" onclick="window.closeAppModal()">Batal</button>' +
        '<button type="button" class="tool-btn tool-btn-success" style="font-weight: 800;" onclick="window.saveFormulaChanges(\'' + prod.id + '\')">Simpan Perubahan Formula</button>' +
      '</div>' +
    '</div>';

  overlay.style.display = 'flex';
};

window.recalcFormulaModalLine = function() {
  const tableBody = document.getElementById('formulaTableBody');
  if (!tableBody) return;
  const rows = tableBody.querySelectorAll('tr');
  let totalHpp = 0;
  rows.forEach((r, idx) => {
    const selMb = r.querySelector('.f-item-key');
    const inputQty = r.querySelector('.f-item-qty');
    const selUnit = r.querySelector('.f-item-unit');
    const costCell = r.querySelector('#fLineCost_' + idx) || r.querySelectorAll('td')[4];
    
    if (selMb && inputQty && selUnit) {
      const mbKey = selMb.value;
      const qty = parseFloat(inputQty.value) || 0;
      const isGram = selUnit.value === 'gram';
      const meta = getMasterItemMeta(mbKey, 10000, 100, isGram);
      const lineCost = isGram ? Math.round(qty * meta.gramCost) : Math.round(qty * meta.unitCost);
      if (costCell) costCell.innerText = 'Rp ' + lineCost.toLocaleString('id-ID');
      totalHpp += lineCost;
    }
  });

  const totalHppEl = document.getElementById('fTotalHppDisplay');
  const totalMarginEl = document.getElementById('fTotalMarginDisplay');
  const hargaSetorInput = document.getElementById('fProdHargaSetor');
  const targetHarga = hargaSetorInput ? (parseInt(hargaSetorInput.value, 10) || 800) : 800;
  const marginEst = targetHarga - totalHpp;
  const marginColor = marginEst >= 0 ? '#34D399' : '#FB7185';

  if (totalHppEl) totalHppEl.innerText = 'Rp ' + totalHpp.toLocaleString('id-ID');
  if (totalMarginEl) {
    totalMarginEl.innerText = (marginEst >= 0 ? '+' : '') + 'Rp ' + marginEst.toLocaleString('id-ID');
    totalMarginEl.style.color = marginColor;
  }
};

window.addFormulaIngredientLine = function() {
  const tableBody = document.getElementById('formulaTableBody');
  if (!tableBody) return;
  const allMb = (auraData && auraData.masterBahan) ? auraData.masterBahan : INITIAL_MASTER_BAHAN;
  const idx = tableBody.querySelectorAll('tr').length;
  
  const tr = document.createElement('tr');
  tr.innerHTML = 
    '<td style="text-align: center; font-family: var(--font-mono);">' + (idx + 1) + '</td>' +
    '<td>' +
      '<select class="form-control-slate f-item-key" style="padding: 4px 6px; font-size: 0.78rem;" onchange="window.recalcFormulaModalLine()">' +
        allMb.map(m => '<option value="' + m.nama + '">' + m.nama + '</option>').join('') +
      '</select>' +
    '</td>' +
    '<td>' +
      '<input type="number" step="0.1" min="0" class="form-control-slate f-item-qty" style="padding: 4px 6px; font-size: 0.78rem; text-align: center; font-family: var(--font-mono); font-weight: 800;" value="1" oninput="window.recalcFormulaModalLine()">' +
    '</td>' +
    '<td>' +
      '<select class="form-control-slate f-item-unit" style="padding: 4px 6px; font-size: 0.78rem;" onchange="window.recalcFormulaModalLine()">' +
        ['gram', 'lembar', 'buah', 'batang', 'butir', 'ikat', 'porsi'].map(u => '<option value="' + u + '">' + u + '</option>').join('') +
      '</select>' +
    '</td>' +
    '<td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: #38BDF8;" id="fLineCost_' + idx + '">Rp 0</td>' +
    '<td style="text-align: center;">' +
      '<button type="button" class="btn-del-row" style="color: #FB7185; padding: 2px 6px; font-size: 0.85rem;" onclick="this.closest(\'tr\').remove(); window.recalcFormulaModalLine();" title="Hapus baris">&times;</button>' +
    '</td>';

  tableBody.appendChild(tr);
  window.recalcFormulaModalLine();
};

window.saveFormulaChanges = function(prodId) {
  const recipes = (auraData && auraData.masterResep && auraData.masterResep.length > 0)
    ? auraData.masterResep
    : DEFAULT_MASTER_RESEP;
  const prod = recipes.find(r => r.id === prodId);
  if (!prod) return;

  const namaInput = document.getElementById('fProdNama');
  const hargaSetorInput = document.getElementById('fProdHargaSetor');
  const lipatInput = document.getElementById('fProdLipat');

  if (namaInput && namaInput.value.trim()) prod.nama = namaInput.value.trim();
  if (hargaSetorInput) prod.hargaSetorDefault = parseInt(hargaSetorInput.value, 10) || 800;
  if (lipatInput) prod.lipatModel = lipatInput.value.trim();

  const tableBody = document.getElementById('formulaTableBody');
  if (tableBody) {
    const rows = tableBody.querySelectorAll('tr');
    const newKomposisi = [];
    rows.forEach(r => {
      const selMb = r.querySelector('.f-item-key');
      const inputQty = r.querySelector('.f-item-qty');
      const selUnit = r.querySelector('.f-item-unit');
      if (selMb && inputQty && selUnit) {
        const mbName = selMb.value;
        const qty = parseFloat(inputQty.value) || 0;
        const unit = selUnit.value;
        const isGram = (unit === 'gram');
        newKomposisi.push({
          bahanKey: mbName,
          nama: mbName,
          qtyPerPcs: qty,
          unit: unit,
          isGram: isGram,
          tipe: isGram ? 'isian' : 'kulit'
        });
      }
    });
    prod.komposisi = newKomposisi;
  }

  saveLocal();
  window.closeAppModal();
  renderAllViews();
  window.showSuccessModal(
    "Formula Resep Disimpan",
    'Formula takaran untuk "' + prod.nama + '" berhasil diperbarui! Seluruh kalkulator subuh dan audit HPP otomatis disesuaikan.'
  );
};

window.resetFormulaToDefault = function(prodId) {
  const def = DEFAULT_MASTER_RESEP.find(r => r.id === prodId);
  if (!def) return;

  window.showConfirmModal(
    "Reset Kalibrasi Standar",
    'Kembalikan formula resep "' + def.nama + '" ke takaran kalibrasi awal video referensi TikTok?',
    () => {
      const idx = auraData.masterResep.findIndex(r => r.id === prodId);
      if (idx !== -1) {
        auraData.masterResep[idx] = JSON.parse(JSON.stringify(def));
        saveLocal();
        window.closeAppModal();
        renderAllViews();
        window.showSuccessModal("Berhasil Direset", 'Formula "' + def.nama + '" telah dikembalikan ke kalibrasi standar.');
      }
    }
  );
};

window.openAddProductModal = function() {
  const overlay = document.getElementById('appModalOverlay');
  const dialog = document.getElementById('appModalDialog');
  const icon = document.getElementById('appModalIcon');
  const titleEl = document.getElementById('appModalTitle');
  const body = document.getElementById('appModalBody');
  const footer = document.getElementById('appModalFooter');

  if (!overlay || !dialog) return;
  dialog.style.maxWidth = '680px';
  if (icon) { icon.innerHTML = ''; icon.style.display = 'none'; }
  if (titleEl) titleEl.innerText = 'Tambah Resep & Varian Produk Baru';

  body.innerHTML =
    '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 14px;">' +
      '<div>' +
        '<label class="form-label">Nama Produk Baru</label>' +
        '<input type="text" id="newProdNama" class="form-control-slate" placeholder="Contoh: Pastel Sayur Telur Mini" required>' +
      '</div>' +
      '<div>' +
        '<label class="form-label">Nama Pendek / Kode</label>' +
        '<input type="text" id="newProdShort" class="form-control-slate" placeholder="Contoh: Pastel" required>' +
      '</div>' +
      '<div>' +
        '<label class="form-label">Target Harga Setor Mitra (Rp)</label>' +
        '<input type="number" id="newProdHarga" class="form-control-slate" value="800" required>' +
      '</div>' +
      '<div>' +
        '<label class="form-label">Model Lipat / Waktu Goreng</label>' +
        '<input type="text" id="newProdLipat" class="form-control-slate" placeholder="Contoh: Pilin Tepi • 160°C 4 Menit">' +
      '</div>' +
      '<div>' +
        '<label class="form-label">Warna Aksen Tag</label>' +
        '<select id="newProdColor" class="form-control-slate">' +
          '<option value="#38BDF8">Biru Muda (#38BDF8)</option>' +
          '<option value="#F43F5E">Merah Rose (#F43F5E)</option>' +
          '<option value="#A855F7">Ungu Pastel (#A855F7)</option>' +
          '<option value="#10B981">Hijau Mint (#10B981)</option>' +
          '<option value="#FB923C">Orange Cerah (#FB923C)</option>' +
        '</select>' +
      '</div>' +
      '<div>' +
        '<label class="form-label">Target Produksi Default (Pcs)</label>' +
        '<input type="number" id="newProdPcs" class="form-control-slate" value="20">' +
      '</div>' +
    '</div>' +
    '<div style="margin-bottom: 10px; font-size: 0.8rem; color: var(--text-secondary);">' +
      'Setelah produk dibuat, Anda dapat langsung menambahkan dan mengatur gramasi bahan baku penyusunnya di tabel formula resep.' +
    '</div>';

  footer.innerHTML =
    '<div style="display: flex; gap: 8px; width: 100%; justify-content: flex-end;">' +
      '<button type="button" class="tool-btn" onclick="window.closeAppModal()">Batal</button>' +
      '<button type="button" class="tool-btn tool-btn-success" style="font-weight: 800;" onclick="window.saveNewProduct()">Simpan & Buat Formula</button>' +
    '</div>';

  overlay.style.display = 'flex';
};

window.saveNewProduct = function() {
  const nama = (document.getElementById('newProdNama')?.value || '').trim();
  const shortName = (document.getElementById('newProdShort')?.value || '').trim() || nama.slice(0, 6);
  const harga = parseInt(document.getElementById('newProdHarga')?.value, 10) || 800;
  const lipat = (document.getElementById('newProdLipat')?.value || '').trim() || 'Model Standar';
  const color = document.getElementById('newProdColor')?.value || '#38BDF8';
  const defaultPcs = parseInt(document.getElementById('newProdPcs')?.value, 10) || 20;

  if (!nama) {
    window.showErrorModal("Nama Wajib Diisi", "Silakan masukkan nama produk gorengan baru Anda.");
    return;
  }

  const newId = 'prod_custom_' + Date.now();
  const allMb = (auraData && auraData.masterBahan) ? auraData.masterBahan : INITIAL_MASTER_BAHAN;
  const kulitItem = allMb.find(m => m.nama.toLowerCase().includes('kulit')) || allMb[0];
  const minyakItem = allMb.find(m => m.nama.toLowerCase().includes('minyak')) || allMb[0];

  const newProd = {
    id: newId,
    nama: nama,
    shortName: shortName,
    badgeColor: color,
    lipatModel: lipat,
    sopWaktuSuhu: '160°C • 3.5 - 4.0 Menit',
    hargaSetorDefault: harga,
    imgSrc: './Panduan_Visual_Trio_Gorengan_Lengkap.jpg',
    badgeTag: nama + ' • Baru',
    catatanSOP: lipat,
    defaultPcs: defaultPcs,
    isCustom: true,
    komposisi: [
      { bahanKey: kulitItem.nama, nama: kulitItem.nama, qtyPerPcs: 1, unit: kulitItem.unitFisik || 'lembar', isGram: false, tipe: 'kulit' },
      { bahanKey: minyakItem.nama, nama: minyakItem.nama, qtyPerPcs: 2.0, unit: 'gram', isGram: true, tipe: 'goreng' }
    ]
  };

  if (!auraData.masterResep) auraData.masterResep = JSON.parse(JSON.stringify(DEFAULT_MASTER_RESEP));
  auraData.masterResep.push(newProd);

  saveLocal();
  window.closeAppModal();
  renderAllViews();
  window.showSuccessModal(
    "Produk Berhasil Ditambahkan",
    'Varian "' + nama + '" berhasil didaftarkan! Sekarang silakan sesuaikan komposisi bahan bakunya.',
    () => {
      window.openManageFormulaModal(newId);
    }
  );
};

window.deleteCustomProduct = function(prodId) {
  const prod = (auraData.masterResep || []).find(r => r.id === prodId);
  if (!prod) return;

  window.showConfirmModal(
    "Hapus Varian Produk",
    'Apakah Anda yakin ingin menghapus varian "' + prod.nama + '" dari sistem resep Dapur Mom Fitri?',
    () => {
      auraData.masterResep = auraData.masterResep.filter(r => r.id !== prodId);
      saveLocal();
      window.closeAppModal();
      renderAllViews();
      window.showSuccessModal("Terhapus", 'Varian "' + prod.nama + '" berhasil dihapus dari resep.');
    }
  );
};

window.applyRecipePreset = function(ubi, sayur, roti) {
  const ubiInput = document.getElementById('calcUbiPcs');
  const sayurInput = document.getElementById('calcSayurPcs');
  const rotiInput = document.getElementById('calcRotiPcs');
  if (ubiInput) ubiInput.value = ubi;
  if (sayurInput) sayurInput.value = sayur;
  if (rotiInput) rotiInput.value = roti;
  window.calculateTakaran();
};

// ==============================================================
// STAGE 2: STOK BAHAN DENGAN KONVERSI 2 ARAH (SATUAN FISIK <-> GRAM)
// ==============================================================
function applyStokStatusAndAction(item) {
  const min = item.minTrigger !== undefined ? item.minTrigger : 1;
  if (item.stok <= 0) {
    item.status = 'Habis';
    item.action = item.jalur === 'A' ? 'Beli malam ini: ' + item.orderQty : (item.jalur === 'B' ? 'Pesan pasar subuh: ' + item.orderQty : 'Segera restock');
  } else if (item.stok <= min) {
    item.status = 'Menipis';
    item.action = item.jalur === 'A' ? 'Siapkan belanja toko: ' + item.orderQty : (item.jalur === 'B' ? 'Titip tukang sayur: ' + item.orderQty : 'Siapkan cadangan');
  } else {
    item.status = 'Aman';
    item.action = 'Stok mencukupi untuk produksi';
  }
}

window.updateStokVal = function(idx, val) {
  const s = parseFloat(val);
  const item = auraData.stokBahan[idx];
  if (!item) return;
  const ratio = getStokGramRatio(item);
  item.gramPerUnit = ratio;
  item.stok = isNaN(s) ? 0 : Math.max(0, s);
  item.stokGram = Math.round(item.stok * ratio);

  applyStokStatusAndAction(item);
  saveLocal();
};

window.updateStokFromGram = function(idx, gramVal) {
  const g = parseFloat(gramVal);
  const item = auraData.stokBahan[idx];
  if (!item) return;
  const ratio = getStokGramRatio(item);
  item.gramPerUnit = ratio;
  item.stokGram = isNaN(g) ? 0 : Math.max(0, Math.round(g));
  const rawUnits = item.stokGram / Math.max(1, ratio);
  item.stok = Number.isInteger(rawUnits) ? rawUnits : +rawUnits.toFixed(2);

  applyStokStatusAndAction(item);
  saveLocal();
};

// ==============================================================
// MASTER RENDER ENGINE (SINKRONISASI INTEGRAL SELURUH MODUL)
// ==============================================================
function renderAllViews() {
  syncDateDisplays();

  // 1. EXECUTIVE DASHBOARD FINANCIALS, CHARTS & RANKING
  renderExecutiveFinancials();
  renderAccountingChart();
  renderOutletRanking();

  // 2. DISTRIBUSI & PENJUALAN MITRA SPREADSHEET (DENGAN FITUR SET HARI INI, SIMPAN/KUNCI, & EDIT)
  const b1Body = document.getElementById('buku1TableBody');
  const b1Foot = document.getElementById('buku1TableFoot');
  const printDateDisplay = document.getElementById('buku1PrintDateDisplay');
  const printStatusText = document.getElementById('buku1PrintStatusText');
  const statusBadgeEl = document.getElementById('buku1DayStatusBadge');
  const btnToggleEditEl = document.getElementById('btnToggleEditBuku1');
  const btnSimpanEl = document.getElementById('btnSimpanBuku1');
  const rowsBuku1 = getActiveBuku1Rows();

  const isDaySaved = !!(auraData.buku1SavedDates && auraData.buku1SavedDates[activeDate]);
  const isEditingAllowed = !isDaySaved || !!buku1EditModeDates[activeDate];

  if (statusBadgeEl) {
    if (isDaySaved && !isEditingAllowed) {
      statusBadgeEl.innerText = 'Tersimpan';
      statusBadgeEl.style.background = 'rgba(16, 185, 129, 0.2)';
      statusBadgeEl.style.color = '#34D399';
    } else if (isDaySaved && isEditingAllowed) {
      statusBadgeEl.innerText = 'Mode Edit Aktif';
      statusBadgeEl.style.background = 'rgba(245, 158, 11, 0.2)';
      statusBadgeEl.style.color = '#FBBF24';
    } else {
      statusBadgeEl.innerText = 'Mode Input';
      statusBadgeEl.style.background = 'rgba(56, 189, 248, 0.2)';
      statusBadgeEl.style.color = '#38BDF8';
    }
  }

  if (btnToggleEditEl) {
    btnToggleEditEl.style.display = (isDaySaved && !isEditingAllowed) ? 'inline-flex' : 'none';
  }
  if (btnSimpanEl) {
    btnSimpanEl.innerText = isDaySaved ? 'Simpan Perubahan' : 'Simpan Hari Ini';
    btnSimpanEl.style.display = isEditingAllowed ? 'inline-flex' : 'none';
  }
  if (printStatusText) {
    printStatusText.innerText = isDaySaved ? 'Tersimpan & Terverifikasi' : 'Draft Operasional';
  }

  if (printDateDisplay) {
    const activeCfg = OPERATIONAL_DAYS_CONFIG.find(c => c.isoDate === activeDate);
    printDateDisplay.innerText = activeCfg ? activeCfg.namaHari : activeDate;
  }

  if (b1Body) {
    b1Body.innerHTML = '';
    let sumKirim = 0, sumBonus = 0, sumRetur = 0, sumLaku = 0, sumSetor = 0;

    rowsBuku1.forEach((r, idx) => {
      sumKirim += (r.kirim || 0);
      sumBonus += (r.bonus || 0);
      sumRetur += (r.retur || 0);
      sumLaku += (r.laku || 0);
      sumSetor += (r.setor || 0);

      const tr = document.createElement('tr');
      if (isEditingAllowed) {
        tr.innerHTML = 
          '<td style="text-align: center; font-family: var(--font-mono);">' + (idx + 1) + '</td>' +
          '<td><strong style="color: #FFFFFF;">' + r.nama + '</strong></td>' +
          '<td style="text-align: center;">' +
            '<input type="number" inputmode="numeric" min="0" class="dark-input" style="width: 56px; text-align: center; color: #818CF8; font-weight: 700;" value="' + r.ubi + '" onchange="window.updateBuku1RowPlan(' + idx + ', \'ubi\', this.value)" title="Rencana kirim Ubi">' +
          '</td>' +
          '<td style="text-align: center;">' +
            '<input type="number" inputmode="numeric" min="0" class="dark-input" style="width: 56px; text-align: center; color: #34D399; font-weight: 700;" value="' + r.sayur + '" onchange="window.updateBuku1RowPlan(' + idx + ', \'sayur\', this.value)" title="Rencana kirim Sayur">' +
          '</td>' +
          '<td style="text-align: center;">' +
            '<input type="number" inputmode="numeric" min="0" class="dark-input" style="width: 56px; text-align: center; color: #FBBF24; font-weight: 700;" value="' + r.roti + '" onchange="window.updateBuku1RowPlan(' + idx + ', \'roti\', this.value)" title="Rencana kirim Roti">' +
          '</td>' +
          '<td style="font-family: var(--font-mono); font-weight: 800; color: #FFFFFF; text-align: center;">' + r.kirim + '</td>' +
          '<td style="text-align: center;">' +
            '<input type="number" inputmode="numeric" min="0" class="dark-input" style="width: 52px; text-align: center; color: #818CF8; font-weight: 700;" value="' + r.bonus + '" onchange="window.updateBuku1RowPlan(' + idx + ', \'bonus\', this.value)" title="Bonus gratis pemilik">' +
          '</td>' +
          '<td style="text-align: center;">' +
            '<input type="number" inputmode="numeric" min="0" class="dark-input" style="width: 60px; text-align: center;" value="' + r.retur + '" onchange="window.updateBuku1RowRetur(' + idx + ', this.value)">' +
          '</td>' +
          '<td style="font-family: var(--font-mono); font-weight: 800; color: #38BDF8; text-align: center;">' + r.laku + ' pcs</td>' +
          '<td style="text-align: right;">' +
            '<div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px;">' +
              '<span style="font-size: 0.75rem; color: #64748B; font-family: var(--font-mono);">Rp</span>' +
              '<input type="number" inputmode="numeric" class="dark-input" style="width: 96px; text-align: right; color: #34D399; font-weight: 800; font-family: var(--font-mono); padding: 5px 8px;" value="' + r.setor + '" onchange="window.updateBuku1RowSetor(' + idx + ', this.value)">' +
            '</div>' +
          '</td>' +
          '<td style="text-align: center;" class="no-print">' +
            '<button type="button" class="btn-del-row" style="color: #38BDF8; width: auto; padding: 4px 8px; font-size: 0.72rem; font-weight: 700;" onclick="window.openEditBuku1RowModal(' + idx + ')" title="Edit Baris">Edit</button>' +
          '</td>';
      } else {
        tr.innerHTML = 
          '<td style="text-align: center; font-family: var(--font-mono);">' + (idx + 1) + '</td>' +
          '<td><strong style="color: #FFFFFF;">' + r.nama + '</strong></td>' +
          '<td style="font-family: var(--font-mono); text-align: center; color: #818CF8; font-weight: 700;">' + r.ubi + '</td>' +
          '<td style="font-family: var(--font-mono); text-align: center; color: #34D399; font-weight: 700;">' + r.sayur + '</td>' +
          '<td style="font-family: var(--font-mono); text-align: center; color: #FBBF24; font-weight: 700;">' + r.roti + '</td>' +
          '<td style="font-family: var(--font-mono); font-weight: 800; color: #FFFFFF; text-align: center;">' + r.kirim + '</td>' +
          '<td style="font-family: var(--font-mono); color: #818CF8; font-weight: 700; text-align: center;">+' + r.bonus + '</td>' +
          '<td style="font-family: var(--font-mono); color: #FB923C; font-weight: 700; text-align: center;">' + r.retur + '</td>' +
          '<td style="font-family: var(--font-mono); font-weight: 800; color: #38BDF8; text-align: center;">' + r.laku + ' pcs</td>' +
          '<td style="font-family: var(--font-mono); font-weight: 800; color: #34D399; text-align: right;">Rp ' + (r.setor || 0).toLocaleString('id-ID') + '</td>' +
          '<td style="text-align: center;" class="no-print">' +
            '<button type="button" class="btn-del-row" style="color: #38BDF8; width: auto; padding: 4px 8px; font-size: 0.72rem; font-weight: 700;" onclick="window.openEditBuku1RowModal(' + idx + ')" title="Edit Baris">Edit</button>' +
          '</td>';
      }
      b1Body.appendChild(tr);
    });

    if (b1Foot) {
      b1Foot.innerHTML = 
        '<tr style="background: rgba(0, 0, 0, 0.25); font-weight: 800; border-top: 2px solid var(--card-border);">' +
          '<td colspan="5" style="text-align: right; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; padding: 12px 14px;">TOTAL KONSINYASI:</td>' +
          '<td style="font-family: var(--font-mono); color: #FFFFFF; font-weight: 900; padding: 12px 14px; text-align: center;">' + sumKirim + '</td>' +
          '<td style="font-family: var(--font-mono); color: #818CF8; font-weight: 800; padding: 12px 14px; text-align: center;">+' + sumBonus + '</td>' +
          '<td style="font-family: var(--font-mono); color: #FB923C; font-weight: 800; padding: 12px 14px; text-align: center;">' + sumRetur + '</td>' +
          '<td style="font-family: var(--font-mono); color: #38BDF8; font-weight: 900; padding: 12px 14px; text-align: center;">' + sumLaku + ' pcs</td>' +
          '<td style="font-family: var(--font-mono); color: #34D399; font-size: 0.95rem; font-weight: 900; padding: 12px 14px; text-align: right;">Rp ' + sumSetor.toLocaleString('id-ID') + '</td>' +
          '<td class="no-print"></td>' +
        '</tr>';
    }
  }

  // 3. SLIP BOX 6 TITIK
  const slipContainer = document.getElementById('slipBoxContainer');
  if (slipContainer) {
    slipContainer.innerHTML = '';
    rowsBuku1.forEach((t, idx) => {
      const card = document.createElement('div');
      card.className = 'slip-box-card';
      const hargaSetor = t.hargaSetor !== undefined ? t.hargaSetor : (t.nama.includes('Ragil') ? 1000 : 800);
      const marginMitra = t.marginMitra !== undefined ? t.marginMitra : 200;

      card.innerHTML = 
        '<div class="slip-box-header">' +
          '<div class="slip-box-title">LABEL BOX: ' + t.nama + '</div>' +
          '<span class="badge-status done">SIAP KIRIM</span>' +
        '</div>' +
        '<div class="slip-box-body">' +
          '• Lumpia Ubi Ungu Keju : <strong>' + t.ubi + ' pcs</strong><br>' +
          '• Lumpia Sayur Sosis   : <strong>' + t.sayur + ' pcs</strong><br>' +
          '• Roti Goreng Collins  : <strong>' + t.roti + ' pcs</strong><br>' +
          '• Bonus Gratis Pemilik : <strong style="color: #818CF8;">+' + t.bonus + ' pcs (Gratis)</strong><br>' +
          '--------------------------------------------<br>' +
          '<strong style="color: #FFFFFF;">TOTAL ISI BOX: ' + (t.kirim + t.bonus) + ' PCS</strong>' +
        '</div>' +
        '<div class="slip-box-footer">' +
          '<div class="slip-rate-group">' +
            '<span>Setor: Rp</span>' +
            '<input type="number" inputmode="numeric" class="slip-rate-input" value="' + hargaSetor + '" onchange="window.updateSlipRate(' + idx + ', \'hargaSetor\', this.value)" title="Ketik manual tarif setor">' +
            '<span>/pcs</span>' +
          '</div>' +
          '<div class="slip-rate-group">' +
            '<span>Margin: Rp</span>' +
            '<input type="number" inputmode="numeric" class="slip-rate-input margin" value="' + marginMitra + '" onchange="window.updateSlipRate(' + idx + ', \'marginMitra\', this.value)" title="Ketik manual margin mitra">' +
            '<span>/pcs</span>' +
          '</div>' +
        '</div>';
      slipContainer.appendChild(card);
    });
  }

  // 4. BUKU 2 KUITANSI (STATUS STRUK DIHAPUS + TOMBOL EDIT DIAKTIFKAN)
  const dateSelectEl = document.getElementById('kuitansiDateSelect');
  const kuitansiBody = document.getElementById('kuitansiTableBody');
  const kuitansiTotalEl = document.getElementById('kuitansiTableTotal');
  const kuitansiTerbilangEl = document.getElementById('kuitansiTerbilangDisplay');
  const kuitansiNoEl = document.getElementById('kuitansiNoDisplay');
  const kuitansiTglEl = document.getElementById('kuitansiTglDisplay');
  const kuitansiPlafonEl = document.getElementById('kuitansiPlafonDisplay');
  const kuitansiRekapModalEl = document.getElementById('kuitansiRekapModal');
  const kuitansiRekapBelanjaEl = document.getElementById('kuitansiRekapBelanja');
  const kuitansiRekapEndapanEl = document.getElementById('kuitansiRekapEndapan');
  const kuitansiCurrentDayLabelEl = document.getElementById('kuitansiCurrentDayLabel');

  const defaultDates = OPERATIONAL_DAYS_CONFIG.map(c => c.b2Key);
  const dataDates = (auraData.buku2Belanja || []).map(b => b.tgl);
  const allKuitansiDates = [...new Set([...defaultDates, ...dataDates])].filter(Boolean);

  if (!allKuitansiDates.includes(selectedBuku2Date)) {
    selectedBuku2Date = allKuitansiDates[allKuitansiDates.length - 1] || '21/10';
  }

  const dayTotals = {};
  allKuitansiDates.forEach(d => dayTotals[d] = 0);
  (auraData.buku2Belanja || []).forEach(b => {
    if (dayTotals[b.tgl] !== undefined) dayTotals[b.tgl] += (b.biaya || 0);
    else dayTotals[b.tgl] = (b.biaya || 0);
  });

  if (dateSelectEl) {
    dateSelectEl.innerHTML = '';
    allKuitansiDates.forEach(d => {
      const cfg = KUITANSI_DATE_CONFIG[d] || { namaHari: 'Hari ' + d };
      const totalNum = dayTotals[d] || 0;
      const totalStr = totalNum > 0 ? ' • Total: Rp ' + totalNum.toLocaleString('id-ID') : ' • Belum ada belanja';
      const isHariIni = (d === REAL_TODAY_B2KEY) ? ' [Hari Ini]' : '';

      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = cfg.namaHari + isHariIni + totalStr;
      if (d === selectedBuku2Date) opt.selected = true;
      dateSelectEl.appendChild(opt);
    });
    dateSelectEl.value = selectedBuku2Date;
  }

  const currentItems = (auraData.buku2Belanja || []).filter(b => b.tgl === selectedBuku2Date);
  const currentDayCfg = KUITANSI_DATE_CONFIG[selectedBuku2Date] || {
    namaHari: 'Hari ' + selectedBuku2Date,
    noBkk: 'BKK-' + selectedBuku2Date.replace(/[^0-9]/g, '') + '-01',
    modal: 65000
  };

  const matchedDayCfg = OPERATIONAL_DAYS_CONFIG.find(c => c.b2Key === selectedBuku2Date);
  const dayAccounting = matchedDayCfg ? computeDayAccounting(matchedDayCfg.isoDate) : null;
  const dayTotal = currentItems.reduce((acc, cur) => acc + (cur.biaya || 0), 0);
  const dayPlafon = dayAccounting ? dayAccounting.plafonModal : Math.max(currentDayCfg.modal || 65000, dayTotal);
  const dayEndapan = dayPlafon - dayTotal;

  if (kuitansiCurrentDayLabelEl) kuitansiCurrentDayLabelEl.innerText = selectedBuku2Date;
  if (kuitansiNoEl) kuitansiNoEl.innerText = currentDayCfg.noBkk;
  if (kuitansiTglEl) kuitansiTglEl.innerText = currentDayCfg.namaHari;
  if (kuitansiPlafonEl) kuitansiPlafonEl.innerText = 'Rp ' + dayPlafon.toLocaleString('id-ID');
  if (kuitansiRekapModalEl) kuitansiRekapModalEl.innerText = 'Rp ' + dayPlafon.toLocaleString('id-ID');
  if (kuitansiRekapBelanjaEl) kuitansiRekapBelanjaEl.innerText = 'Rp ' + dayTotal.toLocaleString('id-ID');
  if (kuitansiRekapEndapanEl) {
    kuitansiRekapEndapanEl.innerText = dayEndapan < 0
      ? '-Rp ' + Math.abs(dayEndapan).toLocaleString('id-ID') + ' (Subsidi Kotak)'
      : 'Rp ' + dayEndapan.toLocaleString('id-ID');
    kuitansiRekapEndapanEl.style.color = dayEndapan < 0 ? '#FB7185' : '#34D399';
  }
  if (kuitansiTotalEl) kuitansiTotalEl.innerText = 'Rp ' + dayTotal.toLocaleString('id-ID');
  if (kuitansiTerbilangEl) kuitansiTerbilangEl.innerText = '# ' + terbilangRupiah(dayTotal) + ' #';

  if (kuitansiBody) {
    kuitansiBody.innerHTML = '';
    if (currentItems.length === 0) {
      kuitansiBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 28px 14px; color: var(--text-muted); font-style: italic;">Belum ada catatan belanja pada lembar kuitansi ini. Tambahkan item belanjaan Anda melalui form di bawah.</td></tr>';
    } else {
      currentItems.forEach((b, localIdx) => {
        const globalIdx = auraData.buku2Belanja.findIndex(item => item === b);
        let badgeClass = 'badge-toko';
        let badgeLabel = 'Toko / Minimarket';
        const p = (b.paraf || '').toLowerCase();
        if (p.includes('pasar') || p.includes('subuh') || p.includes('sayur') || p.includes('lumpia') || p.includes('kulit') || p.includes('ubi') || p.includes('wortel')) {
          badgeClass = 'badge-pasar';
          badgeLabel = 'Pasar Subuh';
        } else if (p.includes('operasional') || p.includes('gas') || p.includes('awet') || p.includes('minyak')) {
          badgeClass = 'badge-gas';
          badgeLabel = 'Operasional / Gas';
        }

        const badge = '<span class="badge-kategori ' + badgeClass + '">' + badgeLabel + '</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = 
          '<td style="text-align: center; font-family: var(--font-mono);">' + (localIdx + 1) + '</td>' +
          '<td><strong style="color: #FFFFFF;">' + b.nama + '</strong></td>' +
          '<td>' + badge + '</td>' +
          '<td style="color: var(--text-secondary);">' + b.qty + '</td>' +
          '<td style="font-family: var(--font-mono); font-weight: 800; color: #FB7185; text-align: right;">Rp ' + (b.biaya || 0).toLocaleString('id-ID') + '</td>' +
          '<td style="text-align: center;" class="no-print">' +
            '<div style="display: flex; gap: 4px; justify-content: center;">' +
              '<button type="button" class="btn-del-row" style="color: #38BDF8;" onclick="window.openEditBelanjaModal(' + globalIdx + ')" title="Edit item belanja ini"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>' +
              '<button type="button" class="btn-del-row" onclick="window.handleDeleteBelanjaFromKuitansi(' + globalIdx + ')" title="Hapus belanja ini"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>' +
            '</div>' +
          '</td>';
        kuitansiBody.appendChild(tr);
      });
    }
  }

  // 5. ARUS KAS & LABA BERSIH (100% REAL-TIME DARI DISTRIBUSI & KAS KELUAR)
  const b3Body = document.getElementById('buku3TableBody');
  const b3Foot = document.getElementById('buku3TableFoot');
  const allDaysAccounting = getAllDaysAccounting();

  // Sinkronkan kembali ke auraData.buku3Kas
  auraData.buku3Kas = allDaysAccounting.map(d => ({
    tgl: d.tgl,
    hari: d.hari,
    isoDate: d.isoDate,
    isTarget: d.isTarget,
    kirim: d.kirim,
    retur: d.retur,
    laku: d.laku,
    setor: d.omzet,
    modal: d.plafonModal,
    gaji: d.gajiBos,
    realBelanja: d.belanja,
    endapan: d.endapanHarian
  }));

  if (b3Body) {
    b3Body.innerHTML = '';
    let totalKirimAll = 0, totalReturAll = 0, totalLakuAll = 0, totalSetorAll = 0, totalModalAll = 0, totalGajiAll = 0, totalBelanjaAll = 0, totalEndapanAll = 0;

    auraData.buku3Kas.forEach(k => {
      // Hanya jumlahkan hari yang sudah terverifikasi (atau jika hari tersebut sedang dipilih aktif)
      const includeInVerifiedTotal = !k.isTarget || k.isoDate === activeDate;
      if (includeInVerifiedTotal) {
        totalKirimAll += (k.kirim || 0);
        totalReturAll += (k.retur || 0);
        totalLakuAll += (k.laku || 0);
        totalSetorAll += (k.setor || 0);
        totalModalAll += (k.modal || 0);
        totalGajiAll += (k.gaji || 0);
        totalBelanjaAll += (k.realBelanja || 0);
        totalEndapanAll += (k.endapan || 0);
      }

      const endapanFormatted = k.endapan < 0
        ? '-Rp ' + Math.abs(k.endapan).toLocaleString('id-ID')
        : 'Rp ' + (k.endapan || 0).toLocaleString('id-ID');
      const endapanColor = k.endapan < 0 ? '#FB7185' : '#34D399';
      const hariLabel = k.isTarget
        ? '<strong>' + k.hari + '</strong> <span class="mini-tag" style="font-size: 0.62rem; padding: 1px 5px; background: rgba(251, 191, 36, 0.15); color: #FBBF24;">Target</span>'
        : '<strong>' + k.hari + '</strong>';

      const tr = document.createElement('tr');
      if (k.isoDate === activeDate) {
        tr.style.background = 'rgba(56, 189, 248, 0.08)';
      }
      tr.innerHTML = 
        '<td style="font-family: var(--font-mono); font-weight: 700;">' + k.tgl + '</td>' +
        '<td>' + hariLabel + '</td>' +
        '<td style="font-family: var(--font-mono);">' + k.kirim + '</td>' +
        '<td style="font-family: var(--font-mono); color: #FBBF24;">' + k.retur + '</td>' +
        '<td style="font-family: var(--font-mono); font-weight: 800; color: #38BDF8;">' + k.laku + '</td>' +
        '<td style="font-family: var(--font-mono); font-weight: 800; color: #34D399;">Rp ' + (k.setor || 0).toLocaleString('id-ID') + '</td>' +
        '<td style="font-family: var(--font-mono); color: #94A3B8;">Rp ' + (k.modal || 0).toLocaleString('id-ID') + '</td>' +
        '<td style="font-family: var(--font-mono); font-weight: 800; color: #818CF8;">Rp ' + (k.gaji || 0).toLocaleString('id-ID') + '</td>' +
        '<td style="font-family: var(--font-mono); color: #F87171;">Rp ' + (k.realBelanja || 0).toLocaleString('id-ID') + '</td>' +
        '<td style="font-family: var(--font-mono); font-weight: 800; color: ' + endapanColor + ';">' + endapanFormatted + '</td>';
      b3Body.appendChild(tr);
    });

    if (b3Foot) {
      b3Foot.innerHTML = 
        '<tr style="background: rgba(0, 0, 0, 0.25); font-weight: 800; border-top: 2px solid var(--card-border);">' +
          '<td colspan="2" style="text-align: right; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; padding: 12px 14px;">TOTAL AKTUAL TERVERIFIKASI:</td>' +
          '<td style="font-family: var(--font-mono); color: #FFFFFF; font-weight: 800; padding: 12px 14px;">' + totalKirimAll + '</td>' +
          '<td style="font-family: var(--font-mono); color: #FBBF24; font-weight: 800; padding: 12px 14px;">' + totalReturAll + '</td>' +
          '<td style="font-family: var(--font-mono); color: #38BDF8; font-weight: 900; padding: 12px 14px;">' + totalLakuAll + '</td>' +
          '<td style="font-family: var(--font-mono); color: #34D399; font-weight: 900; padding: 12px 14px;">Rp ' + totalSetorAll.toLocaleString('id-ID') + '</td>' +
          '<td style="font-family: var(--font-mono); color: #94A3B8; font-weight: 800; padding: 12px 14px;">Rp ' + totalModalAll.toLocaleString('id-ID') + '</td>' +
          '<td style="font-family: var(--font-mono); color: #818CF8; font-weight: 900; font-size: 0.95rem; padding: 12px 14px;">Rp ' + totalGajiAll.toLocaleString('id-ID') + '</td>' +
          '<td style="font-family: var(--font-mono); color: #F87171; font-weight: 800; padding: 12px 14px;">Rp ' + totalBelanjaAll.toLocaleString('id-ID') + '</td>' +
          '<td style="font-family: var(--font-mono); color: #34D399; font-weight: 900; padding: 12px 14px;">Rp ' + totalEndapanAll.toLocaleString('id-ID') + '</td>' +
        '</tr>';
    }

    const bepTarget = 190000;
    const bepRemain = Math.max(0, bepTarget - totalGajiAll);
    const bepPct = Math.min(100, ((totalGajiAll / bepTarget) * 100)).toFixed(1);
    const avgDailyGaji = totalGajiAll > 0 ? (totalGajiAll / 3) : 21500;
    const daysRemain = bepRemain > 0 ? Math.ceil(bepRemain / avgDailyGaji) : 0;

    const accEl = document.getElementById('bepAccumulated');
    const remEl = document.getElementById('bepRemaining');
    const estEl = document.getElementById('bepDaysEstimate');
    const pctEl = document.getElementById('bepPercent');
    const barEl = document.getElementById('bepBarFill');

    if (accEl) accEl.innerText = 'Rp ' + totalGajiAll.toLocaleString('id-ID');
    if (remEl) remEl.innerText = 'Rp ' + bepRemain.toLocaleString('id-ID');
    if (estEl) estEl.innerText = bepRemain === 0 ? 'LUNAS BEP 100%!' : '~' + daysRemain + ' Hari Kerja';
    if (pctEl) pctEl.innerText = bepPct + '%';
    if (barEl) barEl.style.width = bepPct + '%';
  }

  // 6. MASTER BAHAN TABLE
  window.renderMasterBahanTable();

  // 7. MANAJEMEN STOK DENGAN SATUAN EKSPLISIT & KPI SUMMARY (CLEAN & MINIMAL)
  const stokBody = document.getElementById('stokTableBody');
  if (stokBody) {
    stokBody.innerHTML = '';
    let countAman = 0, countMenipis = 0, countKritis = 0, estBelanjaMalam = 0;
    const pasarItems = [];
    const tokoItems = [];

    auraData.stokBahan.forEach((s, idx) => {
      const min = s.minTrigger !== undefined ? s.minTrigger : 1;
      const isCritical = s.stok <= 0;
      const isLow = s.stok <= min;

      if (isCritical) {
        countKritis++;
      } else if (isLow) {
        countMenipis++;
      } else {
        countAman++;
      }

      if (isLow || isCritical) {
        // Hitung estimasi biaya restock langsung dari harga terbaru di Master Bahan Baku
        const nLow = (s.nama || '').toLowerCase();
        const orderPackagesMatch = String(s.orderQty || '1').match(/(\d+)/);
        const orderPackages = orderPackagesMatch ? parseInt(orderPackagesMatch[1], 10) : 1;
        let itemRestockCost = 0;
        if (nLow.includes('roti')) itemRestockCost = getMasterItemMeta('Roti Tawar', 10000, 14, false).harga * orderPackages;
        else if (nLow.includes('keju')) itemRestockCost = getMasterItemMeta('Keju', 11500, 160, true).harga * orderPackages;
        else if (nLow.includes('minyak')) itemRestockCost = getMasterItemMeta('Minyak Goreng', 17000, 900, true).harga * orderPackages;
        else if (nLow.includes('kulit')) itemRestockCost = getMasterItemMeta('Kulit Lumpia', 10000, 36, false).harga * orderPackages;
        else if (nLow.includes('ubi')) itemRestockCost = getMasterItemMeta('Ubi Ungu', 11000, 1000, true).harga * orderPackages;
        else if (nLow.includes('wortel')) itemRestockCost = getMasterItemMeta('Wortel', 7000, 500, true).harga;
        else if (nLow.includes('jagung')) itemRestockCost = getMasterItemMeta('Jagung', 5000, 3, false).harga;
        else if (nLow.includes('telur')) itemRestockCost = getMasterItemMeta('Telur', 5000, 4, false).harga;
        else if (nLow.includes('daun bawang')) itemRestockCost = getMasterItemMeta('Daun Bawang', 2000, 100, true).harga;
        else if (nLow.includes('sosis')) itemRestockCost = getMasterItemMeta('Sosis', 18000, 40, false).harga;
        else if (nLow.includes('collins')) itemRestockCost = getMasterItemMeta('Collins', 48000, 1000, true).harga;
        else if (nLow.includes('panir')) itemRestockCost = getMasterItemMeta('Panir', 16000, 1000, true).harga;

        if (s.jalur === 'A' && isCritical) {
          estBelanjaMalam += itemRestockCost;
        }
        if (s.jalur === 'B') pasarItems.push({ nama: s.nama, qty: s.orderQty + (itemRestockCost > 0 ? ' (~Rp ' + itemRestockCost.toLocaleString('id-ID') + ')' : '') });
        if (s.jalur === 'A') tokoItems.push({ nama: s.nama, qty: s.orderQty + (itemRestockCost > 0 ? ' (~Rp ' + itemRestockCost.toLocaleString('id-ID') + ')' : '') });
      }

      let statusBadge = '<span class="badge-status done">Aman</span>';
      if (isCritical) {
        statusBadge = '<span class="badge-status alert">Habis</span>';
      } else if (isLow) {
        statusBadge = '<span class="badge-status progress" style="background: rgba(245, 158, 11, 0.14); border-color: rgba(245, 158, 11, 0.35); color: #FBBF24;">Menipis</span>';
      }

      const jalurText = s.jalur === 'A'
        ? 'Toko / Minimarket'
        : (s.jalur === 'B' ? 'Pasar Subuh' : 'Stok Dapur');

      const cleanAction = isCritical
        ? (s.jalur === 'A' ? 'Beli malam ini: ' + s.orderQty : 'Pesan pasar: ' + s.orderQty)
        : (isLow
          ? (s.jalur === 'A' ? 'Siapkan belanja: ' + s.orderQty : 'Titip pasar: ' + s.orderQty)
          : s.action);

      const actionStyle = isCritical
        ? 'color: #FCA5A5; font-weight: 600;'
        : (isLow ? 'color: #FCD34D;' : 'color: var(--text-secondary);');

      const ratio = getStokGramRatio(s);
      s.gramPerUnit = ratio;
      const curGram = s.stokGram !== undefined ? s.stokGram : Math.round((s.stok || 0) * ratio);
      const unitLabel = s.satuan || 'pcs';

      const tr = document.createElement('tr');
      tr.innerHTML = 
        '<td style="text-align: center; font-family: var(--font-mono); color: var(--text-muted);">' + (idx + 1) + '</td>' +
        '<td>' +
          '<span style="color: #F8FAFC; font-weight: 600; display: block;">' + s.nama + '</span>' +
          '<span style="font-size: 0.68rem; color: #38BDF8; font-family: var(--font-mono);">1 ' + unitLabel + ' ≈ ' + ratio.toLocaleString('id-ID') + 'g</span>' +
        '</td>' +
        '<td style="color: var(--text-secondary); font-size: 0.8rem;">' + jalurText + '</td>' +
        '<td style="text-align: center;">' +
          '<div style="display: inline-flex; align-items: center; gap: 5px; flex-wrap: nowrap; justify-content: center;">' +
            '<div class="stok-input-wrap" style="margin: 0;">' +
              '<input type="number" step="any" min="0" class="dark-input" style="width: 58px; color: ' + (isCritical ? '#F87171' : '#F8FAFC') + '; font-weight: 700; padding: 4px 6px;" value="' + s.stok + '" onchange="window.updateStokVal(' + idx + ', this.value)" title="Ketik sisa dalam satuan ' + unitLabel + '">' +
              '<span class="stok-unit-tag">' + unitLabel + '</span>' +
            '</div>' +
            '<span style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700;">≈</span>' +
            '<div class="stok-input-wrap" style="margin: 0;">' +
              '<input type="number" step="any" min="0" class="dark-input" style="width: 66px; color: #38BDF8; font-weight: 700; padding: 4px 6px;" value="' + curGram + '" onchange="window.updateStokFromGram(' + idx + ', this.value)" title="Ketik sisa langsung dalam gram (g)">' +
              '<span class="stok-unit-tag" style="color: #38BDF8;">g</span>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td style="text-align: center;">' + statusBadge + '</td>' +
        '<td style="font-size: 0.82rem; ' + actionStyle + '">' + cleanAction + '</td>';
      stokBody.appendChild(tr);
    });

    const pasarListEl = document.getElementById('dispatchPasarList');
    if (pasarListEl) {
      pasarListEl.innerHTML = pasarItems.length > 0
        ? pasarItems.map(i => '<li><span>' + i.nama + '</span><strong>' + i.qty + '</strong></li>').join('')
        : '<li class="dispatch-empty">Seluruh stok bahan Pasar Subuh masih mencukupi.</li>';
    }

    const tokoListEl = document.getElementById('dispatchTokoList');
    if (tokoListEl) {
      tokoListEl.innerHTML = tokoItems.length > 0
        ? tokoItems.map(i => '<li><span>' + i.nama + '</span><strong>' + i.qty + '</strong></li>').join('')
        : '<li class="dispatch-empty">Seluruh stok bahan Toko & Minimarket masih mencukupi.</li>';
    }

    const cntAmanEl = document.getElementById('stockCountAman');
    const cntMenipisEl = document.getElementById('stockCountMenipis');
    const cntKritisEl = document.getElementById('stockCountKritis');
    const estBelanjaEl = document.getElementById('stockEstBelanja');

    if (cntAmanEl) cntAmanEl.innerText = countAman + ' Bahan';
    if (cntMenipisEl) cntMenipisEl.innerText = countMenipis + ' Bahan';
    if (cntKritisEl) cntKritisEl.innerText = countKritis + ' Bahan';
    if (estBelanjaEl) estBelanjaEl.innerText = 'Rp ' + (estBelanjaMalam > 0 ? estBelanjaMalam.toLocaleString('id-ID') : '0');
  }

  // 8. KALKULATOR TAKARAN RESEP & VISUAL SOP FORMULA
  window.calculateTakaran();
  renderRecipeVisualGrid();
}

// ==============================================================
// DOM READY & EVENT ATTACHMENT
// ==============================================================
document.addEventListener('DOMContentLoaded', () => {
  const btnToggle = document.getElementById('btnToggleSidebar');
  if (btnToggle) btnToggle.addEventListener('click', () => window.toggleSidebar());

  const btnClose = document.querySelector('.sidebar-close-btn');
  if (btnClose) btnClose.addEventListener('click', () => window.toggleSidebar(false));

  const backdrop = document.getElementById('sidebarBackdrop');
  if (backdrop) backdrop.addEventListener('click', () => window.toggleSidebar(false));

  // Copy WhatsApp Sayur
  const btnWa = document.getElementById('btnCopyWa');
  if (btnWa) {
    btnWa.addEventListener('click', () => {
      const needed = [];
      const surplus = [];

      auraData.stokBahan.forEach(s => {
        if (s.jalur === 'B') {
          const min = s.minTrigger !== undefined ? s.minTrigger : 1;
          if (s.stok <= min) {
            needed.push('• ' + s.nama + ' : ' + s.orderQty);
          } else {
            surplus.push(s.nama.replace(' Segar', '').replace(' Pasar', '').toLowerCase());
          }
        }
      });

      let msg = "Assalamu'alaikum Mang/Mbak, titip belanjaan pasar untuk diantar besok pagi ya:\n\n";
      if (needed.length > 0) msg += needed.join('\n') + '\n\n';
      else msg += "• (Alhamdulillah seluruh bahan pasar utama masih aman di kulkas, tidak ada pesanan baru).\n\n";

      if (surplus.length > 0) msg += "(Catatan: Stok " + surplus.join(', ') + " masih ada di kulkas). Terima kasih banyak!";
      else msg += "Terima kasih banyak!";

      navigator.clipboard.writeText(msg).then(() => {
        window.showSuccessModal("Tersalin ke Clipboard", "Teks pesanan WA tukang sayur (Siklus L+2) berhasil disalin!\n\n" + msg);
      }).catch(() => {
        window.showAlertModal("Pesan WA Sayur", msg);
      });
    });
  }

  // Copy Belanja Toko Malam
  const btnToko = document.getElementById('btnCopyToko');
  if (btnToko) {
    btnToko.addEventListener('click', () => {
      const needed = [];
      auraData.stokBahan.forEach(s => {
        if (s.jalur === 'A') {
          const min = s.minTrigger !== undefined ? s.minTrigger : 1;
          if (s.stok <= min) needed.push('• ' + s.nama + ' : ' + s.orderQty);
        }
      });

      let msg = "DAFTAR BELANJA TOKO / MINIMARKET (MALAM INI UNTUK SUBUH):\n\n";
      if (needed.length > 0) {
        msg += needed.join('\n') + '\n\n';
        msg += "Wajib dibeli malam ini menggunakan dana Amplop 1 agar subuh siap produksi!";
      } else {
        msg += "• Seluruh bahan toko (Roti, Keju, SKM, Minyak) masih aman di dapur!";
      }

      navigator.clipboard.writeText(msg).then(() => {
        window.showSuccessModal("Tersalin ke Clipboard", "List belanja toko bahan kue / minimarket berhasil disalin!\n\n" + msg);
      }).catch(() => {
        window.showAlertModal("List Belanja Toko", msg);
      });
    });
  }

  // Copy Checklist Takaran Subuh
  const btnTakaran = document.getElementById('btnCopyTakaran');
  if (btnTakaran) {
    btnTakaran.addEventListener('click', () => {
      const ubi = document.getElementById('calcUbiPcs')?.value || '66';
      const sayur = document.getElementById('calcSayurPcs')?.value || '32';
      const roti = document.getElementById('calcRotiPcs')?.value || '38';
      const total = parseInt(ubi, 10) + parseInt(sayur, 10) + parseInt(roti, 10);

      const ubiGram = Math.round(ubi * 13.2);
      const ubiKg = (ubiGram / 1000).toFixed(2);
      const wortel = Math.round(sayur * 5.0);
      const jagung = Math.round(sayur * 3.5);
      const sosis = Math.ceil(sayur * 0.125);
      const rotiLbr = Math.ceil(roti / 2);
      const rotiBagian = Math.ceil(roti / 2);
      const kulitBks = Math.ceil((parseInt(ubi, 10) + parseInt(sayur, 10)) / 36);

      const msg = "CHECKLIST TAKARAN OPERASIONAL DAPUR MOM FITRI (SUBUH):\n" +
                  "Target Produksi: " + total + " PCS (Ubi: " + ubi + ", Sayur: " + sayur + ", Roti: " + roti + ")\n\n" +
                  "1. GOGUMAPIA UBI UNGU KEJU (" + ubi + " pcs - 12g / 1 tbsp peres / 2.5 tsp):\n" +
                  "   • Ubi Ungu Kukus Empuk: " + ubiKg + " kg (" + ubiGram + "g / ≈ " + (ubiGram / 200).toFixed(1) + " buah / " + Math.round(ubiGram / 15) + " tbsp)\n" +
                  "   • Gula Pasir: " + Math.round(ubi * 0.6) + "g (" + (ubi * 0.04).toFixed(1) + " tbsp / " + (ubi * 0.12).toFixed(1) + " tsp)\n" +
                  "   • SKM Putih: " + Math.round(ubi * 0.45) + "g (" + (ubi * 0.03).toFixed(1) + " tbsp / " + (ubi * 0.09).toFixed(1) + " tsp)\n" +
                  "   • Keju Oles Prochiz: " + Math.round(ubi * 1.0) + "g (" + (ubi / 15).toFixed(1) + " tbsp / " + (ubi / 5).toFixed(1) + " tsp • @ 1/4 tsp per pcs)\n" +
                  "   • Lipat Bantal Persegi Panjang Mini, rekatkan ujung dengan lem tepung\n\n" +
                  "2. LUMPIA SEGITIGA SAYUR SOSIS (" + sayur + " pcs - 10g / 1 tbsp peres / 2 tsp):\n" +
                  "   • Wortel Potong Dadu Kecil: " + wortel + "g (≈ " + (wortel / 125).toFixed(1) + " buah • " + Math.round(wortel / 10) + " tbsp / " + Math.round(wortel / 3.3) + " tsp)\n" +
                  "   • Jagung Pipil: " + jagung + "g (≈ " + (jagung / 100).toFixed(1) + " tongkol • " + Math.round(jagung / 10) + " tbsp)\n" +
                  "   • Sosis Dadu Mikro (1 btg = 8 pcs): " + sosis + " batang (" + (sosis * 22) + "g • " + Math.round((sosis * 22) / 10) + " tbsp)\n" +
                  "   • Telur Kocok (Tuang Akhir): " + Math.ceil(sayur * 0.04) + " butir (" + (Math.ceil(sayur * 0.04) * 55) + "g)\n" +
                  "   • Bumbu: " + (sayur * 0.05).toFixed(1) + " tbsp (" + (sayur * 0.15).toFixed(1) + " tsp) Saus Tiram + 1 tsp Kaldu + 1 tsp Garam + 1 tsp Gula\n" +
                  "   • Lipat Bentuk Segitiga (Samosa), rekatkan ujung dengan kuas tepung\n\n" +
                  "3. ROTI GORENG KANTONG COLLINS (" + roti + " pcs - 1 Lembar = 2 Pcs Kantong):\n" +
                  "   • Roti Tawar: " + rotiLbr + " lembar (" + (rotiLbr * 35) + "g • potong 2 & tumpuk kering -> " + rotiBagian + " blok goreng -> belah 2 jadi " + roti + " kantong)\n" +
                  "   • Adonan Terigu Celup Cepat: " + Math.max(1, Math.round((rotiLbr / 9) * 10)) + " tbsp (" + (Math.max(1, Math.round((rotiLbr / 9) * 10)) * 3) + " tsp) terigu + 1/2 tsp garam + air (serapan ~" + Math.round(roti * 2.5) + "g)\n" +
                  "   • Tepung Panir: " + Math.round(roti * 4.0) + "g (" + Math.round((roti * 4.0) / 8) + " tbsp / " + Math.round((roti * 4.0) / 2.7) + " tsp)\n" +
                  "   • Collins Choco Crunchy (Trik bibir luar): " + Math.round(roti * 2.5) + "g (" + ((roti * 2.5) / 15).toFixed(1) + " tbsp / " + ((roti * 2.5) / 5).toFixed(1) + " tsp • @ 1/2 tsp per pcs)\n\n" +
                  "4. KULIT & PENGGORENGAN:\n" +
                  "   • Kulit Lumpia: " + (parseInt(ubi, 10) + parseInt(sayur, 10)) + " lembar (" + kulitBks + " bungkus)\n" +
                  "   • Minyak: 1.5 - 2L di wajan (Api Sedang 160°C, 3.5 - 4 Menit)";

      navigator.clipboard.writeText(msg).then(() => {
        window.showSuccessModal("Checklist Subuh Tersalin", "Panduan takaran subuh presisi berhasil disalin ke clipboard!\n\n" + msg);
      }).catch(() => {
        window.showAlertModal("Checklist Takaran Subuh", msg);
      });
    });
  }

  renderAllViews();
  initFirestoreSync();
});

renderAllViews();
initFirestoreSync();

// ==============================================================
// PWA VERSION & AUTO-UPDATE CONFIRMATION CONTROLLER
// ==============================================================
const APP_VERSION = 'v6.2.0';
const APP_BUILD_TIME = '24/10/2026 15:42 WIB';
const LAST_VERSION_KEY = 'dapur_mom_fitri_last_version';

window.showAppUpdateConfirmationModal = function(buildTime, needReload = false) {
  const timeDisplay = buildTime || APP_BUILD_TIME;
  const overlay = document.getElementById('appModalOverlay');
  const icon = document.getElementById('appModalIcon');
  const titleEl = document.getElementById('appModalTitle');
  const body = document.getElementById('appModalBody');
  const footer = document.getElementById('appModalFooter');

  if (!overlay) return;
  if (icon) {
    icon.innerHTML = '<span style="font-size: 1.5rem;">🚀</span>';
    icon.style.display = 'inline-flex';
  }
  if (titleEl) {
    titleEl.innerText = 'Pembaruan Sistem Berhasil';
  }
  if (body) {
    body.innerHTML = 
      '<div style="text-align: center; padding: 10px 0 16px 0;">' +
        '<div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); margin-bottom: 12px;">' +
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<polyline points="20 6 9 17 4 12"></polyline>' +
          '</svg>' +
        '</div>' +
        '<h4 style="color: #F8FAFC; font-size: 1.1rem; font-weight: 800; margin: 0 0 8px 0;">Aplikasi Telah Diperbaharui</h4>' +
        '<div style="display: inline-block; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 8px; padding: 6px 14px; margin-bottom: 12px;">' +
          '<span style="color: #38BDF8; font-weight: 800; font-size: 0.95rem; font-family: var(--font-mono);">' +
            'Pembaruan: ' + timeDisplay +
          '</span>' +
        '</div>' +
        '<p style="color: #CBD5E1; font-size: 0.88rem; line-height: 1.6; margin: 0;">' +
          'Aplikasi telah diperbaharui pada <strong>' + timeDisplay + '</strong>.<br>' +
          'Versi <strong>' + APP_VERSION + '</strong> telah aktif dengan strategi <strong>Network First</strong> (selalu memprioritaskan data & kode terbaru dari jaringan).' +
        '</p>' +
      '</div>';
  }

  if (footer) {
    if (needReload) {
      footer.innerHTML = 
        '<button type="button" class="tool-btn" onclick="window.closeAppModal()" style="background: #334155; color: #CBD5E1;">Nanti Saja</button>' +
        '<button type="button" class="tool-btn tool-btn-success" id="btnReloadAppUpdate" style="font-weight: 800; min-width: 130px;">Muat Ulang Sekarang</button>';
      const btn = document.getElementById('btnReloadAppUpdate');
      if (btn) {
        btn.onclick = () => {
          localStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
          window.location.reload();
        };
      }
    } else {
      footer.innerHTML = 
        '<button type="button" class="tool-btn tool-btn-success" id="btnAckAppUpdate" style="font-weight: 800; min-width: 140px; margin: 0 auto;">OK, Mengerti</button>';
      const btn = document.getElementById('btnAckAppUpdate');
      if (btn) {
        btn.onclick = () => {
          localStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
          window.closeAppModal();
        };
      }
    }
  }

  overlay.style.display = 'flex';
};

function checkAppVersionOnBoot() {
  const lastVersion = localStorage.getItem(LAST_VERSION_KEY);
  if (lastVersion !== APP_VERSION) {
    setTimeout(() => {
      window.showAppUpdateConfirmationModal(APP_BUILD_TIME, false);
      localStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
    }, 700);
  }
}

// Register Service Worker for PWA Offline Capability (Network-First Strategy)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              window.showAppUpdateConfirmationModal(APP_BUILD_TIME, true);
            }
          };
        }
      };
    }).catch((err) => {
      console.log('SW registration note:', err);
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'APP_UPDATED') {
        window.showAppUpdateConfirmationModal(event.data.buildTime || APP_BUILD_TIME, false);
      }
    });
  });
}

checkAppVersionOnBoot();

// ==============================================================
// PWA INSTALLATION CONTROLLER (PC & MOBILE)
// ==============================================================
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  console.log('PWA: beforeinstallprompt event captured!');

  const btnSidebar = document.getElementById('btnPwaInstallSidebar');
  const btnMobile = document.getElementById('btnPwaInstallMobile');
  if (btnSidebar) btnSidebar.style.display = 'flex';
  if (btnMobile) btnMobile.style.display = 'inline-flex';
});

window.triggerPwaInstall = async function() {
  if (window.location.protocol === 'file:') {
    window.showAlertModal(
      "Panduan Pasang PWA",
      "Saat ini aplikasi dibuka langsung dari folder (file:///). Browser membatasi instalasi PWA pada berkas offline tanpa server.\n\n" +
      "CARA PASANG DI PC / LAPTOP:\n" +
      "1. Buka folder aplikasi di komputer.\n" +
      "2. Klik 2x file 'JALANKAN_PWA_MOM_FITRI.bat'.\n" +
      "3. Browser otomatis membuka http://localhost:8080.\n" +
      "4. Klik tombol 'Pasang Aplikasi' atau ikon (+) di bilah alamat browser!\n\n" +
      "CARA PASANG DI HP (ANDROID / IPHONE):\n" +
      "Buka browser di HP, tekan menu titik tiga atau tombol Bagikan -> Pilih 'Tambahkan ke Layar Utama' (Add to Home Screen)."
    );
    return;
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    console.log('PWA install choice outcome:', outcome);
    deferredInstallPrompt = null;
  } else {
    window.showAlertModal(
      "Cara Pasang Aplikasi (PWA)",
      "• Google Chrome / Edge (PC):\n" +
      "Klik tombol (+) atau ikon 'Install' di sebelah kanan bilah alamat URL browser.\n\n" +
      "• Android (Chrome):\n" +
      "Tekan menu titik tiga di kanan atas -> Pilih 'Pasang aplikasi' atau 'Tambahkan ke Layar Utama'.\n\n" +
      "• iPhone / iPad (Safari):\n" +
      "Tekan tombol Bagikan (ikon kotak panah ke atas) -> Gulir ke bawah -> Pilih 'Tambahkan ke Layar Utama'."
    );
  }
};

window.addEventListener('appinstalled', () => {
  console.log('PWA Dapur Mom Fitri berhasil dipasang!');
  const btnSidebar = document.getElementById('btnPwaInstallSidebar');
  const btnMobile = document.getElementById('btnPwaInstallMobile');
  if (btnSidebar) btnSidebar.style.display = 'none';
  if (btnMobile) btnMobile.style.display = 'none';
  window.showSuccessModal("Pemasangan Berhasil", "Aplikasi DAPUR MOM FITRI berhasil dipasang ke perangkat Anda!");
});
