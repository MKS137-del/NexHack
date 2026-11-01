# Engineering Decision Records (ADRs) — NexHack

**Project:** NexHack  
**Status:** Approved for Version 1  

---

## ADR-001: Selection of React + Vite + Plain JavaScript

- **Status:** APPROVED
- **Context:** The project requires a performant, modular frontend development environment suited for a hackathon timeline and accessible to a beginner-heavy team.
- **Alternatives Considered:**
  1. *Next.js (App Router)*: High SSR complexity, unnecessary server components for an authenticated single-page dashboard, slower local iteration on Windows.
  2. *React + TypeScript*: Strong typing, but introduces potential type compilation overhead and velocity bottlenecks during rapid hackathon prototyping.
  3. *React + Vite + JavaScript*: Ultra-fast Hot Module Replacement (HMR), simple bundling, zero compilation friction, native ES modules.
- **Decision:** Use React + Vite with JavaScript (JSX), augmented with Tailwind CSS for utility styling and React Router v6 for client routing.
- **Trade-offs:** JavaScript lacks compile-time type validation, requiring stricter runtime prop validation, comprehensive integration tests, and disciplined schema validation at boundaries.
- **Reconsideration Trigger:** If the team expands post-hackathon and requires strict enterprise API contract enforcement across multiple micro-frontends.

---

## ADR-002: Backend Architecture & Persistence via Supabase (PostgreSQL + RLS)

- **Status:** APPROVED
- **Context:** Need an authentic, relational, production-ready backend supporting user authentication, Row Level Security, complex relational joins for leaderboards/analytics, and serverless Edge Functions without managing a dedicated server cluster.
- **Alternatives Considered:**
  1. *Custom Node.js/Express + MongoDB*: Schema-less flexibility, but lacks native relational joins needed for historical study analytics, leaderboard period calculations, and requires custom JWT auth and server hosting.
  2. *Firebase (Firestore)*: NoSQL document store makes multi-criteria leaderboard aggregation (weekly/monthly study hours) expensive and complex to query; RLS security rules are less expressive than PostgreSQL policies.
  3. *Supabase (PostgreSQL + Auth + RLS + Edge Functions)*: Native PostgreSQL relational integrity, declarative SQL migrations, built-in secure JWT auth, robust Row Level Security, and Deno Edge Functions for secret API keys.
- **Decision:** Use Supabase as the primary backend platform.
- **Trade-offs:** Dependency on Supabase cloud services; requires client-side mock fallback adapters for offline local development when credentials are not yet configured.
- **Reconsideration Trigger:** If multi-cloud independence or on-premise self-hosting becomes a strict requirement.

---

## ADR-003: Server-Side YouTube Data API Integration via Edge Functions

- **Status:** APPROVED
- **Context:** YouTube playlist metadata must be parsed and converted into courses while strictly keeping the `YOUTUBE_API_KEY` private and mitigating quota exhaustion.
- **Alternatives Considered:**
  1. *Direct Client-Side API Calls*: Fast to build, but leaks the Google API key in browser network headers and HTML source, violating security rules.
  2. *Scraping / Unofficial YouTube Parsers*: Avoids API key requirements, but highly brittle, legally dubious, and frequently breaks due to YouTube DOM changes.
  3. *Supabase Edge Function Proxy (`import-playlist`)*: Stores `YOUTUBE_API_KEY` as a secure environment secret on the backend, validates user authorization, deduplicates import requests, and batches database writes.
- **Decision:** Implement playlist conversion exclusively through a Supabase Edge Function (`supabase/functions/import-playlist/`).
- **Trade-offs:** Requires an Edge Function deployment step; in local offline mock mode, pre-seeded JSON fixtures are used to simulate YouTube API responses.
- **Reconsideration Trigger:** If YouTube Data API quota limits (10,000 units/day) are exceeded under high production volume, requiring a centralized caching/queueing proxy.

---

## ADR-004: Immutable Ledger for Gamification XP (`xp_transactions`)

- **Status:** APPROVED
- **Context:** Gamification systems are prone to exploits (client-side XP spoofing, duplicate lesson completion claims, infinite study timer hacks).
- **Alternatives Considered:**
  1. *Mutable Counter Column (`profiles.xp = profiles.xp + N`)*: Extremely simple, but provides zero historical traceability, allows silent manipulation, and makes period-based leaderboards (weekly/monthly XP) impossible.
  2. *Append-Only Ledger (`xp_transactions`)*: Every XP point is an individual immutable row recording timestamp, amount, user ID, reason, and foreign key reference. The `profiles.xp` column serves solely as a cached materialized summary.
- **Decision:** Adopt an append-only `xp_transactions` ledger with server-side validation.
- **Trade-offs:** Slightly higher storage footprint in PostgreSQL; requires index optimization for fast aggregation queries.
- **Reconsideration Trigger:** High write throughput requiring read-replica sharding (not applicable to hackathon scale).

---

## ADR-005: Study Timer Wall-Clock Timestamp Persistence

- **Status:** APPROVED
- **Context:** JavaScript intervals (`setInterval`) pause when browser tabs are backgrounded or throttled, and active sessions vanish if the page is refreshed or accidentally closed.
- **Alternatives Considered:**
  1. *Pure React State Timer (`setInterval`)*: Trivial to code, but pauses in background tabs and loses all progress upon reload.
  2. *WebSocket-Backed Server Timer*: Accurate, but introduces heavy real-time server load and fails completely during minor network drops.
  3. *Timestamp-Based Local Storage Recovery*: When a session begins, record `sessionStart = Date.now()` and `mode` in `localStorage`. The timer computes elapsed time as `Date.now() - sessionStart`. On reload, the timer seamlessly resumes without data loss. Upon completion, start/end timestamps are submitted to the server for duration validation.
- **Decision:** Use wall-clock timestamp persistence with server verification.
- **Trade-offs:** Client system clock changes could theoretically skew the duration; mitigated by server-side verification comparing the submitted elapsed time against server arrival time bounds.
- **Reconsideration Trigger:** None — standard industry pattern for client timers.
