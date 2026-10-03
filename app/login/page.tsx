"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";
import { getToken, login } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (getToken()) {
      router.replace("/");
      return;
    }

    setIsCheckingAuth(false);
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      router.push("/");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unexpected error during login.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) return null;

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center py-4">
      <div className="w-full max-w-md">
        <div className="vf-card p-5 sm:p-8">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-slate-300 mt-1">Sign in to continue to VoteFlow</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit} aria-label="Sign in form">
            <label className="block text-sm">
              <div className="text-sm text-slate-300">Email</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false}
                required
                className="vf-input mt-1"
              />
            </label>
            <label className="block text-sm">
              <div className="text-sm text-slate-300">Password</div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password" autoComplete="current-password"
                required
                className="vf-input mt-1"
              />
            </label>

            {error ? <p className="text-rose-300 text-sm">{error}</p> : null}

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isLoading}
                className="vf-btn-primary px-4 py-2 text-sm disabled:opacity-60 focus-visible"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
              <Link href="/register" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[hsl(var(--accent))]">
                Create account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
