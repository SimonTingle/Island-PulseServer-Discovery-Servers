import type {
  ServerEntry,
  ContactChannel,
  ContactChannelKind,
  ForumMention,
  ForumPlatform,
  HeatScore,
  HeatLabel,
  OutreachData,
} from "./types";

// ─── Regex patterns ───────────────────────────────────────────────────────────

const DISCORD_INVITE_RE = /discord(?:\.gg|app\.com\/invite)\/([A-Za-z0-9\-]{2,32})/gi;
const HTTP_URL_RE = /https?:\/\/[^\s§<>\])\}]+/gi;
const EMAIL_RE = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g;
const TWITTER_RE = /(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,15})/i;
const YOUTUBE_RE = /(?:youtube\.com\/(?:c\/|channel\/|@)|youtu\.be\/)/i;
const MC_COLOR_RE = /§[0-9a-fklmnor]/gi;
const HTML_TAG_RE = /<[^>]+>/g;
const DDG_RESULT_RE = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
const DDG_SNIPPET_RE = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
const PMC_TITLE_RE = /<h2[^>]+class="[^"]*title[^"]*"[^>]*>[\s\S]*?<a[^>]+href="(\/server\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(HTML_TAG_RE, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

function classifyUrl(url: string): ContactChannelKind {
  if (/discord\.gg|discordapp\.com\/invite/i.test(url)) return "discord";
  if (YOUTUBE_RE.test(url)) return "youtube";
  if (TWITTER_RE.test(url)) return "twitter";
  return "website";
}

function kindPriority(kind: ContactChannelKind): number {
  const map: Record<ContactChannelKind, number> = {
    discord: 1,
    website: 2,
    email: 3,
    twitter: 4,
    youtube: 4,
    other: 5,
  };
  return map[kind];
}

function classifyForumPlatform(url: string): ForumPlatform {
  if (/reddit\.com/i.test(url)) return "reddit";
  if (/planetminecraft\.com/i.test(url)) return "planetminecraft";
  if (/minecraftforum\.net/i.test(url)) return "minecraftforum";
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/twitter\.com|x\.com/i.test(url)) return "twitter";
  return "duckduckgo";
}

// ─── Language detection ───────────────────────────────────────────────────────

const SUBREDDIT_LANG_MAP: Record<string, string> = {
  minecraft_de: "de", minecraftde: "de",
  minecraftbr: "pt", minecraftpt: "pt",
  minecraftfr: "fr",
  minecraftes: "es",
  minecraft_ru: "ru",
  minecraft_jp: "ja",
  minecraftchina: "zh",
};

function guessLanguageFromTitle(title: string): string {
  if (/[一-鿿]/.test(title)) return "zh";
  if (/[぀-ヿ]/.test(title)) return "ja";
  if (/[Ѐ-ӿ]/.test(title)) return "ru";
  if (/\b(le|la|les|un|une|des|je|tu|il|est)\b/i.test(title)) return "fr";
  if (/\b(der|die|das|ein|eine|und|ich|du|ist)\b/i.test(title)) return "de";
  if (/\b(el|la|los|las|un|una|es|en|que)\b/i.test(title)) return "es";
  if (/\b(o|a|os|as|um|uma|de|do|da)\b/i.test(title)) return "pt";
  return "en";
}

// ─── Merge helpers ────────────────────────────────────────────────────────────

function mergeAndSortContacts(all: ContactChannel[]): ContactChannel[] {
  const seen = new Set<string>();
  const deduped: ContactChannel[] = [];
  for (const c of all) {
    if (!seen.has(c.url)) {
      seen.add(c.url);
      deduped.push(c);
    }
  }
  const sourceOrder: Record<string, number> = { motd: 0, mcsrvstat: 1, forum: 2 };
  return deduped.sort((a, b) =>
    a.priority !== b.priority ? a.priority - b.priority : sourceOrder[a.source] - sourceOrder[b.source]
  );
}

function mergeAndSortMentions(all: ForumMention[]): ForumMention[] {
  const seen = new Set<string>();
  const deduped: ForumMention[] = [];
  for (const m of all) {
    if (!seen.has(m.url)) {
      seen.add(m.url);
      deduped.push(m);
    }
  }
  return deduped.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

// ─── MOTD parser ──────────────────────────────────────────────────────────────

function parseMotdContacts(motd: string): ContactChannel[] {
  const clean = motd.replace(MC_COLOR_RE, "");
  const contacts: ContactChannel[] = [];
  const seen = new Set<string>();

  // Discord invites first (before generic URL sweep)
  for (const match of clean.matchAll(DISCORD_INVITE_RE)) {
    const code = match[1];
    const url = `https://discord.gg/${code}`;
    if (!seen.has(url)) {
      seen.add(url);
      contacts.push({ kind: "discord", value: code, url, source: "motd", priority: 1 });
    }
  }

  // Generic HTTP/S URLs
  for (const match of clean.matchAll(HTTP_URL_RE)) {
    const raw = match[0].replace(/[.,;:!?)]+$/, "");
    if (seen.has(raw)) continue;
    if (/discord\.gg|discordapp\.com\/invite/i.test(raw)) continue; // already captured
    seen.add(raw);
    const kind = classifyUrl(raw);
    contacts.push({ kind, value: raw, url: raw, source: "motd", priority: kindPriority(kind) });
  }

  // Emails
  for (const match of clean.matchAll(EMAIL_RE)) {
    const email = match[0];
    const url = `mailto:${email}`;
    if (!seen.has(url)) {
      seen.add(url);
      contacts.push({ kind: "email", value: email, url, source: "motd", priority: 3 });
    }
  }

  return contacts;
}

