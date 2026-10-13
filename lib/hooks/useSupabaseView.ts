'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const CHANNEL_NAME = 'perlinsos-data-changed';

/**
 * Tell every open tab/page using `useSupabaseView` to refetch.
 * Call this after any successful insert/update/upsert/delete.
 */
export function notifyPerlinsosDataChanged() {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ at: Date.now() });
  channel.close();
}

interface OrderBy {
  column: string;
  ascending?: boolean;
}

interface UseSupabaseViewOptions {
  /** Columns to order by, applied in sequence. */
  orderBy?: OrderBy[];
  /** Base tables whose changes should trigger a refetch via Supabase Realtime. */
  realtimeTables?: string[];
}

export function useSupabaseView<T>(view: string, options: UseSupabaseViewOptions = {}) {
  const { orderBy = [], realtimeTables = [] } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Incremented on every request so late responses from older requests are ignored.
  const requestIdRef = useRef(0);
  const orderKey = JSON.stringify(orderBy);
  const tablesKey = realtimeTables.join(',');

  const refetch = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const supabase = createClient();
    setLoading(true);

    try {
      let query = supabase.from(view).select('*');
      for (const o of JSON.parse(orderKey) as OrderBy[]) {
        query = query.order(o.column, { ascending: o.ascending ?? true });
      }
      const { data: result, error: fetchError } = await query;
      if (requestId !== requestIdRef.current) return; // a newer request superseded this one
      if (fetchError) throw fetchError;

      setData((result as T[]) ?? []);
      setError(null);
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      setError(err?.message || 'Terjadi kesalahan saat mengambil data');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [view, orderKey]);

  // Initial fetch on mount (and whenever the view/order changes).
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Refetch when the tab regains focus or another tab signals a change.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = () => refetch();
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      channel?.close();
    };
  }, [refetch]);

  // Supabase Realtime (only fires if Realtime is enabled for the table).
  // Debounced because a CSV upsert emits one event per row.
  useEffect(() => {
    if (!tablesKey) return;
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => refetch(), 600);
    };

    const channel = supabase.channel(`live-${view}-${tablesKey}`);
    for (const table of tablesKey.split(',')) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, schedule);
    }
    channel.subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [view, tablesKey, refetch]);

  return { data, setData, loading, error, refetch };
}
