# Human Drift Engine — AI Tool Launch Base

A reusable foundation for AI-powered web tools. Includes auth, payments, analytics, chat, admin, and deploy config.

---

## Architecture

```
┌─────────────────────────────────────┐
│  Next.js Frontend (Vercel)          │
│  human.runshensm88.com              │
│                                     │
│  Pages: / /login /account           │
│  /admin /success /cancel            │
│                                     │
│  Stacks: Supabase Auth + PostHog    │
│  + Crisp Chat + Stripe Checkout     │
└──────────────┬──────────────────────┘
               │ API calls via /api/humanize (proxy)
               ▼
┌─────────────────────────────────────┐
│  FastAPI Backend (Railway)          │
│  api.runshensm88.com                │
│                                     │
│  Endpoints: /health /humanize       │
│  /me /create-checkout-session       │
│  /stripe-webhook /admin/*           │
│                                     │
│  DB: Supabase Postgres              │
│  AI: DeepSeek API                   │
│  Payments: Stripe                   │
└─────────────────────────────────────┘
```

---

## Environment Variables

### Frontend (Vercel)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | Backend URL (e.g. https://your-backend.up.railway.app) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `NEXT_PUBLIC_POSTHOG_KEY` | ❌ | PostHog project API key for analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | ❌ | PostHog host (default: https://app.posthog.com) |
| `NEXT_PUBLIC_CRISP_WEBSITE_ID` | ❌ | Crisp chat website ID |
| `NEXT_PUBLIC_ADMIN_EMAILS` | ❌ | Comma-separated emails with /admin access |

### Backend (Railway)

| Variable | Required | Description |
|---|---|---|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek API key |
| `SUPABASE_URL` | ✅ | Supabase project URL (service role) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service_role key (secret) |
| `LEMON_SQUEEZY_API_KEY` | ❌ | Lemon Squeezy API key |
| `LEMON_SQUEEZY_STORE_ID` | ❌ | Lemon Squeezy store ID |
| `LEMON_SQUEEZY_VARIANT_ID` | ❌ | Lemon Squeezy variant ID |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | ❌ | Lemon Squeezy webhook signing secret |
| `FRONTEND_URL` | ✅ | Frontend URL for redirects |
| `ADMIN_EMAILS` | ❌ | Comma-separated emails with admin access |

---

## Setup Guide

### 1. Supabase — Create Project

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Choose a name (e.g. `human-drift-engine`)
3. Set a secure database password
4. Choose region closest to your users
5. Wait for provisioning (~2 min)

### 2. Supabase — Run SQL Schema

1. In Supabase Dashboard → SQL Editor
2. Open `supabase-schema.sql` from this repo
3. Paste and run the entire SQL
4. Verify: `profiles`, `usage_logs`, `generation_logs`, `payment_logs` tables created
5. Verify: trigger `on_auth_user_created` exists

### 3. Supabase — Get Keys

1. Supabase Dashboard → Project Settings → API
2. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Supabase — Enable Auth

1. Supabase Dashboard → Authentication → Providers
2. Enable **Email** provider
3. Disable "Confirm email" for quick testing (or leave enabled for production)
4. Under Settings → Auth Settings:
   - Site URL: `https://human.runshensm88.com`
   - Redirect URLs: `https://human.runshensm88.com/**`, `http://localhost:3002/**`

### 4b. Google OAuth — Enable & Configure

1. Supabase Dashboard → Authentication → Providers → Google → **Enable**
2. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
3. Create an OAuth 2.0 Client ID (Web application)
4. **Authorized JavaScript origins**:
   - `https://human.runshensm88.com`
   - `http://localhost:3002` (for local dev)
5. **Authorized redirect URIs**:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - `http://localhost:3002/account` (for local dev)
   - `https://human.runshensm88.com/account` (for production)
6. Copy the **Client ID** and **Client Secret**
7. Back in Supabase → Google provider settings:
   - Paste **Client ID** → `Google client ID`
   - Paste **Client Secret** → `Google client secret`
   - Click Save

### 5. Lemon Squeezy — Setup Payments

