# NexHack — Gamified Learning & Accountability Platform

[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Dual--Mode-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen?style=flat-square)](docs/TESTING.md)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

> Transform any YouTube playlist into an interactive, structured course with wall-clock verified focus study time, verifiable XP gamification, collaborative study cohorts, and multi-metric peer leaderboards.

---

## ⚡ The Problem & The NexHack Solution

- **The Problem:** 90% of self-directed learners start YouTube tutorials but abandon them halfway. YouTube's recommendation algorithm distracts students with unrelated videos, passive watching does not translate to genuine retention, and there is zero accountability or peer motivation.
- **The NexHack Solution:** NexHack converts YouTube playlists into distraction-free, structured courses. Learners track verified study sessions with anti-tampering Pomodoro timers, earn XP recorded in an immutable ledger, join private cohorts, and compete on transparent, verified leaderboards.

---

## 🚀 Key Features

### 1. 📺 YouTube Playlist Course Converter & Player
- **Universal Playlist Import:** Paste any YouTube playlist URL or ID (e.g. Traversy Media, CS50, freeCodeCamp) to automatically parse videos, durations, and syllabus order.
- **1-Click Evaluator Presets:** Instantly load curated high-resolution programming courses (React 18, Python DSA, CS50, NeetCode 150) with verified embeddable videos.
- **Distraction-Free Course Player:** 16:9 responsive YouTube player with lesson checklist, auto-advance, and mark-as-complete toggles.
- **Deno Edge Function Proxy:** Proxies YouTube Data API v3 queries server-side to safeguard credentials.

### 2. ⏱️ Dual-Mode Study Timer with Tab-Throttling Defense
- **Modes:** 25-minute Pomodoro focus sprints (with 5m short / 15m long breaks) or Manual Stopwatch count-up.
- **Anti-Throttling Wall-Clock Defense:** Uses `Date.now()` delta math to ensure inactive background browser tabs never lose elapsed time.
- **Crash & Reload Recovery:** Persists active timer state to local storage so page refreshes never wipe an active session.
- **Anti-Tampering XP Verification:** Duration claims are bounded by actual wall-clock elapsed seconds between `started_at` and `ended_at`. Sessions under 60 seconds are discarded to prevent micro-spamming.

### 3. 🎮 Gamification & Level Engine
- **Quadratic Level Progression:** $L = \lfloor\sqrt{\text{XP} / 100}\rfloor + 1$. Starts easy (100 XP for Level 2) and scales smoothly without runaway hyper-inflation.
- **Verified XP Rules:**
  - `+50 XP` per unique completed lesson (strictly deduplicated).
  - `+10 XP` per 10 minutes of verified study time.
  - `+25 XP` bonus for completing a 25m Pomodoro sprint.
- **Daily Streak Engine:** Protects streaks across calendar day boundaries (`YYYY-MM-DD`).
- **Milestone Badges:** Permanent recognition for key achievements (*First Step*, *Century Club*, *3-Day Momentum*, *Week Warrior*, *Course Finisher*).
- **Immutable XP Ledger:** Every XP award creates an audit trail entry in `xp_transactions`.

### 4. 👥 Collaborative Cohorts & Private Invite Codes
- **Public & Private Groups:** Create or join study groups with weekly study targets (e.g. 10h/week).
- **Cryptographic Invite Codes:** Private groups generate unique alphanumeric codes (`NEX-XXXX`) for controlled membership access.
- **Cohort Accountability:** Displays member study hours and collective progress towards group goals.

### 5. 🏆 Multi-Metric Peer Leaderboards
- **Multi-Axis Ranking:** Toggle rankings between **XP Points**, **Verified Study Time**, **Completed Lessons**, and **Daily Streaks**.
- **Timeframe Filtering:** Compare performance over **This Week**, **This Month**, or **All-Time**.
- **Top 3 Visual Podium:** Illuminated Gold, Silver, and Bronze podium highlights top performers, with dynamic ranking feedback for the current user.

