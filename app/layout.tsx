import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "IslandPulse — Server Discovery",
  description: "Find and analyze BentoBox SkyBlock servers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-200">
        <header className="border-b border-slate-800 px-6 py-4">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏝️</span>
              <div>
                <span className="text-lg font-bold tracking-tight text-cyan-400">
                  IslandPulse
                </span>
                <span className="ml-2 text-sm text-slate-400 uppercase tracking-widest">
                  Server Discovery
                </span>
              </div>
            </div>
            <nav className="flex items-center gap-4 text-sm text-slate-400">
              <Link
                href="/"
                className="hover:text-cyan-400 transition-colors"
              >
                Servers
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        <footer className="border-t border-slate-800 mt-16 px-6 py-6 text-center text-xs text-slate-600">
          IslandPulse Server Discovery — Powered by mcstatus &amp; BentoBox
        </footer>
      </body>
    </html>
  );
}
