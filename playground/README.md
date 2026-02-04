# FontAwesome ESM Playground

> ⚠️ This playground was AI-generated as a quick demo. It may contain rough edges.

A minimal Nuxt 4 app to test the lazy-loading `FaLazy.vue` component with pre-built FontAwesome ESM icons.

## Setup

```bash
# From the repo root, build the icons first
FA_ESM_STYLES=free-solid-svg-icons pnpm build

# Then run the playground
cd playground
pnpm install
pnpm dev
```

## What it does

- Serves pre-built icon chunks from `../dist` via a server route
- Demonstrates the `FaLazy` component loading icons on demand
- Type an icon name (e.g. `user`, `heart`, `arrow-down`) and click Load