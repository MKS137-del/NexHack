# Implementation Plan & Stage Acceptance Criteria — NexHack

**Project:** NexHack — Gamified Learning & Accountability Platform  
**Target:** Hackathon MVP (Version 1 Scope)  
**Methodology:** Vertical-Slice Development + Test-Driven Quality Gates  

---

## Stage Overview

| Stage | Focus Area | Status | Deliverables |
| :---: | :--- | :---: | :--- |
| **Stage 1** | Environment Audit & Design Init | **COMPLETE** | `docs/TOOLING_AUDIT.md`, `PRODUCT.md` |
| **Stage 2** | Architecture & Database Specification | **COMPLETE** | `docs/ARCHITECTURE.md`, `docs/DATA.md`, `docs/DECISIONS.md`, `docs/CONSTRAINTS.md`, `docs/ASSUMPTIONS.md` |
| **Stage 3** | App Foundation, Auth & Layout | *PENDING APPROVAL* | React + Vite scaffold, Tailwind, Routing, Supabase Auth, App Shell |
| **Stage 4** | YouTube Playlist Import & Course Player | *PLANNED* | Edge function, Course importer, Lesson navigation, Embedded player |
| **Stage 5** | Lesson Completion & Gamification | *PLANNED* | `xp_transactions`, Levels, Badges, Streaks, Reward deduplication |
| **Stage 6** | Study Timer & Session Tracking | *PLANNED* | Manual + Pomodoro timers, localStorage crash recovery, server validation |
| **Stage 7** | Groups & Social Leaderboards | *PLANNED* | Public/Private cohorts, Invite codes, Multi-metric Leaderboards |
| **Stage 8** | Insights Analytics & Profiles | *PLANNED* | Recharts historical analytics, Velocity trends, Activity calendars |
| **Stage 9** | End-to-End Testing & Visual Refinement | *PLANNED* | Security review, Impeccable critique, Whiteboard defense guide |

---

## Stage Details & Acceptance Criteria

### Stage 3: Application Foundation, Authentication, and Shared Layout
- **Objective:** Establish the clean frontend build pipeline, routing architecture, Supabase authentication state, and cohesive app layout.
- **Files Affected:**
  - `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`
  - `.gitignore`, `.env.example`, `index.html`
  - `src/App.jsx`, `src/main.jsx`, `src/index.css`
  - `src/lib/supabase.js`
  - `src/routes/AppRoutes.jsx`, `src/routes/ProtectedRoute.jsx`
  - `src/components/layout/Navbar.jsx`, `src/components/layout/Sidebar.jsx`, `src/components/layout/AppLayout.jsx`
  - `src/features/auth/pages/LoginPage.jsx`, `src/features/auth/pages/SignUpPage.jsx`, `src/features/auth/authService.js`
  - `src/features/dashboard/DashboardPage.jsx`
- **Dependencies:** `react`, `react-dom`, `react-router-dom`, `@supabase/supabase-js`, `lucide-react`, `tailwindcss`, `clsx`, `tailwind-merge`.
- **Expected Behavior:** User can register, log in, persist session across reloads, navigate between protected pages, and log out cleanly. Unauthenticated visitors are redirected to `/login`.
- **Acceptance Criteria:**
  - [ ] Vite dev server boots without warnings or errors.
  - [ ] Sign-up and login forms validate inputs (email format, password min-length).
  - [ ] Authenticated session persists in `localStorage` / Supabase auth cache.
  - [ ] Protected routes guard dashboard, courses, timer, groups, insights, and profile.
  - [ ] Responsive navigation bar and sidebar render consistently.
  - [ ] Dual-mode fallback operates seamlessly if Supabase credentials are not provided.

### Stage 4: YouTube Playlist Import and Course Management
- **Objective:** Convert YouTube playlist URLs into structured courses with lessons, metadata, and an embedded study player.
- **Files Affected:**
  - `supabase/functions/import-playlist/index.ts`
  - `src/features/courses/pages/CoursesPage.jsx`, `src/features/courses/pages/CoursePlayerPage.jsx`
  - `src/features/courses/components/ImportPlaylistModal.jsx`, `src/features/courses/components/CourseCard.jsx`, `src/features/courses/components/LessonList.jsx`
  - `src/features/courses/courseService.js`, `src/features/courses/youtubeService.js`
- **Expected Behavior:** User pastes a YouTube playlist URL (e.g. `https://www.youtube.com/playlist?list=PL...`). System validates the ID, fetches playlist title/thumbnail and ordered video lessons, persists to database, and presents the course player.
- **Acceptance Criteria:**
  - [ ] Regex extracts playlist ID from standard and shortened YouTube playlist URLs.
  - [ ] Malformed or invalid URLs show actionable user-facing error messages.
  - [ ] Duplicate imports of the same playlist reuse existing course records.
  - [ ] Course player embeds YouTube video with lesson progress checklist.
  - [ ] Course completion percentage updates dynamically.

### Stage 5: Lesson Tracking & Gamification Engine
- **Objective:** Reward learners with XP, streaks, levels, and badges when completing lessons, backed by an immutable transaction ledger.
- **Files Affected:**
  - `src/features/gamification/components/XPBadge.jsx`, `src/features/gamification/components/StreakDisplay.jsx`, `src/features/gamification/components/AchievementCard.jsx`, `src/features/gamification/components/LevelProgressBar.jsx`
  - `src/features/gamification/gamificationService.js`
  - `supabase/migrations/20261101_gamification_schema.sql`
