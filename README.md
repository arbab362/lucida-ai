# Lucida — AI Image Analyzer & Visual Intelligence Platform

Turn images into answers. Upload an image, describe what you want to know, and get
a structured, request-specific analysis back in seconds — powered by Claude's
vision model through a secure backend.

This is a real Next.js 14 (App Router) application: real authentication, a real
Postgres-backed database, and a real server-side call to Claude's vision API for
every analysis. Nothing in the analysis flow is simulated.

---

## 1. File / folder structure

```
lucida/
├── package.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── .env.example
├── prisma/
│   └── schema.prisma          # User, Account, Session, Analysis, Message models
└── src/
    ├── middleware.ts          # Protects /workspace and /settings server-side
    ├── types/
    │   ├── index.ts           # Shared DTOs
    │   └── next-auth.d.ts     # Session type augmentation
    ├── lib/
    │   ├── prisma.ts          # Prisma client singleton
    │   ├── auth.ts            # NextAuth config (credentials + optional Google)
    │   ├── anthropic.ts       # Claude vision call + system prompt + titling
    │   ├── mailer.ts          # SMTP mailer with console fallback for dev
    │   ├── rate-limit.ts      # In-memory rate limiter
    │   └── cn.ts              # className helper
    ├── components/
    │   ├── Providers.tsx      # SessionProvider + theme context + toasts
    │   ├── Navbar.tsx
    │   ├── UploadZone.tsx     # Hero drag/drop/paste/camera upload
    │   ├── Sidebar.tsx        # History, search, rename, favorite, delete
    │   ├── ChatMessage.tsx    # Markdown rendering + copy/share/regenerate
    │   └── AnalyzingIndicator.tsx
    └── app/
        ├── layout.tsx
        ├── globals.css
        ├── page.tsx                       # Landing page
        ├── login/page.tsx
        ├── signup/page.tsx                # Signup → welcome → onboarding
        ├── forgot-password/page.tsx
        ├── reset-password/[token]/page.tsx
        ├── workspace/page.tsx             # Main AI chat workspace
        ├── settings/page.tsx              # Profile/Appearance/Security/Account/...
        └── api/
            ├── auth/[...nextauth]/route.ts
            ├── signup/route.ts
            ├── forgot-password/route.ts
            ├── reset-password/route.ts
            ├── change-password/route.ts
            ├── analyze/route.ts           # Core vision analysis endpoint
            ├── history/route.ts           # List + bulk clear
            ├── history/[id]/route.ts      # Get/rename/favorite/delete one
            ├── profile/route.ts
            ├── account/route.ts           # Delete account
            └── export/route.ts            # Download all account data as JSON
```

---

## 2. How the image-analysis flow actually works

1. The browser converts the uploaded image to a base64 data URL client-side (or
   reads it from `sessionStorage` if it was dropped on the landing page before
   sign-in) and POSTs it to `POST /api/analyze` together with the user's prompt.
2. The API route (`src/app/api/analyze/route.ts`) runs entirely server-side:
   - Confirms the user is signed in (`getServerSession`).
   - Validates file type (JPG/PNG/WEBP/GIF) and size (≤ 8MB).
   - Rate-limits by user id.
   - On a first message, creates an `Analysis` row and stores the image.
   - On a follow-up message, loads prior `Message` rows for that `Analysis` as
     conversation history.
   - Calls `analyzeImage()` in `src/lib/anthropic.ts`, which sends the image
     (only on the first turn) plus the full prior text history to
     `claude-sonnet-4-6` via the official `@anthropic-ai/sdk`, using a system
     prompt that forces the model to answer the user's *specific* request
     (find mistakes / extract text / identify a product / translate / etc.)
     instead of a generic caption, and to say plainly when something can't be
     determined from the image.
   - Persists both the user prompt and the assistant's answer as `Message` rows,
     and generates a short conversation title from the first prompt.
3. The response (answer text, analysis id, title) goes back to the client, which
   renders it as markdown with copy/share/regenerate actions and appends it to
   the chat.
4. The sidebar's history list, search, rename, favorite, and delete all read and
   write the same `Analysis`/`Message` tables through `/api/history`.

The Anthropic API key is read from `process.env.ANTHROPIC_API_KEY` **only**
inside server-side route handlers — it is never sent to or bundled into
client-side JavaScript.

