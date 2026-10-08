This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Backend API

The backend exposes a single active homework timer and a list of completed tasks.
All responses are JSON and are marked `Cache-Control: no-store`.

### Timer

- `GET /api/timer` returns `{ "timer": ... }`, or `null` when no timer is active.
- `POST /api/timer/start` starts a timer. Send a JSON body with a title and duration in seconds.
- `POST /api/timer/pause` pauses the active timer.
- `POST /api/timer/resume` resumes a paused timer.
- `POST /api/timer/stop` stops the active timer and adds it to completed task history.
- `DELETE /api/timer` cancels an active timer without adding it to task history.

For example, the frontend can start, pause, resume, and stop a timer with separate API calls:

```js
const startResponse = await fetch("/api/timer/start", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "Read chapter 3",
    durationSeconds: 1500,
  }),
});
const { timer } = await startResponse.json();

await fetch("/api/timer/pause", { method: "POST" });
await fetch("/api/timer/resume", { method: "POST" });

const finishResponse = await fetch("/api/timer/stop", { method: "POST" });
const { timer: activeTimer } = await finishResponse.json();
```

Titles must contain 1-160 characters; durations must be whole seconds from 1 to
86400. A second timer cannot be started while one is active (`409 Conflict`).
Timer responses include an `id`, `title`, `durationSeconds`, `remainingSeconds`,
`status`, `startedAt`, and `endsAt`. `endsAt` is `null` while paused. Timers are
completed and added to task history when they expire or are stopped.

### Completed tasks

- `GET /api/tasks` returns `{ "tasks": [...] }`, newest completion first.
- Each task includes `id`, `title`, `durationSeconds`, `startedAt`, `completedAt`,
  and `completionReason` (`"timer"` or `"manual"`).

### Frontend task API

The task endpoints below use the Supabase `tasks` table and match the frontend's
create/list/start/end/delete request shapes:

- `POST /api/create-task` with `{ "title": "...", "description": "..." }` creates
  an idle task and returns the task object.
- `GET /api/get-task` returns an array of tasks, newest first.
- `POST /api/start-timer` with `{ "id": "..." }` sets `start_time` and status
  `running`, then returns the updated task.
- `POST /api/end-timer` with `{ "id": "..." }` sets `end_time` and status
  `completed`, then returns the updated task.
- `DELETE /api/delete-task` with `{ "id": "..." }` deletes the task and returns
  `{ "success": true }`.

Run [`supabase/schema.sql`](./supabase/schema.sql) to create the `tasks` table.
With the configured publishable key, its policies allow public read, create,
update, and delete access to all task rows.

## Supabase setup

1. In the Supabase dashboard, open the project's SQL Editor and run
   [`supabase/schema.sql`](./supabase/schema.sql).
2. Copy `.env.example` to `.env.local` for local development and fill in
   `SUPABASE_URL` and `SUPABASE_KEY`. The URL can be the project URL or the REST URL
   ending in `/rest/v1/`. For deployment, add these as environment variables in the
   hosting platform.
3. This setup uses a publishable key and public RLS policies for the shared `global`
   timer row. Anyone who can reach the API or Supabase can read or change this timer
   and task history. Use a server-only `SUPABASE_SECRET_KEY` instead if timer data
   must be private; never add a `NEXT_PUBLIC_` prefix to a secret key.
4. The `SUPABASE_TIMER_TABLE` and `SUPABASE_*_COLUMN` settings configure the table
   and column names; defaults match the SQL schema. `SUPABASE_STATE_ID` defaults
   to `global`, so requests share one active timer and task history.

The store uses a revision column for conflict-safe updates across server instances.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
