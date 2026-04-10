# MindHaven

MindHaven is a modern mental health support platform that connects patients with therapists through secure chat and calling, while also providing AI-assisted support and an admin workspace.

## Features

- Patient experience:
  - Profile completion gating before accessing protected patient features
  - AI support chat
  - Therapist connection requests and direct messaging
  - Questions and answers workflow
  - Ratings and reviews
- Therapist experience:
  - Therapist dashboard
  - Patient conversation management
  - Profile management
- Admin experience:
  - User and therapist management
  - FAQ and article management
  - Platform overview analytics
- Real-time signaling:
  - Socket.io server for call signaling and live interactions
- Data backend:
  - Supabase authentication and database

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend (signaling/admin endpoints): Node.js, Express, Socket.io
- Database/Auth: Supabase
- Charts/visuals: Chart.js, react-chartjs-2

## Project Structure

- `src/` frontend app
  - `pages/` route pages (patient, admin, doctor)
  - `components/` shared UI and route guards
  - `lib/` Supabase/auth/AI utilities
- `server/server.js` Node signaling server and admin endpoints
- `supabase/migrations/` SQL schema migrations
- `.env.example` environment template

## Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project

## Environment Variables

Create a root `.env` file based on `.env.example`:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Optional frontend variables used in the app:

```env
VITE_SOCKET_SERVER_URL=http://localhost:5000
VITE_GEMINI_API_KEY=
VITE_SERPAPI_KEY=
```

Notes:

- `VITE_*` variables are exposed to the browser build.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to the client.

## Installation

```bash
npm install
```

## Run Locally

Run frontend and server in separate terminals.

Terminal 1 (frontend):

```bash
npm run dev
```

Terminal 2 (server):

```bash
npm run server
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Server: `http://localhost:5000` (if configured as such in your runtime)

## Build

```bash
npm run build
npm run preview
```

## Supabase Setup

Apply migrations from `supabase/migrations` to your Supabase project.

This app expects these main tables:

- `admins`
- `doctors`
- `user_profiles`
- `doctor_patient_connections`
- `doctor_patient_chats`
- `reviews`
- `questions`
- `ai_chats`
- `health_articles`
- `chat_history`
- `ai_question_counter`

A setup guide is available in `SUPABASE_SETUP.md`.

## Routing Overview

Public:

- `/`
- `/about`
- `/faqs`
- `/login`
- `/patient-login`
- `/privacy-policy`
- `/terms-of-service`
- `/reset-password`

Protected:

- Patient: `/profile`, `/chat`
- Admin: `/admin/*`
- Doctor: `/doctor/*`

## Security Notes

- Keep secrets in `.env` only.
- Do not commit real API keys or service role keys.
- Ensure `.gitignore` excludes local secret files.

## Scripts

From `package.json`:

- `npm run dev` start Vite dev server
- `npm run server` start Node server
- `npm run build` production build
- `npm run preview` preview production build
- `npm run lint` run ESLint

## Deployment Notes

- Configure all required environment variables in your hosting platform.
- Deploy the frontend and the Node signaling server with matching CORS/socket settings.
- Update allowed origins in `server/server.js` for production domains.

For detailed Render deployment (recommended for Node/Socket.io servers), see [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md).

## License

No license file is currently included in this repository.
