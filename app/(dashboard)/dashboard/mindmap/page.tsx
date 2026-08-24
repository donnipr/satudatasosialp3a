import type { Metadata } from 'next';
import MindMapClient from './_components/MindMapClient';

export const metadata: Metadata = {
  title: 'Mind Map Program Kegiatan | Satu Data Dinsos P3A',
  description:
    'Visualisasi interaktif program kegiatan Dinas Sosial P3A Kabupaten Gunungkidul dalam bentuk Mind Map / Tree Diagram.',
};

export default function MindMapPage() {
  return <MindMapClient />;
}
