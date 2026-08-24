'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDataSources, type DataSource } from '@/lib/hooks/useDataSources';

type DataSourceContextType = {
  activeSource: DataSource | null;
  setActiveSource: (source: DataSource) => void;
  availableSources: DataSource[];
  isLoading: boolean;
};

const DataSourceContext = createContext<DataSourceContextType | undefined>(undefined);

export function DataSourceProvider({ children }: { children: React.ReactNode }) {
  const { sources, isLoading } = useDataSources();
  const [activeSource, setActiveSource] = useState<DataSource | null>(null);

  useEffect(() => {
    if (sources.length > 0 && !activeSource) {
      const defaultSource = sources.find((s) => s.is_default) || sources[0];
      setActiveSource(defaultSource);
    }
  }, [sources, activeSource]);

  // If sources list updates and the activeSource was deleted, reset
  useEffect(() => {
    if (activeSource && sources.length > 0) {
        const stillExists = sources.find(s => s.id === activeSource.id);
        if (!stillExists) {
            const defaultSource = sources.find((s) => s.is_default) || sources[0];
            setActiveSource(defaultSource);
        }
    }
  }, [sources, activeSource]);

  return (
    <DataSourceContext.Provider
      value={{
        activeSource,
        setActiveSource,
        availableSources: sources,
        isLoading,
      }}
    >
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSourceContext() {
  const context = useContext(DataSourceContext);
  if (context === undefined) {
    throw new Error('useDataSourceContext must be used within a DataSourceProvider');
  }
  return context;
}
