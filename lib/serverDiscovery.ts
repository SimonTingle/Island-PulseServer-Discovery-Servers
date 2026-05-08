import fs from "fs";
import path from "path";
import type { ServerEntry } from "./types";
import { pingServer, buildServerEntry } from "./minecraft";

// ─── Seed servers ────────────────────────────────────────────────────────────
// Guaranteed-known BentoBox / SkyBlock servers, always scanned on every refresh
const SEED_SERVERS: Array<{ hostname: string; port: number }> = [
  // Tier-1 Major Networks
  { hostname: "play.skyblock.net", port: 25565 },
  { hostname: "mc.hypixel.net", port: 25565 },
  { hostname: "play.mineplex.com", port: 25565 },
  { hostname: "us.mineplex.com", port: 25565 },
  { hostname: "skyblock.gg", port: 25565 },
  { hostname: "play.archonhq.net", port: 25565 },
  { hostname: "play.wynncraft.com", port: 25565 },
  { hostname: "play.manacube.com", port: 25565 },
  { hostname: "play.cubecraft.net", port: 25565 },
  { hostname: "play.galaxy.ovh", port: 25565 },

  // Community SkyBlock Networks
  { hostname: "skyblock.loohp.com", port: 25565 },
  { hostname: "play.skyblock.pro", port: 25565 },
  { hostname: "skyblock.games", port: 25565 },
  { hostname: "islands.gg", port: 25565 },
  { hostname: "play.islandpulse.io", port: 25565 },
  { hostname: "skyblock.world", port: 25565 },
  { hostname: "sb.craftserver.com", port: 25565 },
  { hostname: "skyblock.cc", port: 25565 },
  { hostname: "islands.net", port: 25565 },
  { hostname: "blockislands.com", port: 25565 },

  // Regional & Gamemode Variants
  { hostname: "eu.skyblock.net", port: 25565 },
  { hostname: "asia.skyblock.net", port: 25565 },
  { hostname: "skyblock-survival.com", port: 25565 },
  { hostname: "play.bentobox.net", port: 25565 },
  { hostname: "oneblock.games", port: 25565 },
  { hostname: "acidisland.net", port: 25565 },
  { hostname: "caveblock.games", port: 25565 },
  { hostname: "skygrid.net", port: 25565 },
  { hostname: "poseidon.games", port: 25565 },
  { hostname: "skyblock-economy.com", port: 25565 },
];

// ─── SkyBlock keywords used for filtering API results ─────────────────────
const SKYBLOCK_KEYWORDS = [
  "skyblock", "sky block", "sky-block",
  "oneblock", "one block", "one-block",
  "acidisland", "acid island",
  "caveblock", "cave block",
  "skygrid", "sky grid",
  "bentobox",
  "island",
  "poseidon",
  "boxed",
];

// ─── Discovered-server cache (24 h TTL) ───────────────────────────────────
const DISCOVERED_PATH = path.join(process.cwd(), "data", "discovered.json");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface DiscoveredCache {
  lastUpdated: string | null;
  servers: Array<{ hostname: string; port: number }>;
}

function readDiscoveredCache(): DiscoveredCache {
  try {
    return JSON.parse(fs.readFileSync(DISCOVERED_PATH, "utf-8"));
  } catch {
    return { lastUpdated: null, servers: [] };
  }
}

function writeDiscoveredCache(servers: Array<{ hostname: string; port: number }>): void {
  fs.writeFileSync(
    DISCOVERED_PATH,
    JSON.stringify({ lastUpdated: new Date().toISOString(), servers }, null, 2),
    "utf-8"
  );
}

function isCacheStale(cache: DiscoveredCache): boolean {
  if (!cache.lastUpdated) return true;
  return Date.now() - new Date(cache.lastUpdated).getTime() > CACHE_TTL_MS;
}

// ─── API Sources ──────────────────────────────────────────────────────────

interface McsrvstatResponse {
  ip?: string;
  port?: number;
  online?: boolean;
  motd?: { clean?: string; raw?: string };
  players?: { online?: number; max?: number };
  version?: string;
}

// Query mcsrvstat.us — individual server ping via their REST API (cross-check)
async function pingViaMcsrvstat(hostname: string, port = 25565): Promise<McsrvstatResponse | null> {
  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${hostname}:${port}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return (await res.json()) as McsrvstatResponse;
  } catch {
    return null;
  }
}

interface McStatusEntry { ip: string; port?: number; name?: string; motd?: string }

