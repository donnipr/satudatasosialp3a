export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import RekapPendaftaranClient from './_components/RekapPendaftaranClient';

export default function RekapPendaftaranPage() {
  return <RekapPendaftaranClient />;
}
