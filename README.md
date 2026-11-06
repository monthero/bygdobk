# Bygdø Badmintonklubb – a redesign proposal

This is a proposal for a new website for [Bygdø Badmintonklubb](https://www.bygdobadminton.no), the badminton club at Bygdøhus in Oslo. It was made together with Sanford Chin, and it's a gift to the people who keep the club going: the board, the coaches and everyone who shows up to play.

The goal is simple. Whoever lands on the site should find what they came for right away: when training is, how to join, what's coming up, and who to ask.

## What's inside

- **Training:** the weekly schedule per season, breaks, and what to bring. When a tournament or a break lands on a training day, that session shows as off.
- **Membership:** prices, what's included, the Sport Modern member deal, and a short "which plan fits me" helper that hands off to the club's member site.
- **Events:** tournaments, socials, meetings and trips, with volunteer shifts.
- **News:** the latest posts, search, and an archive by year and month.
- **The club:** the board, safe sport and sponsors.
- **Contact:** a form that emails the board.

The site is in Norwegian, English, Swedish, Finnish and Chinese. It works on phones as well as desktops, in light and dark mode.

The **Variants** menu in the footer lets you try different styles, colors, fonts and layouts, to compare directions side by side.

## How it works

- **Content** lives in [Sanity](https://www.sanity.io). The board edits it at `/admin`, inside the site. Everything on the calendar is one kind of entry: training repeats weekly, and any other event on the same day and time replaces that session.
- **Accounts** use [Supabase](https://supabase.com): magic link by email, or Google. A member's language and theme follow them across devices. Admins get a link to the editor and to the board pages for memberships and volunteer shifts.
- **The contact form** sends through a small Supabase Edge Function and [Resend](https://resend.com).

There is no server of its own. The site is static and is hosted on [Vercel](https://vercel.com).

## Running it locally

You need Node.js 22 or newer and pnpm.

```sh
cp .env.example .env
pnpm install
pnpm dev
```

Before the first run, copy `.env.example` to `.env` and fill in the Sanity project ID and the Supabase URL and publishable key. `.env` is never committed. On Vercel, the same variables are set in the project's environment settings.

Then open <http://localhost:5173>.

Other useful commands:

| Command               | What it does                                        |
| --------------------- | --------------------------------------------------- |
| `pnpm build`          | Type checks and builds the site into `dist/`        |
| `pnpm preview`        | Serves the built site                               |
| `pnpm lint`           | Lints the code                                      |
| `pnpm format`         | Formats the code                                    |
| `pnpm i18n:extract`   | Updates the translation files in `src/locales/`     |
| `pnpm check:contrast` | Checks text contrast on every page, style and theme |

## Setting up the services

- **Sanity:** add the site's address under API → CORS origins, with credentials allowed. Invite editors under Members.
- **Supabase:** the database changes are in `supabase/migrations/`. Apply them with `supabase db push`. Add the site's address to the auth redirect URLs. To make someone admin, set `is_admin` to true on their row in `profiles`.
- **Contact form:** set the function secrets `RESEND_API_KEY`, `CONTACT_TO` and `CONTACT_FROM`, then run `supabase functions deploy contact`.

## Built with

[React](https://react.dev), [Mantine](https://mantine.dev), [TanStack Router](https://tanstack.com/router) and [Query](https://tanstack.com/query), [Lingui](https://lingui.dev), [Zustand](https://zustand.docs.pmnd.rs), [Zod](https://zod.dev), [Sanity](https://www.sanity.io), [Supabase](https://supabase.com) and [Vite+](https://viteplus.dev).
