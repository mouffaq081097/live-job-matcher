# Live Job Match — Executive Tech MVP

## Run locally (Core MVP)

### 1) Configure env

Create `.env` (copy from `.env.example`) and set:

- `DATABASE_URL` (PostgreSQL)
- `NEXTAUTH_URL` (example: `http://localhost:3001`)
- `NEXTAUTH_SECRET` (any long random string)

### PostgreSQL options

- **Docker**: requires Docker Desktop installed and running. Then:

```bash
docker compose up -d
```

If Docker isn't available, use a hosted Postgres (Neon/Supabase/Railway) and set `DATABASE_URL`.

### 2) Migrate + seed

```bash
npx prisma migrate dev
npm run seed
```

### 3) Start dev server

```bash
npm run dev
```

Open `http://localhost:3001`.

Default seed user (unless overridden by `SEED_EMAIL`/`SEED_PASSWORD`):

- Email: `demo@livejobmatch.app`
- Password: `Password123!`

## Notes

- **Protected routes**: `/cv-builder`, `/optimize`, `/jobs` require sign-in.
- **PDF export**: open **Export / Print** from the CV Builder and use your browser “Print → Save as PDF”.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
