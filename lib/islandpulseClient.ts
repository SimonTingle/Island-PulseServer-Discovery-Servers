import type { IslandPulseData, IslandData } from "./types";

const BACKEND_URL = process.env.ISLANDPULSE_BACKEND_URL ?? "http://localhost:3000";
const ADMIN_KEY = process.env.ISLANDPULSE_ADMIN_KEY ?? "";

interface AdminServer {
  id: number;
  name: string;
  apiKeyPrefix: string;
  isPremium: number | boolean;
  islandCount: number;
  snapshotsLastHour: number;
  premiumUntil: number | null;
  createdAt: number;
}

interface AdminStats {
  serverList: AdminServer[];
}

interface Leader {
  islandUuid: string;
  netWorth: number;
  growth24hPercent: number;
}

export interface RegisteredServer {
  name: string;
  apiKeyPrefix: string;
  islandPulseData: IslandPulseData;
}

async function fetchAdminStats(): Promise<AdminServer[]> {
  if (!ADMIN_KEY) return [];
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/stats`, {
      headers: { "x-admin-key": ADMIN_KEY },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as AdminStats;
    return data.serverList ?? [];
  } catch {
    return [];
  }
}

async function fetchLeaders(): Promise<Leader[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/public/leaders`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    return (await res.json()) as Leader[];
  } catch {
    return [];
  }
}

export async function fetchRegisteredServers(): Promise<RegisteredServer[]> {
  const [servers, leaders] = await Promise.all([
    fetchAdminStats(),
    fetchLeaders(),
  ]);

  const top3: IslandData[] = leaders.slice(0, 3).map((l) => ({
    islandUuid: l.islandUuid,
    netWorth: l.netWorth,
    growth24hPercent: l.growth24hPercent,
  }));

  return servers.map((s) => ({
    name: s.name,
    apiKeyPrefix: s.apiKeyPrefix,
    islandPulseData: {
      totalIslands: s.islandCount ?? 0,
      avgNetWorth: 0,
      top3Islands: top3,
      totalPlayers: null,
      lastSnapshot: null,
      tier: s.isPremium ? "pro" : "free",
    },
  }));
}
