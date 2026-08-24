import Papa from 'papaparse';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CSVRow {
  No: string;
  'Program Kegiatan': string;
  Kegiatan: string;
  'Sub Kegiatan': string;
  'Rincian Kegiatan': string;
  'Deskripsi Rincian Kegiatan': string;
  Sasaran: string;
  'Daftar Penerima Manfaat': string;
  'Pagu Anggaran': string;
  'Capaian Realisasi Nominal': string;
  'Capaian Realisasi Persentase': string;
  'Capaian Realisasi Fisik': string;
  'Jadwal Pelaksanaan': string;
  'Sumber Anggaran': string;
  'Bentuk Sasaran': string;
  Bidang: string;
}

export interface LeafDetail {
  rincianKegiatan: string;
  deskripsiRincianKegiatan: string;
  sasaran: string;
  bentukSasaran: string;
  daftarPenerimaManfaat: string;
  paguAnggaran: string;
  sumberAnggaran: string;
  capaianRealisasiNominal: string;
  capaianRealisasiPersentase: string;
  capaianRealisasiFisik: string;
  jadwalPelaksanaan: string;
  breadcrumb: string[];
}

export interface TreeNode {
  id: string;
  name: string;
  level: number; // 0=root, 1=bidang, 2=program, 3=kegiatan, 4=sub, 5=rincian
  children: TreeNode[];
  data?: LeafDetail;
  childCount?: number; // total leaf descendants
}

export const LEVEL_NAMES = [
  'Root',
  'Bidang',
  'Program Kegiatan',
  'Kegiatan',
  'Sub Kegiatan',
  'Rincian Kegiatan',
] as const;

export const LEVEL_COLORS = [
  '#991B1B', // root – deep red
  '#DC2626', // bidang – red
  '#EA580C', // program – orange
  '#D97706', // kegiatan – amber
  '#059669', // sub kegiatan – emerald
  '#6366F1', // rincian – indigo
] as const;

// ─── CSV Fetching ────────────────────────────────────────────────────────────

export async function fetchAndParseCSV(url: string): Promise<CSVRow[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
  }
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parse warnings:', results.errors);
        }
        resolve(results.data);
      },
      error: (error: Error) => reject(error),
    });
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Safely trim a value, returning fallback if empty/null/undefined */
function safe(value: string | undefined | null, fallback = '-'): string {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function countLeaves(node: TreeNode): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
}

// ─── Tree Building ───────────────────────────────────────────────────────────

