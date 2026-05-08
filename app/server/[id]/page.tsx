import { notFound } from "next/navigation";
import Link from "next/link";
import { readCache } from "@/lib/storage";
import { pingServer } from "@/lib/minecraft";
import IslandPulseBadge from "@/components/IslandPulseBadge";
import CopyButton from "@/components/CopyButton";
import ScanOutreachButton from "@/components/ScanOutreachButton";
import type { HeatScore, ContactChannel, ForumMention } from "@/lib/types";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return n.toLocaleString();
}

function HeatBadge({ heat }: { heat: HeatScore }) {
  const colors: Record<string, string> = {
    Hot: "bg-orange-900/60 text-orange-300 border-orange-700",
    Warm: "bg-yellow-900/60 text-yellow-300 border-yellow-700",
    Cold: "bg-sky-900/60 text-sky-300 border-sky-700",
    Frozen: "bg-slate-800 text-slate-400 border-slate-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold uppercase tracking-widest border ${colors[heat.label]}`}>
      {heat.label} {heat.score}
    </span>
  );
}

function ContactPill({ contact }: { contact: ContactChannel }) {
  const labels: Record<string, string> = {
    discord: "Discord",
    website: "Website",
    email: "Email",
    twitter: "Twitter/X",
    youtube: "YouTube",
    other: "Link",
  };
  return (
    <a
      href={contact.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-700 px-3 py-1.5 rounded-lg transition-colors"
    >
      {labels[contact.kind] ?? contact.kind}
    </a>
  );
}

function MentionRow({ mention }: { mention: ForumMention }) {
  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800">
      <div className="flex-1 min-w-0">
        <a
          href={mention.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors line-clamp-1"
        >
          {mention.title}
        </a>
        {mention.snippet && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{mention.snippet}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 text-xs text-slate-600">
        <span>{mention.platform}</span>
        <span className="uppercase">{mention.language}</span>
        {mention.date && <span>{new Date(mention.date).toLocaleDateString()}</span>}
      </div>
    </div>
  );
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

      {/* Outreach Intelligence */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-100">Outreach Intelligence</h2>
            {server.outreach && <HeatBadge heat={server.outreach.heat} />}
          </div>
          <ScanOutreachButton serverId={server.id} lastScanned={server.outreach?.scannedAt ?? null} />
        </div>

        {server.outreach ? (
          <>
            {server.outreach.contacts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-3">Contact Channels</h3>
                <div className="flex flex-wrap gap-2">
                  {server.outreach.contacts.map((c) => (
                    <ContactPill key={c.url} contact={c} />
                  ))}
                </div>
              </div>
            )}

            {server.outreach.mentions.length > 0 ? (
              <div>
                <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-3">
                  Forum Mentions — where to advertise ({server.outreach.mentions.length})
                </h3>
                <div className="space-y-2">
                  {server.outreach.mentions.slice(0, 10).map((m) => (
                    <MentionRow key={m.url} mention={m} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No forum mentions found.</p>
            )}

            <p className="text-xs text-slate-600 mt-4">
              Last scanned: {new Date(server.outreach.scannedAt).toLocaleString()}
              {server.outreach.heat.lastMentionDate && (
                <> · Last mention: {new Date(server.outreach.heat.lastMentionDate).toLocaleDateString()}</>
              )}
            </p>
          </>
        ) : (
          <p className="text-slate-500 text-sm">
            No outreach data yet. Click &quot;Scan Now&quot; to discover contact channels and web mentions for this server.
          </p>
        )}
      </div>

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
