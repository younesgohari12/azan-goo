# YAgent UI — runtime image for the sandbox/dev server.
#
# Deliberately a plain Node runtime: the repository is bind-mounted at /app by
# docker-compose.base44.yml, dependencies are installed at container start from
# package-lock.json, and the code is served by Vite's dev server, so edits show
# up without rebuilding this image.
FROM node:22-slim

ENV CI=true \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

# curl is used by the compose healthcheck; ca-certificates/git for installing
# dependencies from the registry.
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates git \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
