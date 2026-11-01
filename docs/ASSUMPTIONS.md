# Technical Assumptions & Open Questions — NexHack

**Project:** NexHack — Version 1  
**Tracking Standard:** Explicit Classification (Verified, Unverified, Incorrect, Accepted Limitation)  

---

## 1. Tracked Assumptions

| ID | Assumption Description | Classification | Evidence / Basis |
| :---: | :--- | :---: | :--- |
| **ASM-001** | Development runtime on Windows supports Node.js 24 and npm 11. | **VERIFIED** | Audited: `node v24.22.1` and `npm 11.19.1` functional in workspace. |
| **ASM-002** | Git repository is correctly configured and authenticated to remote origin. | **VERIFIED** | Audited: Git branch `main` tracks `https://github.com/MKS137-del/NexHack.git` (authenticated via `git ls-remote`). |
| **ASM-003** | Impeccable skill and CLI engine are operational on Windows. | **VERIFIED** | Audited: Impeccable engine `0.1.18` installed; `PRODUCT.md` created; context resolved cleanly. |
| **ASM-004** | User will configure Supabase project credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) before production deployment. | **UNVERIFIED** | No credentials yet in `.env`. Application must provide mock local fallback mode during initial build. |
| **ASM-005** | YouTube Data API v3 key will be provisioned by the user in Supabase Edge Function secrets. | **UNVERIFIED** | Edge function placeholder and mock YouTube response fixtures will be provided for offline testing. |
| **ASM-006** | Local Supabase CLI binary is present in global PATH. | **INCORRECT** | Audited: `supabase` command is not in system PATH. Development will use Supabase JS client and cloud project connection instead of local Dockerized Supabase daemon. |
| **ASM-007** | YouTube playlists may contain unlisted, private, or region-restricted videos. | **ACCEPTED LIMITATION** | The YouTube API returns metadata only for publicly viewable or unlisted videos accessible with the API key. Private videos within a playlist will be flagged as inaccessible. |
| **ASM-008** | YouTube IFrame Player allows embedded video playback within custom domain. | **VERIFIED** | YouTube standard embed terms permit iframe playback unless a video uploader explicitly disables embedding. |
| **ASM-009** | Backgrounded browser tabs throttle JavaScript timers (`setInterval`). | **ACCEPTED LIMITATION** | Mitigated by storing absolute wall-clock start timestamps (`sessionStart`) in `localStorage` and calculating elapsed time from delta. |

---

## 2. Open Technical Questions for User Alignment

1. **Supabase Setup Mode:** Will you connect a hosted cloud Supabase project (providing URL and Anon key), or do you want the frontend to run entirely against our local mock storage layer until you are ready to link the database?
2. **YouTube API Quota Allowance:** In case a YouTube API key is not immediately available, is the provided curated mock playlist fixture library (e.g., CS50, Full-Stack Web Development, Data Structures) sufficient for hackathon demonstration?
3. **Group Privacy Model:** Should joining a private group only require knowing the 6-character invitation code, or should it also require manual admin approval by the group creator? *(Defaulted to invite-code access for frictionless hackathon usability)*.
