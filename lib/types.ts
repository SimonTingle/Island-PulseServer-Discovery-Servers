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

// ─── Outreach Intelligence ────────────────────────────────────────────────────

export type ContactChannelKind = "discord" | "website" | "email" | "twitter" | "youtube" | "other";

export interface ContactChannel {
  kind: ContactChannelKind;
  value: string;
  url: string;
  source: "motd" | "mcsrvstat" | "forum";
  priority: number; // 1=discord 2=website 3=email 4=social 5=other
}

export type ForumPlatform = "reddit" | "planetminecraft" | "minecraftforum" | "youtube" | "twitter" | "duckduckgo" | "other";

export interface ForumMention {
  platform: ForumPlatform;
  url: string;
  title: string;
  date: string | null;
  language: string;
  snippet: string;
}

export type HeatLabel = "Hot" | "Warm" | "Cold" | "Frozen";

export interface HeatScore {
  score: number;
  label: HeatLabel;
  lastMentionDate: string | null;
}

export interface OutreachData {
  scannedAt: string;
  contacts: ContactChannel[];
  mentions: ForumMention[];
  heat: HeatScore;
}

// ─────────────────────────────────────────────────────────────────────────────

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
  outreach?: OutreachData;
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
