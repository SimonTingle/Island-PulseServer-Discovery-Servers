"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  serverCount: number;
}

export default function ScanAllOutreachButton({ serverCount }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ succeeded: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleScan() {
    setLoading(true);
    setError(null);
    setResult(null);
    const start = Date.now();
    try {
      const res = await fetch("/api/servers/scan-outreach?force=true", { method: "POST" });
      const data = await res.json();
      const duration = ((Date.now() - start) / 1000).toFixed(1);
      if (data.success) {
        setResult({ succeeded: data.succeeded, failed: data.failed });
        setTimeout(() => router.refresh(), 500);
      } else {
        setError(data.error ?? "Scan failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleScan}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:bg-cyan-800 disabled:cursor-not-allowed text-slate-100 text-sm font-semibold px-4 py-2 transition-colors"
      >
        {loading ? (
          <>
            <span className="animate-spin inline-block">⟳</span>
            Scanning {serverCount} servers…
          </>
        ) : result ? (
          <>
            ✓ Scanned {result.succeeded}
            {result.failed > 0 && ` (${result.failed} errors)`}
          </>
        ) : (
          <>⚡ Scan All Outreach</>
        )}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