export function buildTree(rows: CSVRow[], rootLabel = 'Dinas Sosial P3A'): TreeNode {
  const root: TreeNode = {
    id: 'root',
    name: rootLabel,
    level: 0,
    children: [],
  };

  const bidangMap = new Map<string, TreeNode>();

  for (const row of rows) {
    const bidangName = safe(row['Bidang'], '');
    const programName = safe(row['Program Kegiatan'], '');
    const kegiatanName = safe(row['Kegiatan'], '');
    const subKegiatanName = safe(row['Sub Kegiatan'], '');
    const rincianName = safe(row['Rincian Kegiatan'], '');

    if (!bidangName) continue;

    // ── Level 1: Bidang ──
    if (!bidangMap.has(bidangName)) {
      const node: TreeNode = {
        id: `bidang-${bidangMap.size}`,
        name: bidangName,
        level: 1,
        children: [],
      };
      bidangMap.set(bidangName, node);
      root.children.push(node);
    }
    const bidangNode = bidangMap.get(bidangName)!;

    if (!programName) continue;

    // ── Level 2: Program Kegiatan ──
    let programNode = bidangNode.children.find((c) => c.name === programName);
    if (!programNode) {
      programNode = {
        id: `${bidangNode.id}/prog-${bidangNode.children.length}`,
        name: programName,
        level: 2,
        children: [],
      };
      bidangNode.children.push(programNode);
    }

    if (!kegiatanName) continue;

    // ── Level 3: Kegiatan ──
    let kegiatanNode = programNode.children.find((c) => c.name === kegiatanName);
    if (!kegiatanNode) {
      kegiatanNode = {
        id: `${programNode.id}/keg-${programNode.children.length}`,
        name: kegiatanName,
        level: 3,
        children: [],
      };
      programNode.children.push(kegiatanNode);
    }

    if (!subKegiatanName) continue;

    // ── Level 4: Sub Kegiatan ──
    let subNode = kegiatanNode.children.find((c) => c.name === subKegiatanName);
    if (!subNode) {
      subNode = {
        id: `${kegiatanNode.id}/sub-${kegiatanNode.children.length}`,
        name: subKegiatanName,
        level: 4,
        children: [],
      };
      kegiatanNode.children.push(subNode);
    }

    if (!rincianName) continue;

    // ── Level 5: Rincian Kegiatan (leaf) ──
    const leafNode: TreeNode = {
      id: `${subNode.id}/rin-${subNode.children.length}`,
      name: rincianName,
      level: 5,
      children: [],
      data: {
        rincianKegiatan: rincianName,
        deskripsiRincianKegiatan: safe(row['Deskripsi Rincian Kegiatan']),
        sasaran: safe(row['Sasaran']),
        bentukSasaran: safe(row['Bentuk Sasaran']),
        daftarPenerimaManfaat: safe(row['Daftar Penerima Manfaat']),
        paguAnggaran: safe(row['Pagu Anggaran']),
        sumberAnggaran: safe(row['Sumber Anggaran']),
        capaianRealisasiNominal: safe(row['Capaian Realisasi Nominal']),
        capaianRealisasiPersentase: safe(row['Capaian Realisasi Persentase']),
        capaianRealisasiFisik: safe(row['Capaian Realisasi Fisik']),
        jadwalPelaksanaan: safe(row['Jadwal Pelaksanaan']),
        breadcrumb: [bidangName, programName, kegiatanName, subKegiatanName],
      },
    };
    subNode.children.push(leafNode);
  }

  // Annotate child counts
  function annotateCount(node: TreeNode) {
    node.childCount = countLeaves(node);
    node.children.forEach(annotateCount);
  }
  annotateCount(root);

  return root;
}

// ─── Collect all node IDs (for default expanded state) ───────────────────────

export function collectNodeIds(node: TreeNode, maxLevel = 1): Set<string> {
  const ids = new Set<string>();

  function walk(n: TreeNode) {
    if (n.level <= maxLevel) {
      ids.add(n.id);
    }
    n.children.forEach(walk);
  }
  walk(node);
  return ids;
}

export function collectAllNodeIds(node: TreeNode): Set<string> {
  const ids = new Set<string>();
  function walk(n: TreeNode) {
    ids.add(n.id);
    n.children.forEach(walk);
  }
  walk(node);
  return ids;
}

// ─── Get ancestor path for a node ID ─────────────────────────────────────────

export function getAncestorIds(nodeId: string): string[] {
  const parts = nodeId.split('/');
  const ancestors: string[] = [];
  let current = '';
  for (let i = 0; i < parts.length - 1; i++) {
    current = i === 0 ? parts[i] : `${current}/${parts[i]}`;
    ancestors.push(current);
  }
  return ancestors;
}

// ─── Find a node by ID ──────────────────────────────────────────────────────

export function findNodeById(root: TreeNode, id: string): TreeNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

// ─── Sample Data (used when no CSV URL is provided) ──────────────────────────

