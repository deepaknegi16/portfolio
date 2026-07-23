# 0009 — ngrok free-tier realities: cloud endpoint conflict and browser interstitial

- **Status:** Accepted
- **Date:** 2026-07-23
- **Phase:** 2

## Context

[0004](0004-ngrok-container-static-domain.md) assumed a free ngrok account gives you a
static domain that an agent tunnel can simply bind to, and flagged that the abuse
interstitial was *unverified*. Both assumptions were tested on 2026-07-23 by actually
starting the tunnel. Two things turned out differently than assumed.

### 1. The free static domain is already occupied by a Cloud Endpoint

The agent container failed on its very first connection attempt:

```
failed to start tunnel: The endpoint 'https://polo-countdown-frolic.ngrok-free.dev'
is already online. Either
  1. stop your existing endpoint first, or
  2. start both endpoints with `--pooling-enabled` to load balance between them.
ERR_NGROK_334
```

No ngrok process was running on the machine and no other container held it. Fetching the
domain directly returned `<title>Your new ngrok Cloud Endpoint!</title>` — ngrok now
provisions new free accounts with a permanent domain **and** a **Cloud Endpoint** already
bound to it, serving a placeholder page. That cloud endpoint occupies the domain
indefinitely, so an agent tunnel cannot claim it.

Two further consequences:

- Modern ngrok binds the agent to the account's assigned domain **by default**. Omitting
  `--domain` does not produce a random ephemeral URL for such an account — it still
  targets the assigned domain and still collides. The `${NGROK_DOMAIN:+--domain=...}`
  fallback in `docker-compose.yml` is therefore about not passing a malformed empty flag,
  not about getting an ephemeral URL.
- `--pooling-enabled` "works" but load-balances between the cloud endpoint and the real
  site, so roughly half of all requests would land on ngrok's placeholder page. Rejected.

### 2. The browser interstitial is real

Requesting the domain with a browser `User-Agent` returns ngrok's warning page —
`ERR_NGROK_6024`, "You are about to visit…" — while a non-browser `User-Agent` gets the
content directly. This is the abuse interstitial that [0004](0004-ngrok-container-static-domain.md)
listed as unverified. It is now confirmed present on free-tier domains.

## Decision

- **Delete the auto-provisioned Cloud Endpoint** from the ngrok dashboard so the agent
  tunnel can bind to the static domain. This is a one-time action on the account, done by
  the account owner — it is not something the compose stack can or should do.
- **Accept the interstitial.** It costs first-time visitors one click. Removing it means a
  paid ngrok plan, which is not justified for a portfolio behind a temporary tunnel.
- The restart loop this exposed is worth noting: `restart: unless-stopped` on a service
  that fails deterministically produces a tight retry loop against ngrok's API. Fine for a
  short-lived misconfiguration, but the logs must be read at the *first* failure — later
  entries are just the loop repeating and can mislead about the root cause.

## Alternatives considered

- **`--pooling-enabled`** — as above: half the traffic hits ngrok's placeholder page.
- **A different static domain** — free accounts get exactly one, so this only helps on a
  paid plan.
- **Cloudflare Tunnel / Tailscale Funnel** — no interstitial and free, but the project
  brief specified ngrok. Worth revisiting if the interstitial becomes annoying.

## Consequences

- Phase 2 cannot be fully verified until the cloud endpoint is deleted; everything on the
  local side (`localhost:8080`) is already confirmed working.
- Anyone given the public link sees a one-click warning page first. Say so when sharing it,
  otherwise it reads as a broken or suspicious link.

## Revisit when

The portfolio moves to real hosting, or the interstitial's cost outweighs a paid plan or a
switch to Cloudflare Tunnel.
