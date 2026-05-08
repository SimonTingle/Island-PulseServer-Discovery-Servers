import { NextResponse } from "next/server";
import { readCache, writeCache } from "@/lib/storage";
import { scanOutreach } from "@/lib/outreachScanner";

export const maxDuration = 60;

const OUTREACH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function isOutreachStale(scannedAt: string | undefined): boolean {
  if (!scannedAt) return true;
  return Date.now() - new Date(scannedAt).getTime() > OUTREACH_TTL_MS;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cache = readCache();
  const idx = cache.servers.findIndex((s) => s.id === id);

  if (idx === -1) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  const force = new URL(req.url).searchParams.get("force") === "true";
  const server = cache.servers[idx];

  if (!force && !isOutreachStale(server.outreach?.scannedAt)) {
    return NextResponse.json({ success: true, cached: true, outreach: server.outreach });
  }

  const outreach = await scanOutreach(server);
  cache.servers[idx] = { ...server, outreach };
  writeCache(cache);

  return NextResponse.json({ success: true, cached: false, outreach });
}
