# Vedant Insurance Limited — Next.js + TypeScript + Tailwind

## Run it

    npm install
    npm run dev

Open http://localhost:3000.

## What's in this version vs the plain-JS one

This replaces the earlier `vedant-asset-nextjs` project. Same Next.js App
Router structure, but now:

- **TypeScript** (`.tsx` instead of `.js`) — every component's props and
  every piece of mock data has a declared shape, in `types/index.ts`.
- **Tailwind CSS v4** — styling is utility classes directly in JSX
  (`className="flex items-center gap-2"`) instead of a separate
  `globals.css` full of custom class names. Our brand colors/fonts live
  as design tokens in `app/globals.css` under `@theme`, which is what
  makes `bg-navy-deep`, `text-gold`, `font-display`, etc. valid classes
  everywhere in the app.
- **shadcn/ui pattern** — `components/ui/button.tsx` and
  `components/ui/dropdown-menu.tsx` follow the real shadcn architecture
  (Radix UI primitive + `class-variance-authority` variants + the `cn()`
  helper in `lib/utils.ts`). See the note below about why these were
  hand-written instead of CLI-installed.
- **Framer Motion** — the mobile menu, hero entrance, quote-tab
  crossfade, and category-card scroll reveal are all real `motion.*`
  components, not CSS `@keyframes`.
- **React Hook Form** — all four quote forms in `QuoteWidget.tsx` use
  `useForm`/`register` for validation instead of plain uncontrolled inputs.
- **lucide-react** — the category icons are real Lucide icons instead of
  hand-drawn SVGs (the logo seal is still custom, since "wax seal" isn't
  a standard icon).

## About the shadcn components

The dev environment I built this in can only reach a fixed list of
package registries (npm, GitHub, etc.) and not `ui.shadcn.com` directly,
so I couldn't run the official `npx shadcn@latest add button` CLI there.
Instead I hand-wrote `Button` and `DropdownMenu` using the exact same
underlying packages shadcn itself uses (Radix UI + class-variance-authority).

Your own machine has normal internet access, so once you have this
project, the real CLI will work fine for adding anything else:

    npx shadcn@latest add card dialog accordion tabs

`components.json` is already set up for this.

## Folder structure

    app/                 routes (just "/" so far)
    components/           page sections (Navbar, Hero, etc.)
    components/ui/        shadcn-style primitives (Button, DropdownMenu)
    data/                  mock content (categories, partner names)
    types/                 shared TypeScript types
    lib/                   the cn() class-merging helper
    services/              API layer: axios client, auth service, token storage
    hooks/                 React context hooks (useAuth)

`services/` and `hooks/` hold the auth integration (see below). `store/`
isn't needed — auth state lives in a small typed React context
(`hooks/useAuth.tsx`), no extra store library required.

## Sign-in flow (wired to the backend)

The navbar "Sign in" button opens a mobile-number → OTP modal
(`components/SignInModal.tsx`), built on the same Radix `Dialog` +
Framer Motion + React Hook Form pattern as `GetQuoteModal`. It covers
the default, loading, validation-error, auth-failure, and
success/redirect states, plus an auto-advancing 6-box OTP input with
paste support and a resend cooldown.

**API layer** — components never call axios directly; they go through the
auth service, which uses one shared, interceptor-equipped client:

- `services/api.ts` — the configured axios instance. A **request
  interceptor** attaches `Authorization: Bearer <token>` to every call; a
  **response interceptor** clears the session and broadcasts a
  `va:auth-unauthorized` event when an *authenticated* request gets a 401
  (expired/invalid JWT), and normalises error messages.
- `services/auth.ts` — `requestOtp` / `verifyOtp`, mapping the UI's
  10-digit mobile to the E.164 phone the backend expects:

      POST /user/auth/login-otp  { phone }       -> { message, devOtp? }
      POST /user/auth/otp-verify { phone, otp }  -> { message, user, token }

- `services/tokenStorage.ts` — the single source of truth for persisting
  the token + user (localStorage). Backend returns the JWT in the body and
  expects it as a Bearer header, so it must be JS-readable; swap this one
  file for a different storage backend if needed.

**Session & tokens** — `hooks/useAuth.tsx` (`<AuthProvider>` in
`app/layout.tsx`) restores the session on reload, exposes
`user` / `isAuthenticated` / `signIn` / `signOut`, and listens for the
`va:auth-unauthorized` event so an expired token logs the user out
app-wide. The navbar swaps the "Sign in" button for a user menu with
sign-out based on `isAuthenticated`.

> **No refresh token:** the backend issues a single access token (JWT,
> `JWT_EXPIRES_IN`, default 1 day) and exposes no refresh endpoint, so
> there is intentionally no refresh-token flow. On expiry the user is
> signed out and re-authenticates via OTP. If the backend later adds a
> refresh endpoint, wire it into the `services/api.ts` response
> interceptor.

**Config:** set `NEXT_PUBLIC_API_URL` to the backend's `/api` base (see
`.env.example` / `.env.local`, default `http://localhost:3000/api`). In
development the backend echoes the OTP back as `devOtp`, which the modal
shows as a hint; in production it's omitted and the OTP is sent via SMS.

## Known limitation

ESLint will warn about loading fonts via a `<link>` tag instead of
`next/font`. That's intentional here: `next/font` needs to fetch
fonts.googleapis.com at *build time*, and my sandboxed dev environment
blocks that domain for security reasons. It will work fine for you,
since your machine isn't behind that restriction — switch
`app/layout.tsx` to `next/font/google` if you'd like the slightly faster,
self-hosted version.

## Before going live

The IRDAI license number (in `Hero.tsx`) and the partner names (in
`data/partners.ts`) are placeholders — replace them with your real,
verifiable details before this is public.