// ─── mcsrvstat.us extra fields ────────────────────────────────────────────────

interface McsrvstatFullResponse {
  website?: string;
  discord?: string;
}

async function fetchMcsrvstatExtra(hostname: string, port: number): Promise<ContactChannel[]> {
  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${hostname}:${port}`, {
      headers: { "User-Agent": "IslandPulse-Discovery/1.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data = await res.json() as McsrvstatFullResponse;
    const contacts: ContactChannel[] = [];
    const seen = new Set<string>();

    if (data.website) {
      const url = data.website.startsWith("http") ? data.website : `https://${data.website}`;
      if (!seen.has(url)) {
        seen.add(url);
        contacts.push({ kind: "website", value: data.website, url, source: "mcsrvstat", priority: 2 });
      }
    }
    if (data.discord) {
      const url = data.discord.startsWith("http") ? data.discord : `https://discord.gg/${data.discord}`;
      if (!seen.has(url)) {
        seen.add(url);
        contacts.push({ kind: "discord", value: data.discord, url, source: "mcsrvstat", priority: 1 });
      }
    }
    return contacts;
  } catch {
    return [];
  }
}

// ─── Reddit search ────────────────────────────────────────────────────────────

interface RedditPost {
  title: string;
  url: string;
  created_utc: number;
  subreddit: string;
  selftext?: string;
}

async function searchReddit(query: string): Promise<ForumMention[]> {
  const mentions: ForumMention[] = [];
  const seen = new Set<string>();
  const queries = [
    `"${query}"`,
    `"${query}" minecraft`,
  ];

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=new&limit=10&type=link`,
        {
          headers: { "User-Agent": "IslandPulse-Discovery/1.0 (server-discovery)" },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!res.ok) continue;
      const data = await res.json() as { data?: { children?: Array<{ data: RedditPost }> } };
      const posts = data?.data?.children ?? [];

      for (const { data: post } of posts) {
        if (seen.has(post.url)) continue;
        seen.add(post.url);
        const subLower = post.subreddit.toLowerCase();
        const language = SUBREDDIT_LANG_MAP[subLower] ?? guessLanguageFromTitle(post.title);
        mentions.push({
          platform: "reddit",
          url: post.url,
          title: post.title,
          date: new Date(post.created_utc * 1000).toISOString(),
          language,
          snippet: (post.selftext ?? "").slice(0, 200),
        });
      }
    } catch { /* silent */ }

    await new Promise((r) => setTimeout(r, 1500));
  }

  return mentions;
}

// ─── DuckDuckGo search (8 language regions) ───────────────────────────────────

const DDG_LANG_PARAMS: Array<{ kl: string; lang: string }> = [
  { kl: "en-us", lang: "en" },
  { kl: "de-de", lang: "de" },
  { kl: "fr-fr", lang: "fr" },
  { kl: "es-es", lang: "es" },
  { kl: "pt-br", lang: "pt" },
  { kl: "ru-ru", lang: "ru" },
  { kl: "jp-jp", lang: "ja" },
  { kl: "cn-zh", lang: "zh" },
];

async function searchDuckDuckGo(serverName: string, hostname: string): Promise<ForumMention[]> {
  const seen = new Set<string>();
  const allMentions: ForumMention[] = [];

  const results = await Promise.allSettled(
    DDG_LANG_PARAMS.map(async ({ kl, lang }) => {
      const q = encodeURIComponent(`"${serverName}" minecraft skyblock`);
      try {
        const res = await fetch(`https://html.duckduckgo.com/html/?q=${q}&kl=${kl}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; IslandPulse-Bot/1.0)",
            "Accept-Language": lang,
          },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return [];
        const html = await res.text();

        const titles: Array<{ href: string; title: string }> = [];
        const snippets: string[] = [];

        for (const match of html.matchAll(DDG_RESULT_RE)) {
          titles.push({ href: match[1], title: stripHtml(match[2]) });
        }
        for (const match of html.matchAll(DDG_SNIPPET_RE)) {
          snippets.push(stripHtml(match[1]));
        }

        const local: ForumMention[] = [];
        titles.forEach(({ href, title }, i) => {
          if (!href || seen.has(href)) return;
          const lower = title.toLowerCase();
          const lowerHost = hostname.toLowerCase().replace(/\.[a-z]{2,6}$/, "");
          if (!lower.includes(lowerHost) && !lower.includes("minecraft") && !lower.includes("skyblock")) return;
          seen.add(href);

          local.push({
            platform: classifyForumPlatform(href),
            url: href,
            title: title.slice(0, 150),
            date: null,
            language: lang,
            snippet: (snippets[i] ?? "").slice(0, 200),
          });
        });
        return local;
      } catch {
        return [];
      }
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled") {
      for (const m of r.value) {
        if (!seen.has(m.url)) {
          seen.add(m.url);
          allMentions.push(m);
        }
      }
    }
  }

  return allMentions;
}

