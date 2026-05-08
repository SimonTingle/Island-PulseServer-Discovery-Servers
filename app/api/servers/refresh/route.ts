import { NextResponse } from "next/server";
import { readCache, writeCache, mergeServers } from "@/lib/storage";
import { discoverServers, loadDiscoveredServers } from "@/lib/serverDiscovery";
import { fetchRegisteredServers } from "@/lib/islandpulseClient";
import type { ServerEntry } from "@/lib/types";

export async function POST() {
  const start = Date.now();

  // Pre-fetch API-discovered list to report its size in the response
  const apiDiscovered = await loadDiscoveredServers();

  // Discover public SkyBlock servers + fetch IslandPulse registered servers in parallel
  const [discovered, registered] = await Promise.allSettled([
    discoverServers(),
    fetchRegisteredServers(),
  ]);

  const servers: ServerEntry[] = discovered.status === "fulfilled" ? discovered.value : [];

  // Merge IslandPulse data into matching servers by hostname
  if (registered.status === "fulfilled") {
    for (const reg of registered.value) {
      // Match by server name (best-effort; name matching is fuzzy)
      const match = servers.find(
        (s) =>
          s.name.toLowerCase().includes(reg.name.toLowerCase()) ||
          reg.name.toLowerCase().includes(s.hostname.toLowerCase())
      );
      if (match) {
        match.islandPulseStatus = reg.islandPulseData.tier;
        match.islandPulseData = reg.islandPulseData;
      } else {
        // IslandPulse-registered server not found in public list — add it
        servers.push({
          id: reg.name.toLowerCase().replace(/\s+/g, "-"),
          hostname: reg.name,
          port: 25565,
          name: reg.name,
          motd: "",
          version: "Unknown",
          playersOnline: 0,
          maxPlayers: 0,
          ping: null,
          online: false,
          lastSeen: null,
          gamemode: null,
          islandPulseStatus: reg.islandPulseData.tier,
          islandPulseData: reg.islandPulseData,
          fetchedAt: new Date().toISOString(),
        });
      }
    }
  }

  const existing = readCache();
  const merged = mergeServers(existing.servers, servers);

  const cache = {
    lastUpdated: new Date().toISOString(),
    servers: merged.sort((a, b) => b.playersOnline - a.playersOnline),
  };
  writeCache(cache);

  return NextResponse.json({
    success: true,
    serverCount: merged.length,
    seedCount: 30,
    apiDiscoveredCount: apiDiscovered.length,
    duration: Date.now() - start,
  });
}
