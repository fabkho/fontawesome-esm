# fontawesome-esm

Convert FontAwesome CommonJS icon files to ES Modules for browser dynamic imports.

## Why?

FontAwesome's npm packages ship icons as CommonJS. Browsers can only dynamically import ES Modules. This script converts them so you can lazy-load icons from a CDN:

```js
const icon = await import(`https://cdn.example.com/icons/regular/faUser.js`)
```

## Setup

1. Clone this repo
2. Configure `.npmrc` with your FontAwesome token:
   ```
   @fortawesome:registry=https://npm.fontawesome.com/
   //npm.fontawesome.com/:_authToken=${FONTAWESOME_NPM_AUTH_TOKEN}
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Install the FontAwesome styles you need:
   ```bash
   # Pick the styles you want to convert
   npm install @fortawesome/pro-regular-svg-icons
   npm install @fortawesome/pro-solid-svg-icons
   # etc.
   ```

## Usage

```bash
npm run build
```

Output goes to `dist/`.

## Configuration

Use environment variables to customize the build:

| Variable | Description | Default |
|----------|-------------|---------|
| `FA_ESM_STYLES` | Comma-separated styles | `pro-regular-svg-icons` |
| `FA_ESM_OUTPUT` | Output directory | `./dist` |
| `FA_ESM_CONCURRENCY` | Parallel builds | `20` |
| `FA_ESM_MINIFY` | Minify output | `true` |

Examples:

```bash
# Single style
npm run build

# Multiple styles
FA_ESM_STYLES=pro-regular-svg-icons,pro-solid-svg-icons npm run build

# Custom output
FA_ESM_OUTPUT=./icons npm run build

# Disable minification (faster builds)
FA_ESM_MINIFY=false npm run build
```

## CI/CD

```yaml
# GitLab CI
variables:
  FA_ESM_STYLES: "pro-regular-svg-icons,pro-solid-svg-icons"

script:
  - npm install
  - npm run build
  # Upload dist/ to your CDN
```

## Output

```
dist/
├── regular/
│   ├── faUser.js
│   ├── faHome.js
│   └── ...
└── manifest.json
```

## License

MIT

Note: FontAwesome Pro icons require a valid license.
