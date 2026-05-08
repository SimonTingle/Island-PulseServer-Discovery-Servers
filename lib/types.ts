export interface IslandData {
  islandUuid: string;
  netWorth: number;
  growth24hPercent: number;
}

export interface IslandPulseData {
  totalIslands: number;
  avgNetWorth: number;
  top3Islands: IslandData[];
  totalPlayers: number | null;
  lastSnapshot: string | null;
  tier: "free" | "pro";
}

export interface ServerEntry {
  id: string;
  hostname: string;
  port: number;
  name: string;
  motd: string;
  version: string;
  playersOnline: number;
  maxPlayers: number;
  ping: number | null;
  online: boolean;
  lastSeen: string | null;
  gamemode: string | null;
  islandPulseStatus: "free" | "pro" | null;
  islandPulseData: IslandPulseData | null;
  fetchedAt: string;
}

export interface ServersCache {
  lastUpdated: string | null;
  servers: ServerEntry[];
}

export interface LiveServerData {
  id: string;
  hostname: string;
  port: number;
  playersOnline: number;
  maxPlayers: number;
  version: string;
  motd: string;
  ping: number | null;
  online: boolean;
  islandPulseStatus: "free" | "pro" | null;
  islandPulseData: IslandPulseData | null;
}
