
<p align="center">
  <strong>JOB ODYSSEY</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-In%20Development-yellow" />
  <img src="https://img.shields.io/badge/React-blue" />
  <img src="https://img.shields.io/badge/Vite-purple" />
  <img src="https://img.shields.io/badge/Supabase-green" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC" />
</p>

# Job Odyssey

**A personal recruitment CRM with built-in CV link tracking — know when recruiters actually open your resume.**

Job Odyssey is a web application for managing job applications like a lightweight CRM. It tracks application statuses, interviews, CV versions, and recruitment questions — with a unique feature: trackable links embedded in your CV that reveal when and what a recruiter clicked.

Built for personal use during a job search, now being developed into a multi-user web app.

---

## 🚀 Status & Demo

**Status:** In active development (personal use + invited testers)

---

## ✨ Core Features

- Job application tracking with full status flow: Saved → Sent → **CV Viewed** → Interview → Pending → ...
- **CV link tracking** — generate unique tracked URLs per application (LinkedIn, GitHub, custom links)
- Automatic status change to "CV Viewed" when a recruiter clicks any link in your CV
- Notification bell with real-time click alerts (polls every 30s)
- Click history and per-link checklist per application
- Default links profile (save your LinkedIn, GitHub, projects once — auto-filled everywhere)
- CV database with file upload (PDF, DOC, DOCX) and ATS keyword tagging
- Interview scheduling with post-interview notes (what went well / wrong)
- Recruitment questions database with categories and difficulty levels
- STAR stories with effectiveness ratings and skill tags
- Dashboard with response rate, active applications, and interview charts
- Kanban board with drag-and-drop
- Dark UI with sharp, focused design

---

## 🛠 Tech Stack

- React 19
- Vite
- Tailwind CSS 4
- Supabase (Postgres, Auth, Storage, Edge Functions)
- Netlify (hosting)

---

## 🎯 Project Highlights

- Unique CV tracking concept — no other job tracker does this
- Real-world use case built during an active job search
- Supabase Edge Function as a public redirect tracker (no backend server needed)
- Per-user data isolation via Supabase Row Level Security
- Multi-user ready architecture from day one
- Solo project — design, product thinking, and full-stack implementation

---

## ⚙️ Setup

### 1. Supabase

Create a project at [supabase.com](https://supabase.com), then run the schema:

```
supabase/schema.sql
```

Paste into Supabase Dashboard → SQL Editor → Run.

### 2. Environment variables

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Deploy Edge Function

```bash
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy track --no-verify-jwt
```

### 4. Run locally

```bash
npm install
npm run dev
```

### 5. Deploy to Netlify

Connect your GitHub repo. Build settings:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Environment variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

---

## 👤 Author

Created by Łukasz Nowak  
GitHub: https://github.com/enowuigrek

---

## 📄 License

Personal project — source shared for portfolio purposes only
