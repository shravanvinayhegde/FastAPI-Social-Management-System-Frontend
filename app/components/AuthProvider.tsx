"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CurrentUser, getCurrentUserId, getToken, getUser } from "../../lib/api";

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
    const id = getCurrentUserId();
    if (!token || !id) {
      setLoading(false);
      return;
    }

    void getUser(id)
      .then((user) => {
        if (user.username) {
          setCurrentUser({
            id: user.id,
            username: user.username,
            display_name: user.display_name || user.username,
            email: user.email,
            avatar_url: user.avatar_url,
          });
        }
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  return <AuthContext.Provider value={{ currentUser, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
