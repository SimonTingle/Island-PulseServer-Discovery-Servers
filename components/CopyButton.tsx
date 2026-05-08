"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm px-3 py-1.5 transition-colors"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}
