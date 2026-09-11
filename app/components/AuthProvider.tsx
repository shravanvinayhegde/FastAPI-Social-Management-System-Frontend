"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CurrentUser, getMe, getToken } from "../../lib/api";

type AuthContextValue = {
  currentUser: CurrentUser | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ currentUser: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    void getMe()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  return <AuthContext.Provider value={{ currentUser, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
