import { readCache } from "@/lib/storage";
import ServerList from "@/components/ServerList";
import RefreshButton from "@/components/RefreshButton";
import ScanAllOutreachButton from "@/components/ScanAllOutreachButton";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function HomePage() {
  const cache = readCache();

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          SkyBlock Server Discovery
        </h1>
        <p className="text-slate-400 max-w-xl">
          Browse and analyze BentoBox SkyBlock servers. Servers using{" "}
          <span className="text-cyan-400 font-semibold">IslandPulse</span> show
          full economy metrics.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 p-4 rounded-xl border border-slate-800 bg-slate-900/30">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-slate-400">
            <span className="text-slate-100 font-semibold">{cache.servers.length}</span>{" "}
            servers cached
          </span>
          <span className="text-slate-400">
            <span className="text-slate-100 font-semibold">
              {cache.servers.filter((s) => s.islandPulseStatus).length}
            </span>{" "}
            using IslandPulse
          </span>
          <span className="text-slate-400">
            <span className="text-slate-100 font-semibold">
              {cache.servers.filter((s) => s.online).length}
            </span>{" "}
            online now
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-600">
            Updated: {formatDate(cache.lastUpdated)}
          </span>
          <RefreshButton />
          <ScanAllOutreachButton serverCount={cache.servers.length} />
        </div>
      </div>

      {/* Server list */}
      <ServerList servers={cache.servers} />
    </div>
  );
}
