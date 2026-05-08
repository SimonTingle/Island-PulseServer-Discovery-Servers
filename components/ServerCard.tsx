import Link from "next/link";
import type { ServerEntry } from "@/lib/types";
import IslandPulseBadge from "./IslandPulseBadge";

function PlayerBar({ online, max }: { online: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (online / max) * 100) : 0;
  const color = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-400 tabular-nums">
        {online}/{max}
      </span>
    </div>
  );
}

export default function ServerCard({ server }: { server: ServerEntry }) {
  const gamemodePill = server.gamemode ? (
    <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider">
      {server.gamemode}
    </span>
  ) : null;

  return (
    <Link
      href={`/server/${server.id}`}
      className="block rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-cyan-800 hover:bg-slate-900 transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                server.online ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <span className="font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors truncate">
              {server.name}
            </span>
            <IslandPulseBadge tier={server.islandPulseStatus} />
          </div>
          <p className="text-xs font-mono text-slate-500 mt-0.5 truncate">
            {server.hostname}:{server.port}
          </p>
        </div>
        {server.ping !== null && (
          <span className="text-xs text-slate-500 flex-shrink-0">
            {server.ping}ms
          </span>
        )}
      </div>

      {server.motd && (
        <p className="text-sm text-slate-400 mb-3 line-clamp-2 leading-relaxed">
          {server.motd}
        </p>
      )}

      <PlayerBar online={server.playersOnline} max={server.maxPlayers} />

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {gamemodePill}
        <span className="text-xs text-slate-600">{server.version}</span>
        {server.islandPulseData && (
          <span className="text-xs text-cyan-600">
            {server.islandPulseData.totalIslands} islands
          </span>
        )}
      </div>
    </Link>
  );
}
