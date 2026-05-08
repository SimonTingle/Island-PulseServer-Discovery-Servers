import { NextResponse } from "next/server";
import { readCache, writeCache } from "@/lib/storage";
import { scanOutreach } from "@/lib/outreachScanner";

export const maxDuration = 300; // 5 minutes for bulk scan

const OUTREACH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function isOutreachStale(scannedAt: string | undefined): boolean {
  if (!scannedAt) return true;
  return Date.now() - new Date(scannedAt).getTime() > OUTREACH_TTL_MS;
}

export async function POST(req: Request) {
  const cache = readCache();
  const servers = cache.servers;
  const force = new URL(req.url).searchParams.get("force") === "true";

  const toScan = servers.filter((s) =>
    force ? true : isOutreachStale(s.outreach?.scannedAt)
  );

  const results = await Promise.allSettled(
    toScan.map(async (server) => {
      const outreach = await scanOutreach(server);
      return { id: server.id, outreach };
    })
  );

  // Apply results back to cache
  for (const result of results) {
    if (result.status === "fulfilled") {
      const idx = cache.servers.findIndex((s) => s.id === result.value.id);
      if (idx !== -1) {
        cache.servers[idx].outreach = result.value.outreach;
      }
    }
  }

  writeCache(cache);

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - succeeded;

  return NextResponse.json({
    success: true,
    scanned: toScan.length,
    succeeded,
    failed,
    duration: 0, // client can measure
  });
}
