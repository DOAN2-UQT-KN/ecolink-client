# Ecolink Client

> Web frontend for environmental engagement — campaigns, incident reporting, organizations, rewards, and community participation.

![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)
![React](https://img.shields.io/badge/React-19-61dafb)
![Vite](https://img.shields.io/badge/Vite-7-646cff)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)

---

## Project Description

**Ecolink Client** is the browser application for the Ecolink platform. It connects volunteers, citizens, and administrators to environmental initiatives through a single web interface.

The system helps communities:

- Discover and join environmental **campaigns**
- **Report incidents** (e.g. trash, pollution) with location and media
- Manage **organizations** and membership
- Earn and redeem **gifts** using green points
- Track progress via **leaderboards**, **badges**, and **points**
- Explore geographic data on an interactive **map**

### Target users

| User type | Primary areas |
|-----------|---------------|
| Volunteers & citizens | Campaigns, incidents, organizations, gifts, leaderboard, profile |
| Authenticated members | My campaigns, my incidents, my organizations, account settings |
| Administrators | Admin console under `/admin` |

This repository contains **only the frontend**. It communicates with a separate REST API backend via `VITE_API_URL`.

---

## Features

### Authentication & account

- Email/password sign-in and sign-up
- Password reset flow
- Google OAuth callback handling (`/google-callback`, `/auth/oauth/google/callback`)
- Token refresh via Axios interceptors
- Profile account management

### Campaigns

- Campaign search and filtering
- Campaign detail pages with tasks, members, and attendance
- Create campaigns
- View and manage personal campaigns (`/campaigns/me`)

### Incidents (reports)

- Incident search and browsing
- Create incidents with address and media upload
- Incident detail views with voting
- Personal incident list (`/incidents/me`)

### Organizations

- Organization search
- Organization detail, members, and join requests
- Create organizations
- Manage owned organizations (`/organizations/me`)

### Rewards & gamification

- Gift catalog and redemption
- Leaderboard and seasons
- Profile badges and points history
- Profile orders (`/profile/orders`)

### Maps

- Full-screen map experience at `/maps` (Leaflet-based)

### Admin console

- Campaign, incident, and organization management
- Gift administration
- Gamification configuration (config, badges, seasons)
- Admin settings

### Platform capabilities

- **Internationalization** — English (`en`) and Vietnamese (`vi`) via i18next
- **Notifications** — in-app notification menu
- **AI chat widget** — assistant connected to backend chat API
- **Reverse geocoding** — `/api/reverse-geocode` (Vite dev/preview middleware)

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React 19 | UI library |
| Vite 7 | Build tool and dev server |
| React Router DOM 7 | Client-side routing |
| TypeScript 5 | Static typing |
| Tailwind CSS 4 | Utility-first styling |
| Radix UI / shadcn-style components | Accessible UI primitives (`components/ui/`) |
| Ant Design (`antd`) | Additional UI components where used |
| TanStack Query | Server state and data fetching |
| Zustand | Client state (e.g. auth) |
| react-hook-form | Form handling |
| react-i18next + i18next | Internationalization |
| Leaflet + react-leaflet | Maps |
| Axios | HTTP client |
| GSAP, Motion, AOS | Animations |

### Backend (external)

| Technology | Purpose |
|------------|---------|
| REST API | Expected at `VITE_API_URL` — not included in this repo |

### Database

| Technology | Purpose |
|------------|---------|
| — | Not applicable in this frontend repository |

### Authentication

| Technology | Purpose |
|------------|---------|
| JWT (Bearer + refresh token) | Stored in Zustand; sent via `libs/axiosClient.ts` |
| Google OAuth | Callback routes in the auth section |

### DevOps & deployment

| Technology | Purpose |
|------------|---------|
| Docker | `Dockerfile` present (see [Deployment](#deployment-guide)) |
| GitHub Actions | `.github/workflows/deploy.yml` — build, Docker push, ArgoCD trigger |
| ArgoCD | Deployment orchestration via external repo `DOAN2-UQT-KN/ecolink-argocd` |

### Testing

| Technology | Purpose |
|------------|---------|
| — | TODO: Add project-specific information — no test scripts or test framework configured in `package.json` |

### Other tools & libraries

| Technology | Purpose |
|------------|---------|
| ESLint + typescript-eslint | Linting |
| Prettier | Code formatting |
| Cloudinary | Client-side media uploads (incidents and related flows) |
| OpenStreetMap Nominatim | Reverse geocoding (proxied in dev/preview) |
| Slate | Rich text editing |
| Sonner | Toast notifications |
| QRCode | QR generation (campaign attendance) |

---

## System Architecture / Project Structure

This is a **client-side rendered (CSR)** single-page application. There is no server-side rendering.

### High-level flow

```text
Browser
  └── Vite-built static assets (dist/)
        └── React Router (src/routes/)
              └── Layouts (src/layouts/)
                    └── Page components (app/(pages)/)
                          └── APIs (apis/) → REST backend (VITE_API_URL)
```

### Folder structure

```text
ecolink-client/
├── app/
│   ├── (pages)/              # Page components grouped by area (main, auth, admin, maps)
│   │   ├── (main)/           # Public & authenticated user flows
│   │   ├── (auth)/           # Sign-in, sign-up, password reset, OAuth
│   │   ├── (admin)/          # Admin console pages
│   │   └── (maps)/           # Map experience
│   ├── _styles/              # Global CSS partials (typography, buttons)
│   └── globals.css           # Tailwind entry and theme tokens
├── apis/                     # Typed API modules (auth, campaigns, incidents, …)
├── components/
│   ├── client/               # App-facing UI (layout, providers, AI chat, shared)
│   ├── admin/                # Admin-specific UI
│   ├── form/                 # Form controls
│   └── ui/                   # Reusable primitives (shadcn-style)
├── constants/                # Shared constants
├── hooks/                    # Reusable React hooks
├── i18n/                     # i18next config and locale JSON (en, vi)
├── libs/                     # Axios client, router shim, utilities
├── modules/                  # Larger feature modules (e.g. ReportDetailCard)
├── public/                   # Static assets served at root
├── src/
│   ├── layouts/              # Root, Main, Auth, Admin, Maps, Profile layouts
│   ├── routes/               # React Router route definitions
│   ├── App.tsx               # Router provider
│   ├── main.tsx              # Application entry point
│   └── vite-env.d.ts         # Vite environment variable types
├── stores/                   # Zustand stores (e.g. auth)
├── types/                    # Shared TypeScript types
├── utils/                    # Helpers (requestApi, logout, etc.)
├── vite/                     # Vite plugins (reverse-geocode middleware)
├── index.html                # HTML shell
├── vite.config.ts            # Vite configuration
├── package.json
└── tsconfig.json
```

### Major directories

| Directory | Description |
|-----------|-------------|
| `src/` | Vite entry point, routing, and layout shell |
| `app/(pages)/` | Route-level page components and co-located `_components`, `_context`, `_hooks`, `_services` |
| `apis/` | Backend API calls organized by domain |
| `components/` | Shared and feature-specific UI building blocks |
| `libs/` | Cross-cutting utilities (`axiosClient`, router compatibility layer) |
| `stores/` | Global client state |
| `i18n/` | Translation resources and i18n setup |
| `public/` | Images and static files referenced as `/filename` |

Path aliases use `@/*` mapped to the project root (see `tsconfig.app.json` and `vite.config.ts`).

---

## Installation Guide

### Prerequisites

- **Node.js** 20 or newer (CI uses Node 22; `@types/node` targets Node 20)
- **npm** (this repo includes `package-lock.json`)

### Clone repository

```bash
git clone <repository-url>
cd ecolink-client
```

> **TODO:** Replace `<repository-url>` with the actual Git remote URL.

### Install dependencies

```bash
npm install
```

### Environment setup

Create a `.env` file in the project root (or copy from an existing template if your team provides one):

```env
VITE_API_URL=https://api.ecolink.id.vn/
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

See [Environment Variables](#environment-variables) for details.

Do not commit secrets or production credentials to version control.

### Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The dev server also exposes `GET /api/reverse-geocode?lat=&lon=` via a Vite middleware plugin for address lookup during development.

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Base URL for backend REST API calls (Axios and AI chat client). If omitted, the client falls back to `window.location.origin` in the browser. | `https://api.ecolink.id.vn/` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for media uploads. Defaults to `"example"` in code when unset. | `dnh9aufsa` |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Unsigned Cloudinary upload preset. Defaults to `"example"` in code when unset. | `ml_default` |

All Vite environment variables must be prefixed with `VITE_` to be exposed to client code via `import.meta.env`.

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Development | `npm run dev` | Starts the Vite dev server on port **3000** with hot module replacement. |
| Production build | `npm run build` | Runs TypeScript project build (`tsc -b`) then outputs optimized static files to `dist/`. |
| Preview | `npm run preview` | Serves the production build locally on port **3000** for smoke testing. |
| Lint | `npm run lint` | Runs ESLint across the project with auto-fix enabled. |

---

## API / Services Overview

### API modules (`apis/`)

Feature-oriented modules call the backend through the shared Axios instance in `libs/axiosClient.ts`.

| Domain | Path prefix | Examples |
|--------|-------------|----------|
| Auth | `apis/auth/` | Sign-in, sign-up, refresh token, password reset, Google OAuth |
| Campaigns | `apis/campaign/` | List, create, join, tasks, attendance, completion verification |
| Incidents | `apis/incident/` | Reports CRUD, media, verification, voting |
| Organizations | `apis/organization/` | CRUD, members, join requests, email verification |
| Gifts | `apis/gift/` | Catalog, redemption, admin redemptions |
| Gamification | `apis/gamification/` | Badges, seasons, leaderboard, metrics, config |
| Points | `apis/points/` | User points and transactions |
| Notifications | `apis/notification/` | List and mark read |
| SOS | `apis/sos/` | SOS records on the map |
| Saved resources | `apis/saved-resource/` | Saved incident resources |
| Vote | `apis/vote/` | Upvote/downvote on incidents |
| User | `apis/user/` | Profile updates |
| Chat media | `apis/chat-media/` | AI chat media registration |
| Admin media | `apis/admin-media/` | Admin media registration |
| Difficulty | `apis/difficulty/` | Difficulty settings |

### HTTP client behaviour

`libs/axiosClient.ts`:

- Attaches `Authorization: Bearer <access_token>` and `X-Refresh-Token` from the auth store
- Sends `Accept-Language` based on the active locale
- On **401**, attempts `POST /api/v1/auth/refresh-token` once, updates tokens, and retries; otherwise logs out and redirects to `/sign-in?redirect=...`

### Third-party integrations

| Service | Usage |
|---------|-------|
| Backend REST API | All `apis/` modules via `VITE_API_URL` |
| Cloudinary | Direct browser uploads for incident and related media |
| OpenStreetMap Nominatim | Reverse geocoding via `/api/reverse-geocode` (Vite middleware in dev/preview) |
| Google OAuth | OAuth callback handling (backend-driven flow) |

### Local development endpoint

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reverse-geocode` | `GET` | Proxies to Nominatim with required `lat` and `lon` query parameters. Implemented in `vite/reverseGeocode.ts`. |

> **Note:** In a static production deployment, `/api/reverse-geocode` must be proxied by your web server or API gateway unless you route geocoding through the backend.

---

## Deployment Guide

### Production build (static)

```bash
npm run build
```

Output is written to `dist/`. Serve `dist/` with any static file host (nginx, S3 + CloudFront, etc.) and configure SPA fallback to `index.html` for client-side routes.

Ensure `VITE_*` variables are set **at build time** — Vite inlines them into the bundle.

### Docker

A `Dockerfile` exists in this repository. The CI workflow builds and pushes images to Docker Hub as `uqtri/ecolink-client`.

> **TODO:** Verify the `Dockerfile` matches the current Vite build output (`dist/`). The existing Dockerfile references Next.js artifacts (`.next`, `next.config.ts`) and may need to be updated for static Vite deployment (e.g. nginx serving `dist/`).

Example local Docker workflow (after Dockerfile is updated):

```bash
docker build -t ecolink-client .
docker run -p 3000:3000 ecolink-client
```

### CI/CD (GitHub Actions)

Workflow: `.github/workflows/deploy.yml`

Triggered on:

- Push to `main`
- Manual `workflow_dispatch`

Steps:

1. `npm ci` and `npm run build`
2. Build and push Docker image to `uqtri/ecolink-client`
3. Dispatch `update-image` event to ArgoCD repo `DOAN2-UQT-KN/ecolink-argocd`

Required secrets:

| Secret | Purpose |
|--------|---------|
| `DOCKERHUB_USERNAME` | Docker Hub login |
| `DOCKERHUB_TOKEN` | Docker Hub token |
| `PERSONAL_ACCESS_TOKEN` | Trigger ArgoCD repository dispatch |

### VPS / reverse proxy

TODO: Add project-specific information for nginx or other reverse-proxy configuration used by your team.

---

## Internationalization

Supported UI languages: **English (`en`)** and **Vietnamese (`vi`)**.

- Translation files: `i18n/locales/en/`, `i18n/locales/vi/`
- Provider: `components/client/providers/I18nProvider.tsx`
- Language detection: browser preference, `localStorage`, and cookie — resolved to `en` or `vi`

---

## Contributing

1. Fork or branch from the main development branch used by your team.
2. Install dependencies: `npm install`
3. Create a feature branch with a descriptive name.
4. Make changes and run `npm run lint` before committing.
5. Open a pull request with a clear description of the change and test steps.

TODO: Add project-specific information — branching conventions, code review requirements, and commit message format from the parent **ecolink** repository.

---

## Related backend

This client expects REST endpoints compatible with the modules under `apis/`. Point `VITE_API_URL` at your API gateway or backend base URL.

The backend service is maintained separately and is not part of this repository.

---

## License

TODO: Add project-specific information — no `LICENSE` file is present in this repository.
