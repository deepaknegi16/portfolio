# 0004 — ngrok runs as a compose service with a static domain

- **Status:** Accepted
- **Date:** 2026-07-23
- **Phase:** 2

## Context

The site needs to be publicly reachable without real hosting. ngrok's free tier includes
one permanent static domain (`<name>.ngrok-free.app`), which avoids the URL changing on
every restart.

## Decision

An `ngrok/ngrok:latest` service in `docker-compose.yml`:

```yaml
command: http --domain=${NGROK_DOMAIN} web:80
```

It reaches nginx over the internal compose network by service name, so the tunnel works
even though the host port mapping (`8080:80`) exists only for local checks. `NGROK_AUTHTOKEN`
and `NGROK_DOMAIN` come from `.env`, which is git-ignored; `.env.example` documents them.
The ngrok inspector is published on `4040` for request debugging.

## Alternatives considered

- **ngrok on the host** — one fewer container, but an extra manual command every session
  and the tunnel dies independently of the stack.
- **Ephemeral random URL** — no domain configuration, but the link changes on every restart,
  which defeats the purpose of sharing a portfolio.

## Consequences

- One command (`docker compose up`) brings up both the site and its public URL.
- **Hard dependency on user-supplied secrets.** Without `NGROK_AUTHTOKEN` and
  `NGROK_DOMAIN` the ngrok service fails to start; the `web` service still runs fine on
  `localhost:8080`, so local work is never blocked by this.
- Free ngrok domains may present an abuse-warning interstitial on first browser visit.
  This has **not yet been verified** for this setup — it will be tested in P2-06 and the
  observed behaviour recorded then (P2-07), rather than assumed now.
- The tunnel exposes the site to the public internet whenever the stack is up. There is no
  authentication in front of it; nothing sensitive belongs in this repo's content.

## Revisit when

The site gets a real domain and hosting, or ngrok's free-tier terms change.
