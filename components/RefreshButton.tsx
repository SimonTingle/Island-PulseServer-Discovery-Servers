"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleRefresh() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/servers/refresh", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResult(`Found ${data.serverCount} servers in ${(data.duration / 1000).toFixed(1)}s`);
        router.refresh();
      } else {
        setResult("Refresh failed — check console");
      }
    } catch {
      setResult("Network error during refresh");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 transition-colors"
      >
        {loading ? (
          <>
            <span className="animate-spin">⟳</span>
            Scanning servers…
          </>
        ) : (
          <>⟳ Refresh All Servers</>
        )}
      </button>
      {result && (
        <span className="text-sm text-slate-400">{result}</span>
      )}
    </div>
  );
}
