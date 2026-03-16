import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useStore } from './useStore';
import type { StoreType } from './useStore';

const StoreContext = createContext<StoreType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useAppStore(): StoreType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useAppStore must be used inside StoreProvider');
  return ctx;
}
