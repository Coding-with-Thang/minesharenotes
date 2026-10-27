# Mineshare

Notes and a task schedule. Sign in on any device. A daily email lists overdue tasks and tasks due today.

## Local setup

1. Create a Postgres database (Neon Free, or any Postgres 15+).
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `DIRECT_URL`, and `AUTH_SECRET`.
3. Apply the schema: `npx prisma db migrate`
4. Start the app: `npm run dev`

Gmail reminders need `SMTP_USER`, `SMTP_PASS` (an app password), `EMAIL_FROM`, and `CRON_SECRET`. Without those, notes and tasks still work. The digest route returns an error until mail is configured.

## Deploy on Vercel Hobby

1. Push the repo to GitHub and import it into a Vercel Hobby project. Keep the free `*.vercel.app` address.
2. Create one Neon Free project. Put the pooled connection string in `DATABASE_URL` and the direct string in `DIRECT_URL`.
3. Set `AUTH_SECRET`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, and `CRON_SECRET` in the Vercel project.
4. Deploy. The build emits the Prisma contract and runs migrations.

The cron job runs once a day at 12:00 UTC and emails each user about tasks that are overdue or due that day in their timezone. Vercel Hobby cannot run the job more often than once a day.
