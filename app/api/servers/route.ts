import { NextResponse } from "next/server";
import { readCache } from "@/lib/storage";

export async function GET() {
  const cache = readCache();
  return NextResponse.json({
    servers: cache.servers,
    lastUpdated: cache.lastUpdated,
    count: cache.servers.length,
  });
}
