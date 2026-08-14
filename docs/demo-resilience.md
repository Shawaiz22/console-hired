# Demo Resilience & Warm-Up Checklist

This document details critical procedures to prevent live presentation failures and rate-limiting issues during the demo presentation.

---

## 1. Database Warm-Up (Neon Postgres Mitigation)

- **Problem**: Neon serverless Postgres auto-suspends after ~5 minutes of idle time. The cold start query latency takes several seconds.
- **Mitigation Protocol**:
  1. Exactly **2 minutes before going on stage**, navigate to the live deployed URL (e.g. `https://consolehired.dev`) and log into the demo account (`demo@consolehired.dev`).
  2. Load the `/dashboard` page to trigger database query execution and wake up the Neon compute instance.
  3. Keep the tab open.

---

## 2. Backup Demo Recording

- **Backup Asset**: Screen recording of full user journey under 3 minutes (`docs/demo-backup.mp4` / unlisted link).
- **Journey Covered**:
  1. Resume Upload (`Rehan_Khan_FullStack_Resume.pdf`)
  2. Resume Analysis & Score Ring / Evidence Checklist visualization
  3. AI Mock Interview session creation & answer grading with STAR feedback
  4. Real Dashboard score trend line chart showing dated history
- **Fallback Plan**: If conference Wi-Fi fails or Gemini / Groq API rate limits (HTTP 429) trip during the live presentation, immediately switch to playing the pre-recorded video while continuing oral commentary.

---

## 3. Git Identity Verification

- **Canonical Mapping**: Verified in `.mailmap`.
- **Abu's Identity**: `Abu Quatada <abuquatada84@gmail.com>` (`158571004+abuquatada@users.noreply.github.com`)
