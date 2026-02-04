# fontawesome-esm

Convert FontAwesome's CommonJS icon files to ES Modules so you can lazy-load them from a CDN.

## The Problem

FontAwesome's npm packages (`@fortawesome/pro-*-svg-icons`) ship icons as CommonJS. Browsers can only dynamically import ES Modules. This tool converts them.

## What's Included

1. **Build script** — Converts CommonJS icons to ESM using Rollup
2. **FaLazy.vue** — Zero-dependency Vue component for lazy-loading icons

## Quick Start

```bash
# Configure FontAwesome registry
echo '@fortawesome:registry=https://npm.fontawesome.com/
//npm.fontawesome.com/:_authToken=${FONTAWESOME_NPM_AUTH_TOKEN}' > .npmrc

# Install
pnpm install
pnpm add @fortawesome/pro-regular-svg-icons  # or any style you need

# Build
pnpm build
```

Output goes to `dist/`. Upload to your CDN.

## Build Options

| Variable | Default | Description |
|----------|---------|-------------|
| `FA_ESM_STYLES` | `pro-regular-svg-icons` | Comma-separated icon styles |
| `FA_ESM_OUTPUT` | `./dist` | Output directory |

```bash
# Build multiple styles
FA_ESM_STYLES=pro-regular-svg-icons,pro-solid-svg-icons pnpm build
```

## FaLazy Component

Copy [`playground/app/components/FaLazy.vue`](./playground/app/components/FaLazy.vue) into your project:

```vue
<FaLazy icon="user" />
<FaLazy icon="chevron-right" />
```

Edit `FA_ICON_CDN_URL` in the component to point to your CDN.

The component handles loading and error states with inline SVG fallbacks — no additional dependencies required.

## Playground

```bash
# Build icons first
FA_ESM_STYLES=free-solid-svg-icons pnpm build

# Run playground
cd playground
pnpm install
pnpm dev
```

## Why Not Just Use `@vite-ignore`?

You might think you can skip bundling with:

```ts
const icon = await import(/* @vite-ignore */ `./node_modules/@fortawesome/.../fa${name}.js`)
```

This doesn't work because the source files are CommonJS. Browsers can't import CommonJS directly — they need ES Modules.

## License

MIT — FontAwesome Pro icons require a valid FontAwesome license.