---

## 3. Setup instructions (local development)

**Requirements:** Node.js 18.18+, a Postgres database (local or hosted), and an
Anthropic API key.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# then fill in DATABASE_URL, NEXTAUTH_SECRET, and ANTHROPIC_API_KEY at minimum

# 3. Generate a NextAuth secret
openssl rand -base64 32

# 4. Push the Prisma schema to your database
npx prisma db push

# 5. Run the dev server
npm run dev
```

Visit `http://localhost:3000`.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `NEXTAUTH_URL` | Yes | Base URL of the app (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | Session signing secret |
| `ANTHROPIC_API_KEY` | Yes | Server-side key for the vision analysis calls |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Enables "Continue with Google" |
| `NEXT_PUBLIC_GOOGLE_ENABLED` | No | Set to `"true"` once the two Google values above are filled in |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | No | Sends real password-reset emails. Without these, reset links are logged to the server console so the flow still works in development |

### Local testing checklist

- Sign up with email/password → you should land on the welcome screen, then the
  onboarding focus picker, then the empty workspace.
- Drop or paste an image into the landing page hero while signed out → after
  logging in you should land in the workspace with that image already loaded.
- Ask a quick action (e.g. "Extract all text") → a real Claude response should
  stream back within a few seconds; check the server logs if `ANTHROPIC_API_KEY`
  is missing, since the route returns a 503 with a friendly error in that case.
- Ask a follow-up question about the same image → it should answer using the
  existing image context, not ask you to re-upload.
- Rename, favorite, and delete an analysis from the sidebar.
- Visit `/settings` → change your name/focus tags, switch theme, change
  password, download your data export, and (carefully) test account deletion.
- Log out and request a password reset — with no SMTP configured, watch the
  terminal for the "Would send to…" log line containing the reset link.

---

## 4. Deployment instructions

**Recommended stack:** Vercel (frontend + API routes) + a managed Postgres
provider (Neon, Supabase, or Railway all work well with Prisma).

1. Push this project to a Git repository.
2. Create a Postgres database with your chosen provider and copy its connection
   string.
3. Import the repository into Vercel.
4. In the Vercel project's Environment Variables, set everything from the table
   above (`DATABASE_URL`, `NEXTAUTH_URL` = your production domain,
   `NEXTAUTH_SECRET`, `ANTHROPIC_API_KEY`, and optionally the Google/SMTP vars).
5. Set the build command to `npm run build` (already wired to run
   `prisma generate` first) and run `npx prisma db push` once against the
   production database (locally with `DATABASE_URL` pointed at production, or
   via a one-off Vercel deploy hook/CLI command) to create the tables.
6. Deploy. Vercel will build and serve both the frontend and the `/api/*`
   route handlers — there is no separate backend service to stand up.

If you outgrow serverless function limits for image size/latency, the same
`src/app/api` routes can be lifted into any Node host (Render, Fly.io, a plain
Docker container) without changes, since they don't depend on any Vercel-only
API.

---

## 5. Features that still require an external service to fully work

- **Anthropic API key** — required for any real analysis; without it
  `/api/analyze` returns a clear 503 rather than pretending to work.
- **Postgres database** — required for accounts, sessions, and history.
- **Google Sign-In** — optional; needs a Google Cloud OAuth client (client ID
  + secret) to appear.
- **Outgoing email (SMTP)** — optional; needed for password-reset emails to
  actually reach users. Any standard SMTP provider (Postmark, Resend, SES,
  Gmail app password, etc.) works — just fill in the `SMTP_*` variables.
- **Object storage (S3/Cloudinary/etc.)** — not required to run: images are
  currently stored inline as base64 in the `Analysis.imageUrl` column, which
  keeps the whole app deployable with zero extra infrastructure. For heavy
  production usage you'll want to swap this for real blob storage — upload the
  file to S3/Cloudinary from `/api/analyze` and store the resulting URL instead
  of the base64 string — to keep the database small and page loads fast.
- **Push/email notifications** — not built. The Settings → Notifications tab
  says so honestly rather than showing toggles that don't do anything.

Everything else — signup, login, password reset, image upload (drag/drop/
paste/camera), the vision analysis itself, conversation history, search,
rename/favorite/delete, settings, theming, and data export/deletion — is fully
implemented and works end-to-end once the required environment variables above
are set.
