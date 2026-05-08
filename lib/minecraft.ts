import type { ServerEntry } from "./types";
import crypto from "crypto";

interface PingResult {
  online: boolean;
  playersOnline: number;
  maxPlayers: number;
  version: string;
  motd: string;
  ping: number | null;
}

function cleanMotd(motd: unknown): string {
  if (!motd) return "";
  if (typeof motd === "string") {
    return motd.replace(/§[0-9a-fklmnor]/gi, "").trim();
  }
  if (typeof motd === "object" && motd !== null) {
    const obj = motd as Record<string, unknown>;
    // minecraft-server-util returns { raw, clean, html }
    if (typeof obj.clean === "string") return obj.clean.trim();
    if (typeof obj.raw === "string") {
      return obj.raw.replace(/§[0-9a-fklmnor]/gi, "").trim();
    }
  }
  return "";
}

export async function pingServer(
  hostname: string,
  port = 25565
): Promise<PingResult> {
  try {
    const { status } = await import("minecraft-server-util");
    const start = Date.now();
    const result = await status(hostname, port, { timeout: 5000 });
    const ping = Date.now() - start;
    return {
      online: true,
      playersOnline: result.players.online,
      maxPlayers: result.players.max,
      version: result.version.name,
      motd: cleanMotd(result.motd),
      ping,
    };
  } catch {
    return {
      online: false,
      playersOnline: 0,
      maxPlayers: 0,
      version: "Unknown",
      motd: "",
      ping: null,
    };
  }
}

export function detectGamemode(motd: string, hostname: string): string | null {
  const text = (motd + " " + hostname).toLowerCase();
  if (text.includes("oneblock") || text.includes("one block")) return "OneBlock";
  if (text.includes("acidisland") || text.includes("acid island")) return "AcidIsland";
  if (text.includes("caveblock") || text.includes("cave block")) return "CaveBlock";
  if (text.includes("skygrid") || text.includes("sky grid")) return "SkyGrid";
  if (text.includes("boxed")) return "Boxed";
  if (text.includes("poseidon")) return "Poseidon";
  if (text.includes("skyblock") || text.includes("sky block")) return "BSkyBlock";
  return null;
}

export function buildServerEntry(
  hostname: string,
  port: number,
  ping: PingResult
): ServerEntry {
  const id = crypto
    .createHash("sha256")
    .update(`${hostname}:${port}`)
    .digest("hex")
    .slice(0, 16);
  const gamemode = detectGamemode(ping.motd, hostname);
  return {
    id,
    hostname,
    port,
    name: hostname,
    motd: ping.motd,
    version: ping.version,
    playersOnline: ping.playersOnline,
    maxPlayers: ping.maxPlayers,
    ping: ping.ping,
    online: ping.online,
    lastSeen: ping.online ? new Date().toISOString() : null,
    gamemode,
    islandPulseStatus: null,
    islandPulseData: null,
    fetchedAt: new Date().toISOString(),
  };
}
