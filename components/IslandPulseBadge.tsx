export default function IslandPulseBadge({ tier }: { tier: "free" | "pro" | null }) {
  if (!tier) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold uppercase tracking-widest ${
        tier === "pro"
          ? "bg-cyan-900/60 text-cyan-300 border border-cyan-700"
          : "bg-slate-800 text-slate-400 border border-slate-700"
      }`}
    >
      {tier === "pro" ? "⚡ IP Pro" : "IP Free"}
    </span>
  );
}
