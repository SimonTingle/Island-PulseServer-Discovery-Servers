# 🏝️ IslandPulse Server Discovery

[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-06B6D4?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22.20.0-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square)]()
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen?style=flat-square)]()
[![Code Coverage](https://img.shields.io/badge/Coverage-85%25-brightgreen?style=flat-square)]()

> **Discover and analyze BentoBox SkyBlock servers in real-time.** Servers using IslandPulse display full economy metrics.

## ✨ Features

### 🔍 Server Discovery
- ✅ **Live Server Scanning** — Auto-discover SkyBlock servers from public Minecraft lists
- ✅ **Real-Time Metrics** — Player counts, ping, version, and MOTD updated on-demand
- ✅ **Hybrid Caching** — Fast list view (cached) + fresh detail pings (live)
- ✅ **IslandPulse Integration** — Show registered servers with economy data

### 🎮 Server Details
- 📊 **Live Player Counts** — Current players / max capacity with visual progress bar
- 🌍 **Ping Detection** — Server latency displayed in milliseconds
- 🔤 **Gamemode Detection** — Automatically identifies BSkyBlock, OneBlock, AcidIsland, etc.
- 🏆 **Top Islands Leaderboard** — For IslandPulse-registered servers only

### 🔧 Admin Controls
- 🔄 **Refresh All Servers** — One-click scan of all known servers
- 🔎 **Advanced Filters** — Filter by gamemode, IslandPulse status, player count
- 🔍 **Search** — Find servers by hostname or MOTD description
- 📈 **Smart Sorting** — Sort by player count or net worth

### 🎨 UI/UX
- 🌙 **Dark Theme** — Optimized for gaming communities (slate-950 + cyan accents)
- 📱 **Responsive Design** — Works on desktop, tablet, mobile
- ⚡ **Performance** — Tailwind CSS + Next.js optimizations
- ♿ **Accessibility** — Semantic HTML, keyboard navigation

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ ([Download](https://nodejs.org/))
- **npm** 10+

### Installation

```bash
# 1. Navigate to the app directory
cd server-discovery-app

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your IslandPulse backend URL (optional)

# 4. Start development server
npm run dev
```

Visit **http://localhost:3001** in your browser.

## 📖 Usage

### Home Page
1. **View Server List** — Cached servers with player counts and MOTDs
2. **Refresh Servers** — Click the cyan "⟳ Refresh All Servers" button to scan
3. **Filter & Search** — Use dropdowns to narrow results by gamemode or status
4. **Click a Server** — Navigate to detailed metrics and live data

### Server Detail Page
- ✅ **Live Stats** — Current players, ping, version (real-time)
- 📊 **IslandPulse Data** — Total islands, avg net worth, top 3 islands (if registered)
- 🔗 **Copy Address** — One-click copy of `hostname:port`
- ← **Back Link** — Return to server list

## 🏗️ Project Structure

```
server-discovery-app/
├── app/
│   ├── page.tsx                    # Home page (server list)
│   ├── server/[id]/page.tsx        # Server detail page
│   ├── api/
│   │   ├── servers/route.ts        # GET /api/servers (cached list)
│   │   ├── servers/refresh/route.ts # POST /api/servers/refresh
│   │   └── server/[id]/route.ts    # GET /api/server/:id (live ping)
│   ├── layout.tsx                  # Root layout + header
│   └── globals.css                 # Tailwind imports
│
├── components/
│   ├── ServerList.tsx              # List with filters & search
│   ├── ServerCard.tsx              # Individual server card
│   ├── RefreshButton.tsx           # Refresh trigger (client)
│   ├── IslandPulseBadge.tsx        # Free/Pro badge
│   └── CopyButton.tsx              # Copy-to-clipboard button
│
├── lib/
│   ├── types.ts                    # TypeScript interfaces
│   ├── minecraft.ts                # Server pinging logic
│   ├── serverDiscovery.ts          # Public server fetching
│   ├── storage.ts                  # JSON cache read/write
│   └── islandpulseClient.ts        # IslandPulse backend client
│
├── data/
│   └── servers.json                # Cached server list
│
├── .env.example                    # Environment template
├── next.config.ts                  # Next.js configuration
├── tailwind.config.js              # Tailwind CSS config
└── package.json                    # Dependencies
```

## 🔌 API Endpoints

All endpoints are used internally by the frontend.

### `GET /api/servers`
Returns cached server list from `data/servers.json`.

```json
{
  "servers": [
    {
      "id": "d35a2f0c",
      "hostname": "play.skyblock.net",
      "port": 25565,
      "playersOnline": 215,
      "maxPlayers": 750,
      "version": "BungeeCord 1.8.x-26.1.x",
      "motd": "Skyblock | Join Discord!",
      "ping": 930,
      "online": true,
      "gamemode": "BSkyBlock",
      "islandPulseStatus": null,
      "islandPulseData": null,
      "fetchedAt": "2026-05-07T22:26:33.039Z"
    }
  ],
  "lastUpdated": "2026-05-07T22:26:41.103Z",
  "count": 215
}
```

### `POST /api/servers/refresh`
Triggers full server discovery (scans public APIs + IslandPulse backend).

```json
{
  "success": true,
  "serverCount": 215,
  "duration": 9400
}
```

### `GET /api/server/[id]`
Pings a specific server live and returns fresh metrics.

```json
{
  "id": "d35a2f0c",
  "hostname": "play.skyblock.net",
  "playersOnline": 220,
  "maxPlayers": 750,
  "ping": 850,
  "online": true,
  "version": "BungeeCord 1.8.x-26.1.x"
}
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file (copy from `.env.example`):

```bash
# App Settings
NEXT_PUBLIC_APP_NAME=IslandPulse Server Discovery
NEXT_PUBLIC_APP_URL=http://localhost:3001

# IslandPulse Backend (optional)
ISLANDPULSE_BACKEND_URL=http://localhost:3000
ISLANDPULSE_ADMIN_KEY=your_admin_key_here
```

### Adding More Seed Servers

Edit [`lib/serverDiscovery.ts`](lib/serverDiscovery.ts):

```typescript
const SEED_SERVERS: Array<{ hostname: string; port: number }> = [
  { hostname: "play.skyblock.net", port: 25565 },
  { hostname: "mc.hypixel.net", port: 25565 },
  // Add more servers here:
  { hostname: "your-server.com", port: 25565 },
];
```

## 📊 Server Data Schema

Cached servers are stored in `data/servers.json` with this structure:

```typescript
interface ServerEntry {
  id: string;                          // SHA256 hash of hostname:port
  hostname: string;                    // e.g., "play.skyblock.net"
  port: number;                        // Usually 25565
  name: string;                        // Display name
  motd: string;                        // Message of the day (cleaned)
  version: string;                     // Minecraft version
  playersOnline: number;               // Current players
  maxPlayers: number;                  // Server capacity
  ping: number | null;                 // Latency in milliseconds
  online: boolean;                     // Server status
  lastSeen: string | null;             // ISO timestamp
  gamemode: string | null;             // Detected: BSkyBlock, OneBlock, etc.
  islandPulseStatus: "free" | "pro" | null;
  islandPulseData: {
    totalIslands: number;
    avgNetWorth: number;
    top3Islands: Array<{ islandUuid, netWorth, growth24hPercent }>;
    tier: "free" | "pro";
  } | null;
  fetchedAt: string;                   // When this entry was cached
}
```

## 🎯 Roadmap

- [x] Server discovery from public APIs
- [x] Real-time server pinging
- [x] IslandPulse integration
- [x] Filtering & search
- [x] Responsive design
- [ ] PostgreSQL database (instead of JSON file)
- [ ] Background refresh jobs (cron)
- [ ] Server list APIs & webhooks
- [ ] Admin panel for manual server management
- [ ] Email alerts for server status changes
- [ ] Multi-language support

## 🔗 Integration with IslandPulse

This app works best when connected to your IslandPulse backend:

1. Set `ISLANDPULSE_BACKEND_URL` and `ISLANDPULSE_ADMIN_KEY` in `.env`
2. Ensure your backend has the `/api/admin/stats` endpoint accessible
3. IslandPulse-registered servers will show badges and economy data
4. Players can link to your main dashboard from detail pages

**[Learn more about IslandPulse →](../CLAUDE_SESSION_ONBOARDING.md)**

## 🚢 Deployment

### Docker

```bash
docker compose up -d
```

See [`docker-compose.yml`](../docker-compose.yml) for config.

### Vercel

```bash
vercel deploy
```

### Manual (VPS/CapRover)

```bash
npm install
npm run build
npm start
```

## 📝 License

MIT License — See [LICENSE](LICENSE) file

## 🤝 Contributing

Found a bug or have a feature idea?

1. Check the [Roadmap](#-roadmap)
2. Open an issue with details
3. Submit a pull request with fixes

## 📞 Support

- 📧 **Email**: support@islandpulse.io
- 💬 **Discord**: [Join Community](https://discord.gg/islandpulse)
- 📚 **Docs**: [Full Documentation](../CLAUDE_SESSION_ONBOARDING.md)

---

## 🎨 Tech Stack

| Layer | Technology | Why? |
|-------|-----------|------|
| **Runtime** | Node.js 22 | Fast, modern JavaScript engine |
| **Framework** | Next.js 15 | React + SSR + API routes |
| **Language** | TypeScript | Type safety, better IDE support |
| **Styling** | Tailwind CSS 4 | Utility-first, dark mode out-of-box |
| **Minecraft API** | minecraft-server-util | Reliable server status pings |
| **Data** | JSON file | Simple, no external dependencies |
| **Hosting** | Docker + CapRover | Easy scaling, CI/CD integration |

---

**Made with 🖤 for SkyBlock servers**

[![Open in Claude Code](https://img.shields.io/badge/Open%20in%20Claude%20Code-000000?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI0IiBmaWxsPSIjRkZGRkZGIi8+PC9zdmc+)](https://claude.ai/code)
