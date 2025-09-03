import React, { createContext, useContext, useMemo, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const value = useMemo(() => ({
    token,
    setToken: (t) => {
      setToken(t);
      if (t) localStorage.setItem('token', t);
      else localStorage.removeItem('token');
    },
  }), [token]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export default AppContext;
