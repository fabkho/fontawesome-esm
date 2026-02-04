# fontawesome-esm

Convert FontAwesome CommonJS icons to ES Modules for browser dynamic imports.

## Setup

```bash
# Configure FontAwesome registry
echo '@fortawesome:registry=https://npm.fontawesome.com/
//npm.fontawesome.com/:_authToken=${FONTAWESOME_NPM_AUTH_TOKEN}' > .npmrc

# Install
npm install
npm install @fortawesome/pro-regular-svg-icons  # or whichever styles you need
```

## Build

```bash
npm run build
```

Output goes to `dist/`. Upload to your CDN.

## Options

```bash
FA_ESM_STYLES=pro-regular-svg-icons,pro-solid-svg-icons npm run build
```

| Variable | Default |
|----------|---------|
| `FA_ESM_STYLES` | `pro-regular-svg-icons` |
| `FA_ESM_OUTPUT` | `./dist` |
| `FA_ESM_MINIFY` | `true` |

## License

MIT — FontAwesome Pro icons require a valid license.