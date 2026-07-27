import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { getIsoWeekValue } from '../utils/week';

interface MiniCheckFilterContextValue {
  week: string;
  setWeek: (week: string) => void;
}

const MiniCheckFilterContext = createContext<MiniCheckFilterContextValue | null>(null);

export const MiniCheckFilterProvider = ({ children }: { children: ReactNode }) => {
  const [week, setWeek] = useState(getIsoWeekValue);
  const value = useMemo(() => ({ week, setWeek }), [week]);

  return (
    <MiniCheckFilterContext.Provider value={value}>
      {children}
    </MiniCheckFilterContext.Provider>
  );
};

export const useMiniCheckFilters = (): MiniCheckFilterContextValue => {
  const context = useContext(MiniCheckFilterContext);
  if (!context) {
    throw new Error('useMiniCheckFilters debe usarse dentro de MiniCheckFilterProvider.');
  }
  return context;
};
