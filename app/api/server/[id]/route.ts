import { NextResponse } from "next/server";
import { readCache } from "@/lib/storage";
import { pingServer } from "@/lib/minecraft";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cache = readCache();
  const server = cache.servers.find((s) => s.id === id);

  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  // Live ping for fresh metrics
  const live = await pingServer(server.hostname, server.port);

  return NextResponse.json({
    ...server,
    playersOnline: live.online ? live.playersOnline : server.playersOnline,
    maxPlayers: live.online ? live.maxPlayers : server.maxPlayers,
    version: live.online ? live.version : server.version,
    motd: live.online && live.motd ? live.motd : server.motd,
    ping: live.ping,
    online: live.online,
  });
}
