# Bygdø Badmintonklubb – a redesign proposal

This is a proposal for a new website for [Bygdø Badmintonklubb](https://www.bygdobadminton.no), the badminton club at Bygdøhus in Oslo. It was made together with Sanford Chin, and it's a gift to the people who keep the club going: the board, the coaches and everyone who shows up to play.

The goal is simple. Whoever lands on the site should find what they came for right away: when training is, how to join, what's coming up, and who to ask.

## What's inside

- **Training:** the weekly schedule, groups, and what to bring.
- **Membership:** prices, what's included, and a short join flow.
- **Events:** tournaments and volunteer shifts on a timeline, filtered by year and by upcoming or past.
- **News:** the latest posts and an archive by month.
- **The club:** the board, safe sport and sponsors.
- **Contact:** a short form and where to find us.

The site is in Norwegian, with English, Swedish and Finnish too. It works on phones as well as desktops, in light and dark mode.

## A prototype, not the real thing

Everything here is a demo. The news, events, shifts and login are made-up content so the pages can show how they'd work. The contact form doesn't send anything.

The **Variants** menu in the footer lets you try different styles, colors, fonts and layouts, to compare directions side by side.

## Running it locally

You need Node.js 22 or newer and pnpm.

```sh
pnpm install
pnpm dev
```

Then open http://localhost:5173.

Other useful commands:

| Command               | What it does                                        |
| --------------------- | --------------------------------------------------- |
| `pnpm build`          | Type checks and builds the site into `dist/`        |
| `pnpm preview`        | Serves the built site                               |
| `pnpm lint`           | Lints the code                                      |
| `pnpm format`         | Formats the code                                    |
| `pnpm i18n:extract`   | Updates the translation files in `src/locales/`     |
| `pnpm check:contrast` | Checks text contrast on every page, style and theme |

## Built with

[React](https://react.dev), [Mantine](https://mantine.dev), [TanStack Router](https://tanstack.com/router), [Lingui](https://lingui.dev), [Zustand](https://zustand.docs.pmnd.rs), [Zod](https://zod.dev) and [Vite+](https://viteplus.dev).