### 6. 📊 Visual Learning Analytics (Recharts)
- **Daily Focus Bar Chart:** Visual breakdown of study hours clocked per day of the week.
- **XP Velocity Area Chart:** Cumulative XP accumulation timeline.
- **Curriculum Distribution:** Visual focus metrics across enrolled technical domains.
- **Session Audit Table:** Verifiable historical log of completed study sessions.

---

## 🛠️ Architecture & Tech Stack

```
NexHack/
├── src/
│   ├── components/layout/    # AppLayout, Navbar (live stats), Sidebar
│   ├── features/
│   │   ├── auth/             # Dual-mode AuthContext & session management
│   │   ├── courses/          # Course player, catalog, YouTube import service
│   │   ├── gamification/     # XP engine, quadratic level formula, badges, ledger
│   │   ├── groups/           # Study cohorts & invite code service
│   │   ├── insights/         # Analytics aggregation & Recharts visualization
│   │   ├── leaderboard/      # Multi-metric dynamic ranking engine
│   │   ├── profile/          # User showcase, badge showcase, XP ledger audit
│   │   └── timer/            # Dual-mode study timer with wall-clock defense
│   ├── lib/                  # Dual-mode Supabase client & mock seed fixtures
│   └── routes/               # Protected and public route configuration
├── supabase/
│   └── functions/import-playlist/  # Secure Deno Edge Function for YouTube API
├── scripts/                  # 5 Self-checking verification test suites
└── docs/                     # Full governance, architecture & defense registry
```

- **Frontend:** React 18, Vite 5, Tailwind CSS, Lucide React, Recharts, React Router v6.
- **Backend & Database:** PostgreSQL via Supabase (Row Level Security enabled) + Transparent Local-First mock fallback.
- **Edge Functions:** Deno runtime on Supabase Edge.

---

## 🏁 Quick Start & Local Development

### Prerequisites
- Node.js (v18+ or v24+ recommended)
- npm

### 1. Clone & Install
```bash
git clone https://github.com/your-username/NexHack.git
cd NexHack
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*Note: If no Supabase credentials are provided, NexHack runs automatically in **Local-First Dual-Mode** with complete persistence!*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Verification & Testing

NexHack includes 5 automated self-checking test suites covering all core algorithmic formulas, duration verification, streak math, and ranking logic:

```bash
# Execute all 5 verification test suites
npm test

# Verify production Vite build and chunk optimization
npm run build
```

---

## 🎯 2-Minute Hackathon Evaluation Guide

1. **Sign In:** Navigate to `/login` and click **"One-Click Hackathon Evaluator Login"** (logs in as `alex_dev`).
2. **Import a Course:** Go to **Courses**, click **"Import YouTube Playlist"**, select any 1-Click Preset (e.g. *React 18 & Modern Web Development*), and click **Import Course**.
3. **Play & Complete Lessons:** In the **Course Player**, preview the video lesson and click **"Mark Lesson Complete"**. Notice the `+50 XP` notification and instant Navbar level update!
4. **Clock Study Time:** Go to **Timer**, select your course, click **"Start Focus Session"**, let it run, and click **"Finish & Award XP"**.
5. **Inspect Social Rankings:** Visit **Leaderboard** and toggle between **XP**, **Study Time**, and **Streak** to see real-time podium updates.
6. **Review Insights:** Visit **Insights** to inspect your verified study time bar charts and XP velocity curve!

---

## 📜 Documentation Registry

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Comprehensive architectural specifications & sequence diagrams.
- [`docs/DATA.md`](docs/DATA.md) — 11 PostgreSQL schemas, table definitions, and RLS policies.
- [`docs/defense/DEFENSE.md`](docs/defense/DEFENSE.md) — Rigorous whiteboard answers to the 12 defense questions.
- [`docs/TESTING.md`](docs/TESTING.md) — Complete test execution report and build logs.
- [`docs/HANDOVER.md`](docs/HANDOVER.md) — Comprehensive implementation history and git commits.

---

## ⚖️ License
Released under the [MIT License](LICENSE).
