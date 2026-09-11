import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const PaywallContext = createContext(null);

export function PaywallProvider({ children }) {
  const [visible, setVisible] = useState(false);

  const value = useMemo(
    () => ({
      visible,
      show: () => setVisible(true),
      hide: () => setVisible(false),
    }),
    [visible]
  );

  return <PaywallContext.Provider value={value}>{children}</PaywallContext.Provider>;
}

export function usePaywall() {
  const ctx = useContext(PaywallContext);
  if (!ctx) throw new Error('usePaywall must be used within PaywallProvider');
  return ctx;
}
