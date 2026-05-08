import type { ServerEntry } from "./types";
import { pingServer, buildServerEntry, detectGamemode } from "./minecraft";

// Known BentoBox/SkyBlock servers to seed the list
// These are well-known public servers; refresh will augment with API data
const SEED_SERVERS: Array<{ hostname: string; port: number }> = [
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
];

interface McStatusServer {
  host: string;
  port?: number;
  players?: { online: number; max: number };
  version?: { name: string };
  motd?: string;
}

async function fetchFromMcStatusIO(): Promise<Array<{ hostname: string; port: number }>> {
  try {
    // mcstatus.io doesn't have a public server-list endpoint,
    // but we can ping individual known servers through it as a proxy
    // For discovery, we fall back to our seed list + any public APIs
    return [];
  } catch {
    return [];
  }
}

async function fetchFromServerList(): Promise<Array<{ hostname: string; port: number }>> {
  try {
    // Minecraft-servers.biz and similar sites have JSON endpoints
    // Using a community-maintained list approach
    const res = await fetch(
      "https://api.mcsrvstat.us/2/list?gamemode=skyblock",
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { servers?: McStatusServer[] };
    if (!Array.isArray(data.servers)) return [];
    return data.servers.map((s: McStatusServer) => ({
      hostname: s.host,
      port: s.port ?? 25565,
    }));
  } catch {
    return [];
  }
}

async function pingWithConcurrency(
  servers: Array<{ hostname: string; port: number }>,
  concurrency = 5
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

function filterSkyBlockServers(servers: ServerEntry[]): ServerEntry[] {
  return servers.filter((s) => {
    if (s.gamemode !== null) return true;
    const text = (s.motd + " " + s.hostname).toLowerCase();
    return (
      text.includes("skyblock") ||
      text.includes("sky block") ||
      text.includes("oneblock") ||
      text.includes("bentobox") ||
      text.includes("island")
    );
  });
}

export async function discoverServers(): Promise<ServerEntry[]> {
  const [apiServers] = await Promise.allSettled([
    fetchFromServerList(),
  ]);

  const discovered: Array<{ hostname: string; port: number }> = [
    ...SEED_SERVERS,
    ...(apiServers.status === "fulfilled" ? apiServers.value : []),
  ];

  // Deduplicate by hostname:port
  const unique = Array.from(
    new Map(discovered.map((s) => [`${s.hostname}:${s.port}`, s])).values()
  );

  const pinged = await pingWithConcurrency(unique, 5);
  return filterSkyBlockServers(pinged);
}
