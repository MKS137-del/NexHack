# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React, Vite, JavaScript, Tailwind CSS, React Router, Supabase (Auth, PostgreSQL Database, Row Level Security, Edge Functions), Recharts, Lucide React, YouTube Data API v3.

## Users

- **Primary Users:** College students, self-directed learners, and technical students learning through curated YouTube playlists.
- **Situation:** Users regularly discover high-quality learning playlists on YouTube, but suffer from course abandonment, lack of accountability, difficulty measuring real study hours, and absent milestone tracking.
- **Core Job:** Transform passive, unstructured YouTube playlist watching into an active, gamified, and measurable course completion journey with verified study time and peer accountability.

## Product Purpose

NexHack turns the educational video playlists people already use into structured learning courses that help them stay consistent, stay motivated, compete with peers, and finish what they started. Success means higher playlist completion rates, verified study habit formation, and transparent personal analytics.

## Positioning

"Turn the learning resources you already use into structured learning journeys that help you stay consistent and finish what you started." NexHack does not host original video content or attempt to act as an ungrounded AI tutor; it provides the structure, gamification, timer discipline, social groups, and verifiable proof-of-work that YouTube lacks natively.

## Operating Context

- Desktop and laptop web application used during active study sessions.
- Users study alongside embedded video lessons, run focused Pomodoro intervals, log notes, and review peer standing in group leaderboards.
- Sessions must withstand network interruptions, page reloads, and tab closure without losing in-flight timer progress or progress state.

## Capabilities and Constraints

### Capabilities (Version 1 Scope)
1. **Authentication:** Supabase Auth (Sign-up, Login, Logout, persistent session, protected routes, user profile initialization).
2. **YouTube Playlist Conversion:** URL validation, server-side YouTube Data API v3 metadata extraction (title, description, thumbnails, duration, ordering), course creation, embedded player, lesson status tracking, course completion percentage.
3. **Gamification Engine:** XP earned from lesson completion and validated study time; separate immutable `xp_transactions` ledger; level calculation; streak tracking; milestone badges.
4. **Dual-Mode Study Timer:** Manual (start, pause, resume, stop) and Pomodoro (configurable work/break intervals); page-refresh session recovery; course association; server-side session duration verification.
5. **Study Groups:** Public group discovery and joining; private group creation with unique invitation codes; member rosters; group activity feed; group leaderboards.
6. **Multiple Leaderboards:** XP, Study Time, and Lessons Completed rankings filtered across Weekly, Monthly, and Lifetime windows, with public and group-scoped views.
7. **User Profile:** Identity, enrolled courses, total study time, current level, streak counter, unlocked badges, group memberships.
8. **Insights Analytics:** Dedicated historical analytics page featuring daily/weekly/monthly study hours, lessons completed over time, XP progression chart, activity heatmaps, and past session logs backed by real database records.

### Explicit Scope Constraints (Excluded from V1)
- No AI tutor, chatbot, or LLM-generated summaries/quizzes.
- No flashcard generation or adaptive spaced-repetition algorithms.
- No quests, missions, or complex mini-games.
- No general-purpose social feed, direct messaging, or external social media broadcasting.

## Brand Commitments

- **Name:** NexHack
- **Track & Theme:** Education & Student Innovation ("Build for a Better Tomorrow")
- **Aesthetic Direction:** Focused, energetic, clean, academic yet motivating. High-contrast typography, restrained purposeful color (no noisy neon rainbow or generic AI-template gradients), uncluttered cards, clear hierarchical data visualization.

## Evidence on Hand

- Git repository initialized at `https://github.com/MKS137-del/NexHack.git` (commit `c8cb285`).
- ECC v2.2.3 project harness active in `.agents/` (122 rules, 71 agents, install state verified).
- Global Antigravity skills library active (320 skills including `impeccable`, `architect`, `code-reviewer`, `security-reviewer`, `tdd-guide`).

## Product Principles

1. **Grounded in Existing Habits:** Meet learners where they already are (YouTube) instead of trying to replace existing video ecosystems.
2. **Earned, Verifiable Progress:** Every XP point and leaderboard position is backed by an immutable transaction record and server verification; no client-spoofed rewards.
3. **Resilient Study Continuity:** Timers and active lessons survive reloads, browser crashes, and route changes without state loss.
4. **Data Honesty in Analytics:** Insights and leaderboards are derived from true relational history; never display synthetic or hardcoded fake statistics.
5. **Simplicity Over Bloat:** Focus on the core loop (Import -> Learn & Time -> Earn XP -> Track Progress -> Review Insights) without premature feature sprawl.

## Accessibility & Inclusion

- WCAG 2.1 AA minimum contrast ratios for all UI text and badges.
- Full keyboard accessibility for timer controls, lesson navigation, and modal dialogues.
- Semantic HTML and ARIA live regions for active study timer announcements and level-up notifications.
