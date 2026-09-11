import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import "./design-tokens.css";
import "./globals.css";
import Header from "./components/Header";
import { AuthProvider } from "./components/AuthProvider";

export const metadata: Metadata = {
  title: "VoteFlow",
  description: "VoteFlow frontend",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-[var(--font-inter)] text-slate-100 antialiased">
        <AuthProvider>
          <Header />
          <main className="app-main vf-container" style={{ paddingTop: 84 }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
