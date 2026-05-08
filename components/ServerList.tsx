"use client";

import { useState, useMemo } from "react";
import type { ServerEntry } from "@/lib/types";
import ServerCard from "./ServerCard";

const GAMEMODES = ["All", "BSkyBlock", "OneBlock", "AcidIsland", "CaveBlock", "SkyGrid", "Boxed", "Poseidon"];
const IP_FILTERS = ["All", "IslandPulse Pro", "IslandPulse Free", "Not Registered"];

interface Props {
  servers: ServerEntry[];
}

export default function ServerList({ servers }: Props) {
  const [search, setSearch] = useState("");
  const [gamemode, setGamemode] = useState("All");
  const [ipFilter, setIpFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"players" | "networth">("players");

  const filtered = useMemo(() => {
    let list = servers;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.hostname.toLowerCase().includes(q) ||
          s.motd.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)
      );
    }

    if (gamemode !== "All") {
      list = list.filter((s) => s.gamemode === gamemode);
    }

    if (ipFilter !== "All") {
      if (ipFilter === "IslandPulse Pro") list = list.filter((s) => s.islandPulseStatus === "pro");
      else if (ipFilter === "IslandPulse Free") list = list.filter((s) => s.islandPulseStatus === "free");
      else list = list.filter((s) => !s.islandPulseStatus);
    }

    return [...list].sort((a, b) =>
      sortBy === "players"
        ? b.playersOnline - a.playersOnline
        : (b.islandPulseData?.avgNetWorth ?? 0) - (a.islandPulseData?.avgNetWorth ?? 0)
    );
  }, [servers, search, gamemode, ipFilter, sortBy]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by hostname or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 px-4 py-2 text-sm focus:outline-none focus:border-cyan-600"
        />
        <select
          value={gamemode}
          onChange={(e) => setGamemode(e.target.value)}
          className="rounded-lg bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
        >
          {GAMEMODES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          value={ipFilter}
          onChange={(e) => setIpFilter(e.target.value)}
          className="rounded-lg bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
        >
          {IP_FILTERS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "players" | "networth")}
          className="rounded-lg bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
        >
          <option value="players">Sort: Players</option>
          <option value="networth">Sort: Net Worth</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500 mb-4">
        {filtered.length} server{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-lg">No servers found</p>
          <p className="text-sm mt-1">Try adjusting your filters or click Refresh All Servers</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      )}
    </div>
  );
}