- **Expected Behavior:** Marking a lesson complete issues +50 XP, records a row in `xp_transactions`, recalculates user level, and updates streak if active today.
- **Acceptance Criteria:**
  - [ ] Toggling a lesson as complete persists in `lesson_completions`.
  - [ ] Duplicate completion of the same lesson yields zero additional XP.
  - [ ] Level formula calculates consistently: `Level = floor(sqrt(XP / 100)) + 1`.
  - [ ] Unlocking a milestone (e.g. First Lesson, 100 XP) awards badge and triggers toast.
  - [ ] XP transactions table records exact reason, amount, user ID, and timestamp.

### Stage 6: Study Timer & Session Tracking
- **Objective:** Support focused learning intervals (Manual stopwatch + Pomodoro) with session crash recovery and server-verified study XP.
- **Files Affected:**
  - `src/features/timer/pages/TimerPage.jsx`
  - `src/features/timer/components/PomodoroTimer.jsx`, `src/features/timer/components/ManualTimer.jsx`, `src/features/timer/components/SessionSummaryModal.jsx`
  - `src/features/timer/timerService.js`
- **Expected Behavior:** User can run a 25/5 Pomodoro or a continuous stopwatch, associate it with an enrolled course, pause/resume, and survive browser reloads. On completion, records study duration and awards verified XP (10 XP per 10 minutes studied).
- **Acceptance Criteria:**
  - [ ] Timer accurately tracks elapsed time using wall-clock delta (`Date.now() - startTime`).
  - [ ] Refreshing the page during an active session resumes the timer without resetting.
  - [ ] Completed sessions insert into `study_sessions` and log study XP.
  - [ ] Arbitrary zero-duration submissions or negative durations are rejected.

### Stage 7: Groups and Social Leaderboards
- **Objective:** Enable peer accountability through public/private study groups and multi-metric rankings.
- **Files Affected:**
  - `src/features/groups/pages/GroupsPage.jsx`, `src/features/groups/pages/GroupDetailPage.jsx`
  - `src/features/groups/components/CreateGroupModal.jsx`, `src/features/groups/components/JoinGroupModal.jsx`, `src/features/groups/components/GroupCard.jsx`
  - `src/features/groups/groupService.js`
  - `src/features/leaderboard/pages/LeaderboardPage.jsx`
  - `src/features/leaderboard/components/LeaderboardTable.jsx`, `src/features/leaderboard/components/TimeframeFilter.jsx`
  - `src/features/leaderboard/leaderboardService.js`
- **Expected Behavior:** Users can browse public groups or create private groups with 6-char invite codes. Leaderboard displays ranks for XP, Study Time, and Lessons Completed across Weekly, Monthly, and Lifetime filters.
- **Acceptance Criteria:**
  - [ ] Private groups are inaccessible to non-members (RLS enforced).
  - [ ] Valid 6-character invite code joins user to private group.
  - [ ] Leaderboard calculations rank users accurately with tie-breaking rules.
  - [ ] Group detail page displays member roster and group-specific leaderboard.

### Stage 8: Insights Analytics & User Profiles
- **Objective:** Provide visual proof-of-work with historical analytics and student profiles.
- **Files Affected:**
  - `src/features/insights/pages/InsightsPage.jsx`
  - `src/features/insights/components/StudyTimeChart.jsx`, `src/features/insights/components/XPProgressionChart.jsx`, `src/features/insights/components/ActivityCalendar.jsx`, `src/features/insights/components/RecentSessionsList.jsx`
  - `src/features/insights/insightsService.js`
  - `src/features/profile/pages/ProfilePage.jsx`, `src/features/profile/profileService.js`
- **Expected Behavior:** Insights page renders daily/weekly study duration bar charts, XP timeline area chart, completion velocity, and raw historical session logs from real relational records.
- **Acceptance Criteria:**
  - [ ] Recharts visualizations render without console errors.
  - [ ] Charts compute true aggregates from `study_sessions` and `xp_transactions`.
  - [ ] Empty state renders cleanly for newly registered users.
  - [ ] Profile page showcases user badges, stats, enrolled courses, and memberships.

### Stage 9: Integration, Security Review, Testing & Polish
- **Objective:** Complete end-to-end user journeys, perform automated security review, run Impeccable design audit, and author Whiteboard Defense documentation.
- **Files Affected:**
  - `docs/TESTING.md`, `docs/defense/DEFENSE.md`
  - `README.md` (comprehensive setup, tech stack, and demonstration guide)
- **Expected Behavior:** The application operates seamlessly as a unified product with zero console errors, full keyboard accessibility, resilient error handling, and complete technical defence documentation.
- **Acceptance Criteria:**
  - [ ] Complete E2E flow verified: Register -> Import Playlist -> Start Pomodoro -> Complete Lesson -> Earn XP & Level Up -> Join Group -> View Rank on Leaderboard -> Inspect Insights.
  - [ ] Automated security review passes (RLS verified, no hardcoded secrets, input sanitization).
  - [ ] Impeccable design audit passes without accessibility violations.
  - [ ] Whiteboard Defense (`docs/defense/DEFENSE.md`) answers all 12 core evaluative questions.