export const SAMPLE_CSV_DATA: CSVRow[] = [
  {
    No: '1',
    Bidang: 'Bidang Perlindungan dan Jaminan Sosial',
    'Program Kegiatan': 'Program Perlindungan Sosial',
    Kegiatan: 'Pengelolaan Data Fakir Miskin Cakupan Daerah Kab/Kota',
    'Sub Kegiatan': 'Pendataan Fakir Miskin Cakupan Daerah Kab/Kota',
    'Rincian Kegiatan': 'Verifikasi dan Validasi Data DTKS',
    'Deskripsi Rincian Kegiatan': 'Melakukan verifikasi dan validasi terhadap Data Terpadu Kesejahteraan Sosial (DTKS) untuk memastikan ketepatan sasaran program bantuan sosial.',
    Sasaran: '10.000 KPM',
    'Bentuk Sasaran': 'Keluarga Penerima Manfaat',
    'Daftar Penerima Manfaat': 'Masyarakat miskin dan rentan sesuai DTKS',
    'Pagu Anggaran': '150.000.000',
    'Capaian Realisasi Nominal': 'Rp 112.500.000',
    'Capaian Realisasi Persentase': '75',
    'Capaian Realisasi Fisik': 'Terverifikasi 7.500 KPM dari target 10.000 KPM',
    'Jadwal Pelaksanaan': 'Januari – Desember 2026',
    'Sumber Anggaran': 'APBD Kab. Gunungkidul',
  },
  {
    No: '2',
    Bidang: 'Bidang Perlindungan dan Jaminan Sosial',
    'Program Kegiatan': 'Program Perlindungan Sosial',
    Kegiatan: 'Pengelolaan Data Fakir Miskin Cakupan Daerah Kab/Kota',
    'Sub Kegiatan': 'Pendataan Fakir Miskin Cakupan Daerah Kab/Kota',
    'Rincian Kegiatan': 'Musyawarah Desa/Kelurahan (Muskel)',
    'Deskripsi Rincian Kegiatan': 'Fasilitasi musyawarah tingkat desa/kelurahan untuk pengusulan dan pemutakhiran data kemiskinan.',
    Sasaran: '144 Desa/Kelurahan',
    'Bentuk Sasaran': 'Desa/Kelurahan',
    'Daftar Penerima Manfaat': 'Perangkat desa dan masyarakat',
    'Pagu Anggaran': '85.000.000',
    'Capaian Realisasi Nominal': 'Rp 51.000.000',
    'Capaian Realisasi Persentase': '60',
    'Capaian Realisasi Fisik': 'Terlaksana di 86 dari 144 desa',
    'Jadwal Pelaksanaan': 'Maret – Juni 2026',
    'Sumber Anggaran': 'APBD Kab. Gunungkidul',
  },
  {
    No: '3',
    Bidang: 'Bidang Rehabilitasi Sosial',
    'Program Kegiatan': 'Program Rehabilitasi Sosial',
    Kegiatan: 'Rehabilitasi Sosial Dasar Penyandang Disabilitas Terlantar di Dalam Panti',
    'Sub Kegiatan': 'Penyediaan Permakanan',
    'Rincian Kegiatan': 'Penyediaan Makan dan Snack Harian Penerima Manfaat',
    'Deskripsi Rincian Kegiatan': 'Menyediakan kebutuhan pangan harian bagi penyandang disabilitas terlantar yang berada di dalam panti.',
    Sasaran: '50 Penerima Manfaat',
    'Bentuk Sasaran': 'Orang',
    'Daftar Penerima Manfaat': 'Penyandang disabilitas di dalam panti',
    'Pagu Anggaran': '300.000.000',
    'Capaian Realisasi Nominal': 'Rp 264.000.000',
    'Capaian Realisasi Persentase': '88',
    'Capaian Realisasi Fisik': 'Terlayani 50 PM selama 11 bulan',
    'Jadwal Pelaksanaan': 'Januari – Desember 2026',
    'Sumber Anggaran': 'APBD Kab. Gunungkidul',
  },
  {
    No: '4',
    Bidang: 'Bidang Pemberdayaan Sosial',
    'Program Kegiatan': 'Program Pemberdayaan Sosial',
    Kegiatan: 'Pengembangan Potensi Sumber Kesejahteraan Sosial Daerah Kab/Kota',
    'Sub Kegiatan': 'Peningkatan Kemampuan Potensi Pekerja Sosial Masyarakat Kab/Kota',
    'Rincian Kegiatan': 'Bimbingan Teknis bagi PSM',
    'Deskripsi Rincian Kegiatan': 'Pelatihan dan bimbingan teknis bagi Pekerja Sosial Masyarakat (PSM) untuk meningkatkan kapasitas layanan sosial.',
    Sasaran: '100 PSM',
    'Bentuk Sasaran': 'Orang',
    'Daftar Penerima Manfaat': 'Pekerja Sosial Masyarakat se-Kab. Gunungkidul',
    'Pagu Anggaran': '120.000.000',
    'Capaian Realisasi Nominal': 'Rp 66.000.000',
    'Capaian Realisasi Persentase': '55',
    'Capaian Realisasi Fisik': 'Terlaksana 2 dari 4 angkatan',
    'Jadwal Pelaksanaan': 'April – September 2026',
    'Sumber Anggaran': 'APBD Kab. Gunungkidul',
  },
];
