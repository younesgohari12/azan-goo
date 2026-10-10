# Dev runtime for the Base44 sandbox.
#
# Contains only tooling (Node.js + the project's pinned package manager, Bun).
# Application source is NEVER copied in: docker-compose.base44.yml bind-mounts the
# repository so edits are picked up by the Vite dev server without a rebuild.
FROM node:22

# Bun is the package manager pinned by this project (bun.lock).
RUN npm install --global bun@1.4.3 && bun --version

WORKDIR /app
