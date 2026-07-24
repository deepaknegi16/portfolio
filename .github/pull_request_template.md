<!--
  This template pre-fills the description box when a pull request is opened.
  Delete any section that doesn't apply.
-->

## What & why

<!-- One or two sentences: what does this change do, and what prompted it? -->

## Related

<!-- Link issues this closes or relates to, e.g. "Closes #1" -->

## How it was verified

<!-- Check what you actually ran. Be honest — "not tested" is a valid answer. -->

- [ ] `cd frontend && npm run build` — clean build
- [ ] `cd frontend && npx astro check` — 0 errors
- [ ] `docker compose up --build web` — container healthy, site serves on :8080
- [ ] Looked at the change in a browser
- [ ] Not applicable / not tested (say why below)

## Notes for the reviewer

<!--
  Anything worth flagging: a decision record touched (decisions/), a placeholder
  left in on purpose, a follow-up deferred to another issue.
-->