// ─── Planet Minecraft ─────────────────────────────────────────────────────────

async function searchPlanetMinecraft(serverName: string): Promise<ForumMention[]> {
  const mentions: ForumMention[] = [];
  const seen = new Set<string>();
  try {
    const q = encodeURIComponent(serverName);
    const res = await fetch(
      `https://www.planetminecraft.com/search/server/?keywords=${q}`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; IslandPulse-Bot/1.0)" },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) return [];
    const html = await res.text();
    for (const match of html.matchAll(PMC_TITLE_RE)) {
      const path = match[1];
      const title = stripHtml(match[2]);
      const url = `https://www.planetminecraft.com${path}`;
      if (seen.has(url)) continue;
      seen.add(url);
      mentions.push({ platform: "planetminecraft", url, title: title.slice(0, 150), date: null, language: "en", snippet: "" });
    }
  } catch { /* silent */ }
  return mentions;
}

// ─── Extract contacts from mention URLs ───────────────────────────────────────

function extractContactsFromMentions(mentions: ForumMention[]): ContactChannel[] {
  const contacts: ContactChannel[] = [];
  for (const m of mentions) {
    for (const match of m.url.matchAll(DISCORD_INVITE_RE)) {
      const code = match[1];
      contacts.push({ kind: "discord", value: code, url: `https://discord.gg/${code}`, source: "forum", priority: 1 });
    }
    if (YOUTUBE_RE.test(m.url)) {
      contacts.push({ kind: "youtube", value: m.url, url: m.url, source: "forum", priority: 4 });
    }
    if (TWITTER_RE.test(m.url)) {
      contacts.push({ kind: "twitter", value: m.url, url: m.url, source: "forum", priority: 4 });
    }
  }
  return contacts;
}

// ─── Heat score ───────────────────────────────────────────────────────────────

function calculateHeatScore(mentions: ForumMention[]): HeatScore {
  if (mentions.length === 0) return { score: 0, label: "Frozen", lastMentionDate: null };

  let latestMs: number | null = null;
  for (const m of mentions) {
    if (!m.date) continue;
    const t = new Date(m.date).getTime();
    if (!isNaN(t) && (latestMs === null || t > latestMs)) latestMs = t;
  }

  if (latestMs === null) return { score: 35, label: "Warm", lastMentionDate: null };

  const daysSince = (Date.now() - latestMs) / (1000 * 60 * 60 * 24);
  const lastMentionDate = new Date(latestMs).toISOString();

  let score: number;
  let label: HeatLabel;

  if (daysSince < 7) {
    score = Math.round(100 - (daysSince / 7) * 25);
    label = "Hot";
  } else if (daysSince < 30) {
    score = Math.round(75 - ((daysSince - 7) / 23) * 25);
    label = "Warm";
  } else if (daysSince < 90) {
    score = Math.round(50 - ((daysSince - 30) / 60) * 25);
    label = "Cold";
  } else {
    score = Math.max(0, Math.round(25 - (Math.min(daysSince - 90, 365) / 365) * 25));
    label = "Frozen";
  }

  return { score, label, lastMentionDate };
}

// ─── Search query builder ─────────────────────────────────────────────────────

function buildSearchQuery(server: ServerEntry): string {
  const name = server.name.trim();
  if (name.length >= 4 && !name.includes(".")) return name;
  return server.hostname.replace(/\.[a-z]{2,6}$/, "");
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function scanOutreach(server: ServerEntry): Promise<OutreachData> {
  const query = buildSearchQuery(server);

  const [motdContacts, mcsrvstatContacts, ddgMentions, pmcMentions, redditMentions] =
    await Promise.all([
      Promise.resolve(parseMotdContacts(server.motd)),
      fetchMcsrvstatExtra(server.hostname, server.port),
      searchDuckDuckGo(query, server.hostname),
      searchPlanetMinecraft(query),
      searchReddit(query),
    ]);

  const allMentions = mergeAndSortMentions([...redditMentions, ...ddgMentions, ...pmcMentions]);
  const forumContacts = extractContactsFromMentions(allMentions);
  const allContacts = mergeAndSortContacts([...motdContacts, ...mcsrvstatContacts, ...forumContacts]);
  const heat = calculateHeatScore(allMentions);

  return {
    scannedAt: new Date().toISOString(),
    contacts: allContacts,
    mentions: allMentions,
    heat,
  };
}
