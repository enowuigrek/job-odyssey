import { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Stan zwinięcia sidebara (w-64 <-> w-16) — musi być widoczny poza Sidebar.tsx,
 * bo strony z fixed-position paskami (np. dolny pasek w CVEditorPage) muszą
 * dopasować swój `left` offset do aktualnej szerokości sidebara.
 */
interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
