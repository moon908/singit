# SingIt - Spotify-like Music Streaming Web App

SingIt is a production-ready, responsive music streaming web application built with a modern, glassmorphic dark-by-default interface. It connects to the public **Jamendo Music API** to search and stream tracks, and uses **Prisma ORM** with **Neon PostgreSQL** to persist user settings, custom playlists, favorite items (tracks, albums, artists), and daily listening statistics.

---

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion (60FPS animations), Lucide Icons
- **Backend**: Next.js Server Actions, Route Handlers, React Server Components
- **Database**: Neon PostgreSQL
- **ORM**: Prisma (using v7 driver adapter pattern)
- **Authentication**: Auth.js (NextAuth v5) supporting credentials registration/login, Google OAuth, and GitHub OAuth
- **PWA**: Installable PWA with Service Worker caching

---

## 📁 Directory Structure

```text
singit/
├── app/                  # Next.js App Router (Layouts, Pages, API endpoints)
│   ├── api/              # Proxy routes for Jamendo search/genre and NextAuth handlers
│   ├── album/[id]/       # Album detail server pages
│   ├── artist/[id]/      # Artist profile server pages
│   ├── discover/         # Music discover dashboard
│   ├── favorites/        # Liked songs, albums, and followed artists
│   ├── genres/           # Genre listings and infinite-scrolling genre playlists
│   ├── history/          # Recently played logs grouped by day
│   ├── login/            # Authentication forms (Login / Registration)
│   ├── playlists/        # Playlist grid listings
│   ├── playlist/[id]/    # Playlist reordering and track editor
│   ├── profile/          # User profile statistics summary
│   ├── settings/         # Autoplay, notification toggles, delete account
│   ├── stats/            # Listening analytics bar charts dashboard
│   ├── globals.css       # Tailwind CSS v4 directives and animations
│   └── layout.tsx        # HTML wrapper shell with providers
├── components/           # Reusable UI React Components
│   ├── AppShell.tsx      # Responsive desktop/tablet/mobile grid layout frame
│   ├── Sidebar.tsx       # Collapsible navigation drawer
│   ├── Player.tsx        # Persistent bottom player control panel
│   ├── TrackList.tsx     # Positional lists with play index triggers
│   └── ...
├── hooks/                # Custom hooks (Player playback engine)
├── lib/                  # Database singleton clients
├── prisma/               # Prisma v7 schemas and TS seed scripts
├── public/               # Static assets, manifests, and Service Workers
└── next.config.ts        # Next.js parameters (remote patterns for Jamendo images)
```

---

## 🛠️ Getting Started & Setup Guide

### 1. Prerequisites
- **Node.js**: v18.17.0 or higher (v24.x recommended)
- **Database**: A PostgreSQL database (Neon PostgreSQL recommended)

### 2. Clone and Install Dependencies
Install all modules, bypassing peer version warnings (NextAuth expects Next.js v15, and this template operates on Next.js v16):
```bash
npm install --legacy-peer-deps
```

### 3. Environment Configuration
Create a `.env` file at the root of the project and populate it with the following:
```env
# Jamendo API Keys (Included Defaults)
NEXT_PUBLIC_JAMENDO_CLIENT_ID=c18b767d
JAMENDO_CLIENT_SECRET=c56765820a9ed1cb1ca0ee969bd52cc2

# Database Connection (Enter your Neon PostgreSQL connection string)
DATABASE_URL="postgresql://username:password@neon-host:5432/singit?sslmode=require"

# NextAuth.js Configuration
AUTH_SECRET="f6a91ad349079a40552b204646b940dfd87eef9f276ff16827fb71489e3a6c9e"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Credentials (Optionally configure on Google & GitHub Developer Consoles)
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"
```

---

## 🗄️ Database Setup & Seed Instructions

Because this project utilizes **Prisma v7**, database configuration is centralized in `prisma.config.ts` while `prisma/schema.prisma` defines models.

### 1. Push Database Schema to Neon
Run this command to compile the Prisma Schema models and push the tables into your PostgreSQL database:
```bash
npx prisma db push
```

### 2. Run Database Seeding
Initialize sample playlists, favorites, and listening stats for your test dashboard:
```bash
npx prisma db seed
```

This inserts a default login profile:
- **Email**: `demo@singit.com`
- **Password**: `password123`

---

## 📦 Vercel Deployment Instructions

Follow these steps to deploy SingIt to **Vercel**:

### 1. Deploy via Vercel CLI or Dashboard
1. Go to the [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
2. Select your repository and import it.
3. In **Environment Variables**, add the environment keys described in the `.env` section (Vercel automatically sets up HTTPS production redirect URLs).
4. Click **Deploy**.

### 2. Configure Neon Serverless Poolers (Optional)
If deploying to Vercel and using Neon, use the **Neon pooled connection URL** for `DATABASE_URL` (typically ports `5432` or `6543`) to prevent Vercel Serverless functions from exhausting database connections during peak traffic times.

---

## 🎹 Keyboard Shortcuts

- `Space`: Toggle Play/Pause
- `Ctrl + ArrowRight`: Seek forward 10 seconds
- `Ctrl + ArrowLeft`: Seek backward 10 seconds
- `Ctrl + ArrowUp`: Increase volume by 10%
- `Ctrl + ArrowDown`: Decrease volume by 10%
