export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import PublicPerlinsosClient from './_components/PublicPerlinsosClient';

export default function PublicPerlinsosPortalPage() {
  return <PublicPerlinsosClient />;
}