// Query minecraft-server-list.com top SkyBlock servers (paginated JSON)
async function fetchFromMinecraftServerList(): Promise<Array<{ hostname: string; port: number }>> {
  const results: Array<{ hostname: string; port: number }> = [];
  try {
    // Top 100 servers tagged with "skyblock" — page 1 & 2
    for (const page of [1, 2]) {
      const res = await fetch(
        `https://minecraft-server-list.com/tag/skyblock/${page}/ajax/`,
        {
          headers: { "User-Agent": "IslandPulse-Discovery/1.0" },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!res.ok) break;
      const data = await res.json() as { servers?: McStatusEntry[] };
      if (!Array.isArray(data.servers)) break;
      for (const s of data.servers) {
        if (s.ip) results.push({ hostname: s.ip, port: s.port ?? 25565 });
      }
    }
  } catch { /* silent fallback */ }
  return results;
}

interface MinecraftMpEntry { ip: string; port?: number; gametype?: string }

// Query minecraft-mp.com — SkyBlock category
async function fetchFromMinecraftMp(): Promise<Array<{ hostname: string; port: number }>> {
  const results: Array<{ hostname: string; port: number }> = [];
  try {
    const res = await fetch(
      "https://minecraft-mp.com/api/?object=servers&element=servers&format=json&type=skyblock&limit=100",
      {
        headers: { "User-Agent": "IslandPulse-Discovery/1.0" },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return [];
    const data = await res.json() as { servers?: MinecraftMpEntry[] };
    if (!Array.isArray(data.servers)) return [];
    for (const s of data.servers) {
      if (s.ip) results.push({ hostname: s.ip, port: s.port ?? 25565 });
    }
  } catch { /* silent fallback */ }
  return results;
}

interface TopMcEntry { ip: string; port?: number }

// Query topminecraftservers.com
async function fetchFromTopMcServers(): Promise<Array<{ hostname: string; port: number }>> {
  const results: Array<{ hostname: string; port: number }> = [];
  try {
    const res = await fetch(
      "https://topminecraftservers.com/api/skyblock",
      {
        headers: { "User-Agent": "IslandPulse-Discovery/1.0" },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return [];
    const data = await res.json() as { data?: TopMcEntry[] } | TopMcEntry[];
    const list = Array.isArray(data) ? data : (data as { data?: TopMcEntry[] }).data ?? [];
    for (const s of list) {
      if (s.ip) results.push({ hostname: s.ip, port: s.port ?? 25565 });
    }
  } catch { /* silent fallback */ }
  return results;
}

interface BestMcEntry { ip?: string; host?: string; port?: number; tags?: string[] }

// Query bestminecraftservers.org
async function fetchFromBestMcServers(): Promise<Array<{ hostname: string; port: number }>> {
  const results: Array<{ hostname: string; port: number }> = [];
  try {
    const res = await fetch(
      "https://bestminecraftservers.org/api/servers?tag=skyblock&limit=100",
      {
        headers: { "User-Agent": "IslandPulse-Discovery/1.0" },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return [];
    const data = await res.json() as BestMcEntry[] | { servers?: BestMcEntry[] };
    const list = Array.isArray(data) ? data : (data as { servers?: BestMcEntry[] }).servers ?? [];
    for (const s of list) {
      const host = s.ip ?? s.host;
      if (host) results.push({ hostname: host, port: s.port ?? 25565 });
    }
  } catch { /* silent fallback */ }
  return results;
}

// ─── Aggregate all API sources ────────────────────────────────────────────

export async function fetchFromAllAPIs(): Promise<Array<{ hostname: string; port: number }>> {
  const [a, b, c, d] = await Promise.allSettled([
    fetchFromMinecraftServerList(),
    fetchFromMinecraftMp(),
    fetchFromTopMcServers(),
    fetchFromBestMcServers(),
  ]);

  const all = [
    ...(a.status === "fulfilled" ? a.value : []),
    ...(b.status === "fulfilled" ? b.value : []),
    ...(c.status === "fulfilled" ? c.value : []),
    ...(d.status === "fulfilled" ? d.value : []),
  ];

  // Deduplicate
  return Array.from(
    new Map(all.map((s) => [`${s.hostname}:${s.port}`, s])).values()
  );
}

// ─── Load discovered servers (from cache or live APIs) ────────────────────

export async function loadDiscoveredServers(): Promise<Array<{ hostname: string; port: number }>> {
  const cache = readDiscoveredCache();
  if (!isCacheStale(cache) && cache.servers.length > 0) {
    return cache.servers;
  }
  // Cache is stale — re-query APIs
  const fresh = await fetchFromAllAPIs();
  if (fresh.length > 0) writeDiscoveredCache(fresh);
  return fresh;
}

// ─── Concurrency-limited pinger ──────────────────────────────────────────

async function pingWithConcurrency(
  servers: Array<{ hostname: string; port: number }>,
  concurrency = 10
): Promise<ServerEntry[]> {
  const results: ServerEntry[] = [];
  for (let i = 0; i < servers.length; i += concurrency) {
    const batch = servers.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async ({ hostname, port }) => {
        const ping = await pingServer(hostname, port);
        return buildServerEntry(hostname, port, ping);
      })
    );
    for (const r of batchResults) {
      if (r.status === "fulfilled") results.push(r.value);
    }
  }
  return results;
}

// ─── SkyBlock filter ──────────────────────────────────────────────────────

function isSkyBlockServer(server: ServerEntry): boolean {
  if (server.gamemode !== null) return true;
  const text = `${server.motd} ${server.hostname} ${server.name}`.toLowerCase();
  return SKYBLOCK_KEYWORDS.some((kw) => text.includes(kw));
}

// ─── Main entry point ────────────────────────────────────────────────────

export async function discoverServers(): Promise<ServerEntry[]> {
  // Load API-discovered servers (from 24h cache or fresh query)
  const apiDiscovered = await loadDiscoveredServers();

  // Merge seeds + API-discovered, deduplicate
  const all = Array.from(
    new Map(
      [...SEED_SERVERS, ...apiDiscovered].map((s) => [`${s.hostname}:${s.port}`, s])
    ).values()
  );

  // Ping all with higher concurrency now
  const pinged = await pingWithConcurrency(all, 10);

  // Return only servers matching SkyBlock keywords
  return pinged.filter(isSkyBlockServer);
}

// Export for use in the API refresh route (so it can report discovery stats)
export { pingViaMcsrvstat };
