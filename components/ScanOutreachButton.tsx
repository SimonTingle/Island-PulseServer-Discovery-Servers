"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  serverId: string;
  lastScanned: string | null;
}

export default function ScanOutreachButton({ serverId, lastScanned }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isStale =
    !lastScanned ||
    Date.now() - new Date(lastScanned).getTime() > 7 * 24 * 60 * 60 * 1000;
  const buttonLabel = isStale ? "Scan Now" : "Re-Scan";

  async function handleScan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/server/${serverId}/scan-outreach`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        setError(data.error ?? "Scan failed");
      }
    } catch {
      setError("Network error during scan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleScan}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-slate-200 text-sm font-semibold px-4 py-2 transition-colors"
      >
        {loading ? (
          <>
            <span className="animate-spin inline-block">⟳</span>
            Scanning…
          </>
        ) : (
          buttonLabel
        )}
      </button>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </div>
  );
}
