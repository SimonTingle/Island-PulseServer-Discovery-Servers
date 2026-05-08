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

  // Apply results back to cache (strip internal _debug field before persisting)
  for (const result of results) {
    if (result.status === "fulfilled") {
      const idx = cache.servers.findIndex((s) => s.id === result.value.id);
      if (idx !== -1) {
        const { _debug: _, ...cleanOutreach } = result.value.outreach;
        cache.servers[idx].outreach = cleanOutreach;
      }
    }
  }

  writeCache(cache);

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - succeeded;

  const totalMentions = results
    .filter((r) => r.status === "fulfilled")
    .reduce((sum, r) => sum + (r as PromiseFulfilledResult<{ outreach: { mentions: unknown[] } }>).value.outreach.mentions.length, 0);

  type DebugCounts = { reddit: number; ddg: number; pmc: number };
  const sourceDebug = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<{ id: string; outreach: { _debug?: DebugCounts } }>).value.outreach._debug)
    .reduce<DebugCounts>((acc, d) => {
      if (!d) return acc;
      return { reddit: acc.reddit + d.reddit, ddg: acc.ddg + d.ddg, pmc: acc.pmc + d.pmc };
    }, { reddit: 0, ddg: 0, pmc: 0 });

  console.log(`[scan-outreach] scanned=${toScan.length} succeeded=${succeeded} failed=${failed} mentions=${totalMentions} sources=${JSON.stringify(sourceDebug)}`);

  return NextResponse.json({
    success: true,
    scanned: toScan.length,
    succeeded,
    failed,
    totalMentions,
    sources: sourceDebug,
  });
}
