import fs from "fs";
import path from "path";
import type { ServersCache, ServerEntry } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "servers.json");

export function readCache(): ServersCache {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { lastUpdated: null, servers: [] };
  }
}

export function writeCache(cache: ServersCache): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(cache, null, 2), "utf-8");
}

export function mergeServers(
  existing: ServerEntry[],
  incoming: ServerEntry[]
): ServerEntry[] {
  const map = new Map<string, ServerEntry>();
  for (const s of existing) map.set(s.id, s);
  for (const s of incoming) {
    const prev = map.get(s.id);
    // Preserve IslandPulse data from previous cache if new fetch didn't get it
    if (prev?.islandPulseData && !s.islandPulseData) {
      s.islandPulseData = prev.islandPulseData;
      s.islandPulseStatus = prev.islandPulseStatus;
    }
    map.set(s.id, s);
  }
  return Array.from(map.values());
}
