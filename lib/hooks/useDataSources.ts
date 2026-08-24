'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export type DataSource = {
  id: string;
  tahun: string;
  url_csv: string;
  is_default: boolean;
  created_at: string;
};

export function useDataSources() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchSources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('data_sources')
        .select('*')
        .order('tahun', { ascending: false });

      if (fetchError) throw fetchError;
      setSources(data || []);
    } catch (err: any) {
      console.error('Failed to fetch data sources:', err);
      setError(err.message || 'Gagal memuat data pengaturan.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const addSource = async (tahun: string, url_csv: string) => {
    try {
      const { error: insertError } = await supabase
        .from('data_sources')
        .insert([{ tahun, url_csv }]);
      if (insertError) throw insertError;
      await fetchSources();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteSource = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('data_sources')
        .delete()
        .eq('id', id);
      if (deleteError) throw deleteError;
      await fetchSources();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const setDefaultSource = async (id: string) => {
    try {
      // First, set all to false
      const { error: updateError1 } = await supabase
        .from('data_sources')
        .update({ is_default: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // hack to update all rows
        
      if (updateError1) throw updateError1;

      // Then set the target to true
      const { error: updateError2 } = await supabase
        .from('data_sources')
        .update({ is_default: true })
        .eq('id', id);

      if (updateError2) throw updateError2;
      
      await fetchSources();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    sources,
    isLoading,
    error,
    fetchSources,
    addSource,
    deleteSource,
    setDefaultSource
  };
}