1. Go to [lemonsqueezy.com](https://lemonsqueezy.com) → Sign up
2. Create a **Store**:
   - Settings → Stores → Create Store
   - Name: `Human Drift Engine`
   - Save → copy the Store ID from URL (`/stores/12345` → ID = `12345`)
3. Create a **Product**:
   - Products → Create Product
   - Name: `Unlimited Creator Rewrites`
4. Create a **Variant** (pricing):
   - Inside the product → Add Variant
   - Name: `Unlimited`
   - Price: `$9.00` (one-time)
   - Save → copy the Variant ID from URL
5. Get your **API Key**:
   - Settings → API → Generate API Key
   - Copy → `LEMON_SQUEEZY_API_KEY`
6. Set environment variables:
   - `LEMON_SQUEEZY_STORE_ID` = your store ID
   - `LEMON_SQUEEZY_VARIANT_ID` = your variant ID
   - `LEMON_SQUEEZY_API_KEY` = your API key

### 6. Lemon Squeezy — Configure Webhook

1. Lemon Squeezy → Settings → Webhooks → Create Webhook
2. **URL**: `https://api.runshensm88.com/lemonsqueezy-webhook`
3. **Events**: Select `order_created`
4. **Signing Secret**: Generate and copy → `LEMON_SQUEEZY_WEBHOOK_SECRET`
5. Save

### 7. PostHog — Setup (Optional)

1. Go to [posthog.com](https://posthog.com) → Create project
2. Get Project API Key → `NEXT_PUBLIC_POSTHOG_KEY`
3. Default host: `https://app.posthog.com`

### 8. Crisp — Setup (Optional)

1. Go to [crisp.chat](https://crisp.chat) → Create account
2. Settings → Website ID → `NEXT_PUBLIC_CRISP_WEBSITE_ID`

---

## Deploy — Frontend (Vercel)

1. Push `tiktok-hook-generator/` folder to GitHub
2. Go to [vercel.com](https://vercel.com) → Add New Project
3. Import your GitHub repo
4. Framework: **Next.js** (auto-detected)
5. Root Directory: `tiktok-hook-generator/`
6. Add all Frontend environment variables from the table above
7. Click Deploy
8. Settings → Domains → Add `human.runshensm88.com`

## Deploy — Backend (Railway)

1. Push `hermes-core/` folder to GitHub
2. Go to [railway.app](https://railway.app) → New Project
3. Deploy from GitHub repo
4. Root Directory: `hermes-core/`
5. Add all Backend environment variables from the table above
6. Railway auto-detects:
   - `requirements.txt` → installs Python deps
   - `Procfile` → runs `uvicorn app:app --host 0.0.0.0 --port $PORT`
7. Deploy
8. Settings → Domains → Generate domain (or add custom `api.runshensm88.com`)

---

## DNS Configuration (阿里云 / Cloudflare)

### Frontend: human.runshensm88.com → Vercel

```
Type: CNAME
Name: human
Target: cname.vercel-dns.com
```

### Backend: api.runshensm88.com → Railway

```
Type: CNAME
Name: api
Target: railway-app.up.railway.app  (replace with your Railway domain)
```

---

## Local Development

```bash
# Backend
cd hermes-core
export DEEPSEEK_API_KEY=sk-...
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
cd tiktok-hook-generator
cp .env.local.example .env.local
# Edit .env.local with your keys
npm install
npm run dev
# → http://localhost:3002
```

---

## Production Checklist

- [ ] Supabase project created
- [ ] SQL schema executed (4 tables + trigger)
- [ ] Auth provider (Email) enabled in Supabase
- [ ] Google OAuth configured in Supabase + Google Cloud Console
- [ ] Lemon Squeezy store created
- [ ] Lemon Squeezy product + variant created ($9)
- [ ] Lemon Squeezy webhook configured pointing to `/lemonsqueezy-webhook`
- [ ] `DEEPSEEK_API_KEY` set in Railway
- [ ] All Lemon Squeezy env vars set in Railway
- [ ] All env vars set in Vercel
- [ ] CORS origins updated in backend `app.py` if needed
- [ ] DNS: `human.runshensm88.com` → Vercel
- [ ] DNS: `api.runshensm88.com` → Railway
- [ ] `/health` returns `{"status":"ok"}`
- [ ] Login/signup works
- [ ] Google OAuth login works
- [ ] Free tier (3/day for anonymous, 5 for logged-in free users)
- [ ] Lemon Squeezy checkout → success page → unlimited credits
- [ ] `/admin` stats page loads
- [ ] PostHog events tracked
- [ ] Crisp chat widget visible
- [ ] `npm run build` passes
