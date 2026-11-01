# System Architecture & Technical Design — NexHack

**Project:** NexHack — Gamified Learning & Accountability Platform  
**Target:** Hackathon MVP (Version 1)  
**Status:** Approved Baseline Architecture  
**Author:** Lead Software Architect  

---

## 1. System Overview & Architecture Diagram

NexHack is a decoupled, modern web application designed for learning accountability. It bridges external educational video content (YouTube playlists) with an internal relational persistence and gamification engine hosted on Supabase (PostgreSQL, Row Level Security, Auth, and Edge Functions).

```mermaid
flowchart TD
    subgraph Client ["Frontend Client (React + Vite + Tailwind)"]
        UI["UI Layer (Components & Pages)"]
        State["Client State & Routing (React Router)"]
        Services["Feature Service Layer (auth, courses, timer, etc.)"]
        ClientLib["Supabase JS Client (@supabase/supabase-js)"]
        
        UI --> State
        State --> Services
        Services --> ClientLib
    end

    subgraph Supabase ["Supabase Backend Infrastructure"]
        Auth["Supabase Authentication (JWT)"]
        DB[(PostgreSQL Database + RLS)]
        Edge["Edge Functions (Deno Runtime)"]
        
        ClientLib -->|Sign-up / Login| Auth
        ClientLib -->|Direct Queries with RLS| DB
        ClientLib -->|Secure Server-Side Calls| Edge
    end

    subgraph External ["External Third-Party APIs"]
        YT["YouTube Data API v3 (Playlist & Video Metadata)"]
        YTIframe["YouTube IFrame Player API (Video Streaming)"]
        
        Edge -->|Secure Server-to-Server with API Key| YT
        UI -->|Embedded Client-Side Video Playback| YTIframe
    end
```

---

## 2. Core Architecture Layers

### 2.1 Presentation & Feature Layer (`src/features/`)
The frontend follows a strictly modular, feature-based architecture to avoid monolith bloat (`App.jsx` remaining purely routing/context scaffolding). Each feature encapsulates its own pages, UI components, and business service:

- **`features/auth/`**: Authentication state management, ProtectedRoute guard, login/sign-up forms.
- **`features/dashboard/`**: High-level learning command center aggregating active courses, quick timer launcher, daily streak, and recent activity.
- **`features/courses/`**: Playlist URL importer modal, course catalog, course player (lesson list, progress bar, embedded player), lesson completion toggle.
- **`features/timer/`**: Dual-mode study timer (Manual stopwatch + Pomodoro), background duration calculation, refresh/crash recovery from `localStorage`, course-tagging, session completion submission.
- **`features/gamification/`**: User level badge, XP progress bar, streak flames, achievement showcase modal.
- **`features/groups/`**: Public group browse/search, private group creation with unique 6-character invite code generation, member roster, group-scoped leaderboards.
- **`features/leaderboard/`**: Tri-metric ranking views (XP, Study Time, Lessons Completed) filtered by timeframe (Weekly, Monthly, Lifetime), with global and group scopes.
- **`features/insights/`**: Comprehensive analytics dashboard (study hours by date, lesson velocity, XP timeline, Recharts visualizations).
- **`features/profile/`**: User account overview, lifetime achievements, enrolled courses, total study time.

### 2.2 Data Access & Service Layer (`src/lib/` & `*Service.js`)
- **`src/lib/supabase.js`**: Initializes the singleton Supabase client using environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
- **Feature Services (`authService.js`, `courseService.js`, etc.)**: Encapsulate all database queries, remote RPC calls, and Edge Function requests. UI components NEVER execute raw database queries directly.
- **Graceful Mock Fallback Mode**: When Supabase credentials are not yet configured or when developing offline, services seamlessly fall back to deterministic local mock storage (`localStorage` fixtures) so development, UI review, and layout testing remain unblocked.

### 2.3 Backend & Infrastructure Layer (`supabase/`)
- **Supabase Authentication**: Manages user identity, password hashing, and issuance of cryptographically signed JWTs.
- **PostgreSQL Database**: Relational schema enforcing referential integrity (foreign keys, cascading deletes, unique constraints).
- **Row Level Security (RLS)**: PostgreSQL-level access control policies ensuring users can only read/write their own records, and private groups are only visible to confirmed members.
- **Edge Functions (`supabase/functions/`)**:
  - `import-playlist`: Server-side YouTube API proxy that extracts playlist title, thumbnails, video IDs, titles, and durations using the securely stored `YOUTUBE_API_KEY`.
  - `award-xp`: Server-verified XP transaction issuer that prevents duplicate lesson rewards and validates session time bounds before writing to `xp_transactions`.

---

## 3. Request & Data Flows

### 3.1 Course Import Flow
```mermaid
sequenceDiagram
    actor User
    participant Frontend as Course Import Modal
    participant Edge as Edge Function (import-playlist)
    participant YouTube as YouTube Data API v3
    participant DB as PostgreSQL Database

    User->>Frontend: Pastes YouTube playlist URL
    Frontend->>Frontend: Validates URL pattern & extracts Playlist ID
    Frontend->>Edge: POST /import-playlist { playlistId } (with User JWT)
    Edge->>Edge: Validates authenticated user session
    Edge->>YouTube: GET /playlists?id=... & /playlistItems?playlistId=...
    YouTube-->>Edge: Returns playlist & video metadata
    Edge->>DB: INSERT INTO courses & INSERT INTO lessons (batch)
    DB-->>Edge: Confirmed rows
    Edge-->>Frontend: Returns new course structure
    Frontend-->>User: Displays course player ready for study
```

### 3.2 Verified Study Session & XP Award Flow
```mermaid
sequenceDiagram
    actor User
    participant Timer as Timer Component
    participant Local as localStorage (Recovery Cache)
    participant Edge as Edge Function (process-study-session)
    participant DB as PostgreSQL Database

    User->>Timer: Starts Pomodoro / Manual Session
    Timer->>Local: Persists { sessionStart: timestamp, courseId, mode }
    Note over User,Timer: User studies (page reloads safely read Local)
    User->>Timer: Completes / Stops Session
    Timer->>Edge: POST /process-study-session { startTime, endTime, courseId, mode }
    Edge->>Edge: Verifies: duration == (endTime - startTime) within drift tolerance
    Edge->>DB: INSERT INTO study_sessions
    Edge->>DB: INSERT INTO xp_transactions (reason: 'study_time', xp: calculated)
    Edge->>DB: UPDATE profiles (xp = xp + awarded, total_study_time = ...)
    DB-->>Edge: Updated user profile
    Edge-->>Timer: Confirms session & returns awarded XP
    Timer-->>User: Displays XP celebration & level-up banner
```

---

## 4. Key Design Patterns Applied

1. **Repository / Service Pattern**: All data communication is isolated behind service abstractions (`authService`, `courseService`, `timerService`), ensuring UI components remain pure and decoupled from data storage implementation details.
2. **Immutable Transaction Ledger**: Gamification XP is never updated via arbitrary in-place increment queries. Every XP point is an individual row in `xp_transactions`, allowing aggregate reconstruction and auditability.
3. **Session Recovery Pattern**: Study timers store absolute wall-clock start timestamps in browser `localStorage`. Elapsed time is computed as `Math.floor((Date.now() - startTime) / 1000)` rather than relying on unreliable `setInterval` ticks.
4. **Least Privilege & Zero-Trust Client**: Client submissions of XP amounts or direct role modifications are rejected. Calculations are verified server-side.
