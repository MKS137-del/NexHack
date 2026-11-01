# Engineering Constraints & Threat Model — NexHack

**Scope:** Version 1 Hackathon Application  
**Security Posture:** Zero-Trust Client / Defense-in-Depth via PostgreSQL RLS & Edge Functions  

---

## 1. Technical & Architectural Constraints

1. **Client Trust Boundary:** The frontend browser environment is untrusted. No critical business logic (XP calculation, permission checks, leaderboard rankings, study duration validation) relies solely on client state.
2. **Credential Confidentiality:** No secret keys (YouTube API key, Supabase service-role key, database connection strings) are ever placed in frontend source code or prefixed with `VITE_`.
3. **Immutability & Data Integrity:** XP and study history must be recorded in immutable, append-only logs (`xp_transactions`, `study_sessions`). Aggregated totals are strictly derived or synchronized with transactions.
4. **Offline / Unconfigured Graceful Degradation:** The application must remain navigable and testable in local mock mode if external API keys or Supabase credentials are not yet supplied by the user.
5. **Scope Guardrails:** Version 1 strictly excludes AI tutors, flashcards, automated chatbots, and complex mini-games to preserve build quality and focus.

---

## 2. Threat Analysis & Abuse Mitigations

### 2.1 Threat: Direct Client-Side XP Spoofing
- **Actor:** Authenticated user inspecting network requests or browser console.
- **Entry Point:** Attempting to update `profiles.xp` directly via client-side Supabase query or submitting arbitrary values to an XP endpoint.
- **Impact:** Unfair leaderboard dominance, ruined competitive integrity.
- **Mitigation:** 
  1. RLS policies on `profiles` disallow direct client updates to the `xp` and `level` columns.
  2. XP transactions are written exclusively via server-side database functions or authenticated Edge Functions that calculate XP from verified events (lesson completion or validated session duration).

### 2.2 Threat: Duplicate Lesson Completion Farming
- **Actor:** User repeatedly toggling a lesson as complete to farm infinite XP.
- **Entry Point:** Repeated calls to complete a single lesson.
- **Impact:** Infinite XP exploitation.
- **Mitigation:**
  1. Relational unique constraint `UNIQUE(user_id, lesson_id)` on `lesson_completions`.
  2. Database function or transaction checks `EXISTS (SELECT 1 FROM lesson_completions WHERE user_id = ... AND lesson_id = ...)` before issuing XP. If already completed, returns `already_rewarded` with zero additional XP.

### 2.3 Threat: Study Timer Duration Falsification
- **Actor:** User modifying client JavaScript or forging an API payload claiming 10 hours of study in 2 minutes.
- **Entry Point:** Submitting fake `duration_seconds` to the session completion endpoint.
- **Impact:** Artificially inflated study-time leaderboard rankings and unwarranted XP.
- **Mitigation:**
  1. Submissions must provide `start_time` and `end_time`.
  2. Edge function / database validation verifies `(end_time - start_time) == duration_seconds` within reasonable network clock drift.
  3. Single session duration is capped at a maximum threshold (e.g., 3 hours for continuous manual session; 60 minutes for Pomodoro work interval).
  4. Daily study time XP awards are capped at a sensible daily maximum (e.g., 500 XP/day).

### 2.4 Threat: Private Group Data Exposure
- **Actor:** Non-member discovering private group metadata, member roster, or discussion.
- **Entry Point:** Direct query to `groups` or `group_members` using a known group UUID.
- **Impact:** Breach of private study cohort confidentiality.
- **Mitigation:**
  1. Strict PostgreSQL RLS on `groups`:
     ```sql
     CREATE POLICY select_groups ON groups
     FOR SELECT USING (
         is_private = FALSE 
         OR id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
     );
     ```
  2. Joining a private group requires presenting a valid 6-character `invite_code` verified server-side.

### 2.5 Threat: YouTube Data API Key Leakage & Quota Exhaustion
- **Actor:** Public crawler or malicious visitor exhausting project quota.
- **Entry Point:** Inspecting browser bundle for API credentials, or spamming playlist import requests.
- **Impact:** Financial charge, Google account suspension, service outage.
- **Mitigation:**
  1. YouTube API key stored solely in Supabase Edge Function environment (`YOUTUBE_API_KEY`), never exposed to frontend.
  2. Edge function checks for existing course imports by `youtube_playlist_id`. If the playlist was already imported, it reuses existing course rows without re-fetching from YouTube, saving quota.
  3. Rate-limiting applied per authenticated user.
