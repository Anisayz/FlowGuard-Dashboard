import { createContext, useContext, type ReactNode } from 'react';
import { useAppData } from '../hooks/useAppData';

type DashboardData = ReturnType<typeof useAppData>;

const DashboardDataContext = createContext<DashboardData | null>(null);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const value = useAppData();
  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData(): DashboardData {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) {
    throw new Error('useDashboardData must be used inside DashboardDataProvider');
  }
  return ctx;
}
