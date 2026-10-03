import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import "./design-tokens.css";
import "./globals.css";
import "./vf-fixes.css"; // must stay LAST so it wins the cascade
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import { AuthProvider } from "./components/AuthProvider";

export const metadata: Metadata = {
  title: { default: "VoteFlow – communities, posts & votes", template: "%s · VoteFlow" },
  description: "Join communities, share posts and vote on what matters.",
  applicationName: "VoteFlow",
  openGraph: { title: "VoteFlow", description: "Join communities, share posts and vote on what matters.", siteName: "VoteFlow", type: "website" },
};

// viewport-fit=cover is required for env(safe-area-inset-*) to work on notched iPhones
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
    { media: "(prefers-color-scheme: light)", color: "#f0f4fc" },
  ],
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap", weight: ["600", "700"] });

// Runs before first paint -> no dark->light flash for light-theme users.
const themeInit = `try{var t=localStorage.getItem("vf-theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="font-[var(--font-inter)] antialiased">
        <a href="#main" className="vfx-skip">Skip to content</a>
        <AuthProvider>
          <Header />
          {/* The ONLY <main> in the app. Pages must render <div>/<section>, not <main>. */}
          <main id="main" className="vfx-main">{children}</main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
