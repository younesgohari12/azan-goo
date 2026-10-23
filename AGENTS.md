# YAgent AI — sandbox notes

YAgent AI is a **WordPress plugin** (PHP in `src/`, `views/`, `yagent-ai.php`) whose
product surface is a front-end workspace app in `assets/workspace/js` (plain ES
modules + scoped CSS, no build step, no framework).

## What runs in this sandbox

This sandbox has **no WordPress install, no database and no PHP runtime**. The
compose setup (`docker-compose.base44.yml`) runs a single `nginx:alpine` service
on host port 3000 that serves the repo read-only from disk:

- `/` → `.base44/dev/index.html`, a sandbox-only host page. It sets
  `window.YAgentUI = { demo: true, … }`, and `assets/workspace/js/adapters/index.js`
  then selects the in-memory mock adapter (`adapters/mock/`). Everything the
  workspace shows is simulated: no network, no model call, no credentials, and a
  reload rebuilds the seed world. The real WordPress view
  (`views/workspace.php`) never sets `demo`, so production always uses the REST
  adapter — don't change that contract.
- `/yagent-ai.zip` → the packaged plugin source (see below).

Because the server is plain static file serving there is **no HMR**: after
editing a source file, reload the preview to see the change.

## Packaged download

The complete plugin source can be rebuilt from the committed tree (tracked files
only — the sandbox host page, compose file and AGENTS.md stay out of the package):

```sh
mkdir -p .base44/download
git archive --prefix=yagent-ai/ --format=zip -o .base44/download/yagent-ai.zip HEAD
```

`.base44/download/` is gitignored, so the binary never lands in the repository.

## Verification

- `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/` — demo page.
- `curl -sI http://localhost:3000/yagent-ai.zip` — download package.
- `npm test` runs `node --test tests/rest-adapter.test.mjs` (Node 22 is available
  on the sandbox host). It covers the REST adapter only; the mock adapter and
  components are exercised through the demo page.
