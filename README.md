# Personal Recruiter

A personal job search tracker built with Next.js. Track applications through your entire pipeline, manage interviews, log contacts, set follow-up reminders, and stay on top of tasks — all in one place.

## Features

- **Application pipeline** — track jobs from `SAVED` through `APPLIED`, `SCREENING`, `TECHNICAL_INTERVIEW`, `TAKE_HOME`, `FINAL_INTERVIEW`, `OFFER`, `REJECTED`, or `WITHDRAWN`
- **Interviews** — log interview rounds with type, outcome, interviewer info, and notes
- **Notes** — attach free-form notes to any application
- **Tasks** — standalone or application-linked tasks with due dates; the workflow engine auto-creates follow-up tasks when you apply, complete an interview, or submit an assessment
- **Contacts** — build a contact book and link people to applications by role (recruiter, hiring manager, interviewer, referral, etc.)
- **Follow-ups (Call-ups)** — schedule and track outreach tied to contacts or applications
- **Dashboard** — at-a-glance stats, attention cards (due soon, next follow-up, missing next step), and an activity timeline
- **Archive** — soft-archive applications, tasks, and call-ups without losing history
- **Auth** — credential-based JWT sessions (email + password)

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.2.1 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript 5 |
| ORM | Prisma 6 with `@prisma/adapter-pg` |
| Database | PostgreSQL |
| Auth | NextAuth v5 (beta) — credentials provider, JWT strategy |
| Compiler | React Compiler (enabled via `reactCompiler: true`) |

## Prerequisites

- Node.js 20+
- PostgreSQL database (local or hosted, e.g. Neon, Supabase, Railway)
- `npm` or `pnpm` package manager

## Environment Variables

Create a `.env` file in the project root. All three variables are required.

```env
# Primary connection string used by the app at runtime
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Direct (non-pooled) connection used by Prisma Migrate
# For a local database this is identical to DATABASE_URL.
# For Neon or PgBouncer, use the direct connection URL here.
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Secret used to sign/verify NextAuth JWT tokens
# Generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-here"
```

> **Note:** `.env*` files are gitignored. Never commit credentials.

## Getting Started

### 1. Install dependencies

```bash
pnpm install
# or
npm install
```

### 2. Set up environment variables

Copy the example block above into a `.env` file and fill in your database credentials and a generated `AUTH_SECRET`.

### 3. Run database migrations

```bash
pnpm prisma migrate deploy
# or
npx prisma migrate deploy
```

This applies all migrations in `prisma/migrations/` to your database.

> For local development you can also use `prisma migrate dev` which creates new migrations interactively:
> ```bash
> pnpm prisma migrate dev
> ```

### 4. Generate the Prisma Client

Migrations above trigger client generation automatically. If you need to regenerate manually:

```bash
pnpm prisma generate
# or
npx prisma generate
```

### 5. Start the development server

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Register an account

Navigate to [http://localhost:3000/register](http://localhost:3000/register) to create your first user account. There is no seed script — registration is the entry point.

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start Next.js in development mode with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Start the production server (requires a prior `build`) |
| `pnpm lint` | Run ESLint |

## Database Schema Overview

```
User
 ├── JobApplication  (companyName, roleTitle, status, priority, workMode, salary, jobUrl, …)
 │    ├── Interview  (type, stageName, scheduledAt, outcome, …)
 │    ├── Note       (title, content)
 │    ├── Task       (title, dueDate, completed, archivedAt)
 │    ├── CallUp     (title, scheduledAt, status, contact?)
 │    └── ApplicationContact  → Contact (role: RECRUITER | HIRING_MANAGER | INTERVIEWER | …)
 ├── Contact        (fullName, email, phone, linkedinUrl, companyName, jobTitle)
 ├── Task           (standalone tasks not tied to an application)
 └── CallUp         (standalone follow-ups not tied to an application)
```

### Application statuses

`SAVED` → `APPLIED` → `SCREENING` → `TECHNICAL_INTERVIEW` → `TAKE_HOME` → `FINAL_INTERVIEW` → `OFFER` / `REJECTED` / `WITHDRAWN`

### Automatic workflow tasks

When an application moves to an eligible status, the app automatically creates a follow-up task:

- After applying → task due **3 weeks** from `appliedAt`
- After an interview → task due **2 weeks** from the interview date
- After an assessment submission (detected by note keywords) → task due **1 week** from submission

Only one auto-task per application is kept active at a time. It is updated or removed as the application progresses.

## Project Structure

```
src/
├── app/
│   ├── api/                    # Route handlers (REST endpoints)
│   │   ├── applications/       # CRUD + archive, duplicate, contacts, interviews, notes, tasks, call-ups
│   │   ├── call-ups/           # CRUD + duplicate
│   │   ├── contacts/           # CRUD + duplicate
│   │   ├── interviews/         # CRUD
│   │   ├── notes/              # CRUD
│   │   ├── tasks/              # CRUD + duplicate
│   │   ├── auth/               # NextAuth handler
│   │   └── register/           # User registration
│   ├── dashboard/              # Protected pages
│   │   ├── applications/       # List, detail, new, edit, archive
│   │   ├── call-ups/           # Follow-ups list
│   │   ├── tasks/              # Tasks list + archive
│   │   └── archive/            # Archived applications
│   ├── login/                  # Sign-in page
│   └── register/               # Sign-up page
├── components/
│   ├── applications/           # Application UI components
│   └── dashboard/              # Dashboard sections and widgets
├── lib/
│   ├── application-workflow.ts # Auto follow-up task logic
│   ├── prisma.ts               # Prisma client singleton
│   └── validations/            # Zod schemas for API input validation
├── auth.ts                     # NextAuth configuration
├── proxy.ts                    # Middleware: redirect unauthenticated /dashboard requests
└── types/
    └── next-auth.d.ts          # Session type augmentation
prisma/
├── schema.prisma               # Database schema
└── migrations/                 # SQL migration history
```

## Authentication

- Sessions are stored as signed JWTs (`strategy: "jwt"`)
- Passwords are hashed with bcrypt (salt rounds: 10)
- All `/dashboard/*` routes are protected by middleware (`src/proxy.ts`); unauthenticated requests are redirected to `/login`
- `AUTH_SECRET` must be set — NextAuth will refuse to start without it

## Deployment

The app is a standard Next.js application and can be deployed anywhere that supports Node.js.

**Vercel (recommended)**

1. Push to GitHub and import the repo in Vercel
2. Add `DATABASE_URL`, `DIRECT_URL`, and `AUTH_SECRET` as environment variables in the Vercel dashboard
3. Run `prisma migrate deploy` as a build step or manually after the first deploy

**Other platforms**

```bash
pnpm build
pnpm start
```

Make sure the three environment variables are available at runtime.

## Known Caveats

- **NextAuth v5 beta** — `next-auth@5.0.0-beta.30` is in use. The API is mostly stable but may have rough edges; check the [NextAuth v5 migration guide](https://authjs.dev/getting-started/migrating-to-v5) if you upgrade.
- **No email provider** — authentication is credentials-only. There is no password reset flow; if a user loses their password they must be updated directly in the database.
- **No test suite** — there are no automated tests in the current codebase.
- **React Compiler** — enabled via `reactCompiler: true` in `next.config.ts`. This requires the `babel-plugin-react-compiler` dev dependency and may surface issues if component code violates the Rules of React.
