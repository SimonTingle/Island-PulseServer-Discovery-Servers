import { notFound } from "next/navigation";
import Link from "next/link";
import { readCache } from "@/lib/storage";
import { pingServer } from "@/lib/minecraft";
import IslandPulseBadge from "@/components/IslandPulseBadge";
import CopyButton from "@/components/CopyButton";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return n.toLocaleString();
}

function StatusDot({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${
        online ? "bg-emerald-500" : "bg-red-500"
      }`}
    />
  );
}

function MetricCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-100">{value}</p>
    </div>
  );
}

export default async function ServerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cache = readCache();
  const server = cache.servers.find((s) => s.id === id);

  if (!server) notFound();

  // Live ping happens here (server component — no client needed)
  const live = await pingServer(server.hostname, server.port);

  const playersOnline = live.online ? live.playersOnline : server.playersOnline;
  const maxPlayers = live.online ? live.maxPlayers : server.maxPlayers;
  const version = live.online ? live.version : server.version;
  const motd = live.online && live.motd ? live.motd : server.motd;
  const ping = live.ping;
  const isOnline = live.online;

  const address = `${server.hostname}:${server.port}`;

  return (
    <div>
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-cyan-400 transition-colors mb-6"
      >
        ← Back to server list
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <StatusDot online={isOnline} />
            <h1 className="text-2xl font-bold text-slate-100">{server.name}</h1>
            <IslandPulseBadge tier={server.islandPulseStatus} />
            {server.gamemode && (
              <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider">
                {server.gamemode}
              </span>
            )}
          </div>
          {motd && (
            <p className="text-slate-400 mt-2 max-w-xl">{motd}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono bg-slate-800 border border-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg">
            {address}
          </code>
          <CopyButton text={address} />
        </div>
      </div>

      {/* Core metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard
          label="Players Online"
          value={
            <span>
              {playersOnline}{" "}
              <span className="text-slate-500 text-sm font-normal">/ {maxPlayers}</span>
            </span>
          }
        />
        <MetricCard
          label="Status"
          value={
            <span className={isOnline ? "text-emerald-400" : "text-red-400"}>
              {isOnline ? "Online" : "Offline"}
            </span>
          }
        />
        <MetricCard label="Version" value={<span className="text-base">{version}</span>} />
        <MetricCard
          label="Ping"
          value={
            ping !== null ? (
              <span>
                {ping}
                <span className="text-slate-500 text-sm font-normal">ms</span>
              </span>
            ) : (
              <span className="text-slate-500">—</span>
            )
          }
        />
        <MetricCard
          label="Capacity"
          value={
            maxPlayers > 0 ? (
              <span>{Math.round((playersOnline / maxPlayers) * 100)}%</span>
            ) : (
              <span className="text-slate-500">—</span>
            )
          }
        />
      </div>

      {/* IslandPulse section */}
      {server.islandPulseData ? (
        <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/10 p-6 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-lg">📊</span>
            <h2 className="text-lg font-bold text-cyan-300">IslandPulse Economy Data</h2>
            <IslandPulseBadge tier={server.islandPulseStatus} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Total Islands</p>
              <p className="text-2xl font-bold text-slate-100">
                {fmt(server.islandPulseData.totalIslands)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Avg Net Worth</p>
              <p className="text-2xl font-bold text-slate-100">
                {server.islandPulseData.avgNetWorth > 0
                  ? `$${fmt(server.islandPulseData.avgNetWorth)}`
                  : "—"}
              </p>
            </div>
            {server.islandPulseData.totalPlayers !== null && (
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Total Players</p>
                <p className="text-2xl font-bold text-slate-100">
                  {fmt(server.islandPulseData.totalPlayers)}
                </p>
              </div>
            )}
          </div>

          {server.islandPulseData.top3Islands.length > 0 && (
            <div>
              <h3 className="text-sm uppercase tracking-widest text-slate-500 mb-3">
                Top Islands by Growth
              </h3>
              <div className="space-y-2">
                {server.islandPulseData.top3Islands.map((island, i) => (
                  <div
                    key={island.islandUuid}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-500">#{i + 1}</span>
                      <Link
                        href={`${process.env.NEXT_PUBLIC_ISLANDPULSE_URL ?? "http://localhost:3001"}/island/${island.islandUuid}`}
                        className="text-sm font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                        target="_blank"
                      >
                        {island.islandUuid.slice(0, 8)}…
                      </Link>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-400">${fmt(island.netWorth)}</span>
                      <span
                        className={
                          island.growth24hPercent >= 0
                            ? "text-emerald-400 font-semibold"
                            : "text-red-400 font-semibold"
                        }
                      >
                        {island.growth24hPercent >= 0 ? "+" : ""}
                        {island.growth24hPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-6 mb-8 text-center">
          <p className="text-slate-500 text-sm">
            This server hasn&apos;t connected to IslandPulse yet.{" "}
            <a
              href="https://islandpulse.io"
              className="text-cyan-500 hover:text-cyan-400 transition-colors"
            >
              Learn how to add economy tracking →
            </a>
          </p>
        </div>
      )}

      {/* Meta */}
      <div className="text-xs text-slate-600 space-y-1">
        {server.lastSeen && (
          <p>Last seen online: {new Date(server.lastSeen).toLocaleString()}</p>
        )}
        <p>Cache fetched: {new Date(server.fetchedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}
