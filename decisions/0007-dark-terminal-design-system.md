# 0007 — Dark terminal aesthetic, token-driven, no CDN assets

- **Status:** Accepted
- **Date:** 2026-07-23
- **Phase:** 1

## Context

The portfolio represents a backend engineer whose visible work is Java/Spring
microservices and data-structure practice. The visual language should read as
"systems engineer", not "design agency".

## Decision

A dark developer/terminal aesthetic: near-black surface ramp, one accent colour,
monospace for labels and metadata, a subtle grid, restrained motion. Dark is the default;
a toggle switches to light and persists in `localStorage`.

Implementation rules:

- **All colour, spacing, radius, and type values live as CSS custom properties** in
  `src/styles/tokens.css`. Components reference tokens, never literals. Light mode is a
  `[data-theme="light"]` override of the same token names — so themes never require
  touching component CSS.
- **No external requests.** Fonts are self-hosted through the `@fontsource-variable`
  npm package, not Google Fonts. Behind an ngrok tunnel every third-party request is added
  latency and a potential failure or privacy leak.
- An **inline script in `<head>`** applies the stored theme before first paint, so there is
  no flash of the wrong theme. This is one of the few places inline JS is justified, and it
  constrains the CSP in `nginx/default.conf` accordingly.
- Respect `prefers-color-scheme` when no explicit choice is stored, and
  `prefers-reduced-motion` for all animation.

## Alternatives considered

- **Minimal editorial (light)** — clean and timeless, but reads more designer than engineer.
- **Gradient / glassmorphism** — eye-catching but visually noisy, heavier CSS, and it dates
  quickly.

## Consequences

- Contrast must be checked deliberately: dark themes make it easy to ship low-contrast grey
  text. Body text targets WCAG AA (4.5:1) against its actual background, not against pure
  black.
- Light mode is real work, not an afterthought — but token-driven theming keeps it to one
  file.
- Self-hosted variable fonts add roughly 40–60 KB to the build. Worth it for zero
  third-party dependencies.

## Revisit when

The token file stops being the single source of colour — i.e. literals start appearing in
component styles.
