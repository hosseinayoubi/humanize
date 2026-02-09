# Humanize AI (English-only)

Full-stack app:
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI components
- Supabase Auth (email/password)
- Prisma ORM + Supabase Postgres
- Anthropic Claude (3-pass rewrite for naturalness & clarity)
- Vercel deployment ready

> This project focuses on writing quality and naturalness. It is not optimized to bypass detector tools.

## Prerequisites
- Node.js 18+
- Supabase project (Auth + Postgres)
- Anthropic API key

## Setup (local)
```bash
npm install
cp .env.example .env.local
# Fill .env.local
npx prisma migrate dev --name init
npm run dev
```

## Supabase
1) Enable Email provider: Authentication → Providers → Email
2) URL Configuration:
   - Site URL: http://localhost:3000
   - Redirect URLs: http://localhost:3000/**

For production add your Vercel domain:
- https://YOUR-VERCEL-DOMAIN/**
- set NEXT_PUBLIC_APP_URL to your Vercel URL

## Deploy to Vercel
```bash
npm i -g vercel
vercel
```

Add env vars in Vercel project settings, then run:
```bash
vercel env pull
npx prisma migrate deploy
```

## API endpoints
- POST /api/humanize
- GET /api/usage
- GET /api/history?page=1&limit=10
- DELETE /api/history/:id
- PATCH /api/user/tier  (demo endpoint; in production, use payment webhooks)
