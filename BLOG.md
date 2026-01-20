# How to Speed Up Nuxt Builds by Pre-building FontAwesome Icons

If you are using dynamic imports to lazy-load FontAwesome icons in a Nuxt 3 app, you have probably noticed your build times creeping up. This guide shows you how to cut build times by moving icon processing out of your main application build.

We reduced our build time from 3:31 to 2:33 (a 27% improvement) and our bundle size by 15 MB using this approach.

## The Problem

Dynamic imports are great for lazy-loading icons at runtime:

```ts
const iconModule = await import(
  `../../node_modules/@fortawesome/pro-regular-svg-icons/fa${iconKey}.js`
)
```

But Vite has to analyze every possible import target at build time. With 5000+ icons, that means generating thousands of chunks on every build. This adds minutes to your CI pipeline.

You might think adding `/* @vite-ignore */` would solve this, but there is another problem: the icon files in `@fortawesome/pro-regular-svg-icons` are CommonJS, not ES Modules. Browsers cannot import CommonJS directly.

Here is what a FontAwesome icon file looks like:

```js
'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var prefix = 'far';
var iconName = 'user';
// ...
exports.definition = { prefix, iconName, icon: [...] };
exports.faUser = exports.definition;
```

That `exports.definition` syntax is CommonJS. To dynamically import these in a browser, you need ES Modules with `export` statements.

## Two Solutions

There are two ways to solve this:

1. **Pre-build with Rollup** — Convert the CommonJS files to ESM yourself and host them on a CDN
2. **Use FontAwesome Kits** — Kit packages already include ESM files

Both approaches decouple icon processing from your application build.

---

## Option 1: Pre-build with Rollup

This is the approach we use. You create a small separate project that converts FontAwesome's CommonJS icon files to ES Modules, then upload the output to a CDN.

### Step 1: Create the Project

Create a new directory with the following `package.json`:

> **Tip**: The build script supports environment variables for CI/CD. Set `FA_ESM_STYLES`, `FA_ESM_OUTPUT`, `FA_ESM_CONCURRENCY`, `FA_ESM_MINIFY`, or `FA_ESM_MANIFEST` to customize the build without modifying the script.

```json
{
  "name": "fontawesome-chunks",
  "scripts": {
    "build": "node ./scripts/build-fa-icon-chunks.mjs"
  },
  "devDependencies": {
    "@rollup/plugin-commonjs": "^28.0.3",
    "@rollup/plugin-node-resolve": "^16.0.1",
    "glob": "^11.0.1",
    "rollup": "^4.40.0"
  },
  "dependencies": {
    "@fortawesome/pro-regular-svg-icons": "^6.7.2"
  }
}
```

You will also need an `.npmrc` file to access FontAwesome's private registry:

```
@fortawesome:registry=https://npm.fontawesome.com/
//npm.fontawesome.com/:_authToken=${FONTAWESOME_NPM_AUTH_TOKEN}
```

### Step 2: Write the Build Script

Create `scripts/build-fa-icon-chunks.mjs`:

```js
import path from 'node:path'
import fs from 'node:fs/promises'
import { rollup } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { sync as globSync } from 'glob'

const inputDir = path.resolve(
  process.cwd(),
  'node_modules/@fortawesome/pro-regular-svg-icons',
)
const outputDir = path.resolve(process.cwd(), 'dist')

async function buildIconChunks() {
  await fs.rm(outputDir, { recursive: true, force: true })
  await fs.mkdir(outputDir, { recursive: true })

  const iconFiles = globSync('fa*.js', { cwd: inputDir, absolute: true })
  console.log(`Found ${iconFiles.length} icons`)

  const buildPromises = iconFiles.map(async (inputFile) => {
    const baseName = path.basename(inputFile)
    let bundle
    try {
      bundle = await rollup({
        input: inputFile,
        plugins: [nodeResolve(), commonjs()],
      })
      await bundle.write({
        file: path.join(outputDir, baseName),
        format: 'es',
        sourcemap: false,
      })
    } finally {
      if (bundle) await bundle.close()
    }
  })

  await Promise.all(buildPromises)
  console.log(`Built ${iconFiles.length} icon chunks to ${outputDir}`)
}

buildIconChunks()
```

The `commonjs()` plugin handles the conversion from CommonJS to ES Modules.

### Step 3: Build and Deploy

```bash
yarn install
yarn build
```

This creates a `dist/` folder with ES Module versions of each icon. Upload these files to your CDN.

You can customize the build using environment variables:

```bash
# Build multiple styles
FA_ESM_STYLES=pro-regular-svg-icons,pro-solid-svg-icons yarn build

# Custom output directory
FA_ESM_OUTPUT=./icons yarn build
```

In GitLab CI or GitHub Actions, set these as pipeline variables:

```yaml
# GitLab CI example
variables:
  FA_ESM_STYLES: "pro-regular-svg-icons,pro-solid-svg-icons"
  FA_ESM_OUTPUT: "./dist"
```

### Step 4: Update Your Component

In your Nuxt app, update the lazy-loading component to fetch icons from the CDN:

```vue
<script setup lang="ts">
import camelCase from 'lodash/camelCase'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

const { icon } = defineProps<{
  icon: string | string[]
}>()

const config = useRuntimeConfig()
const faIcon = ref<IconDefinition | null>(null)
const iconLoaded = ref(false)
const iconFailed = ref(false)

async function loadIcon(): Promise<void> {
  iconLoaded.value = false
  iconFailed.value = false

  const name = Array.isArray(icon) ? icon[1] : icon
  if (!name) {
    iconFailed.value = true
    return
  }

  let iconKey = camelCase(name)
  iconKey = iconKey.charAt(0).toUpperCase() + iconKey.slice(1)

  try {
    const cdnUrl = `${config.public.faIconCdnUrl}/fa${iconKey}.js`
    const iconModule = await import(/* @vite-ignore */ cdnUrl)
    faIcon.value = iconModule.default?.definition ?? iconModule.definition
    iconLoaded.value = true
  } catch (error) {
    console.warn(`Failed to load icon ${name}:`, error)
    iconFailed.value = true
  }
}

watch(() => icon, loadIcon, { immediate: true })
</script>

<template>
  <fa v-if="!iconLoaded && !iconFailed" :icon="['far', 'spinner-third']" spin />
  <fa v-else-if="iconFailed" :icon="['far', 'circle-exclamation']" />
  <fa v-else-if="faIcon" :icon="faIcon" />
</template>
```

The `/* @vite-ignore */` comment tells Vite to skip analysis of this import. Since the URL points to an external CDN, there is nothing to bundle.

### Step 5: Configure the CDN URL

Add the CDN URL to your Nuxt config:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      faIconCdnUrl: process.env.FA_ICON_CDN_URL || 'https://cdn.example.com/icons',
    },
  },
})
```

### When to Rebuild

You only need to rebuild and redeploy the icon chunks when:

- FontAwesome releases a new version you want to use
- You need to add a different icon style (e.g., solid, light)

This happens infrequently, so the extra project is not much maintenance overhead.

---

## Option 2: Use FontAwesome Kits

If you prefer not to maintain a build script, FontAwesome Kits offer a simpler path. Kit packages include ES Modules out of the box.

### Step 1: Create a Kit

Go to [fontawesome.com/kits](https://fontawesome.com/kits) and create a new Kit. Enable "Package Installation" in the Kit settings.

### Step 2: Install the Kit

```bash
npm install @awesome.me/kit-YOUR_KIT_CODE
```

### Step 3: Deploy the ESM Files

The Kit package includes pre-built ES Modules in its `modules/` directory. Copy these to your CDN:

```bash
cp -r node_modules/@awesome.me/kit-YOUR_KIT/icons/modules/* ./cdn-upload/
```

### Step 4: Update Your Component

Point your component to the CDN hosting the Kit files:

```ts
const cdnUrl = `${config.public.faIconCdnUrl}/far/fa${iconKey}.mjs`
const iconModule = await import(/* @vite-ignore */ cdnUrl)
```

### Alternative: FontAwesome Hosted Kits

For the simplest setup, you can use FontAwesome's own CDN:

```html
<script src="https://kit.fontawesome.com/YOUR_KIT_CODE.js" crossorigin="anonymous"></script>
```

This works well for most use cases, but it relies on auto-subsetting (FontAwesome only loads icons it detects on the page). For an icon picker where users can select any icon, you need all icons available on demand, so self-hosting is the better choice.

---

## Comparison

| | Rollup Pre-build | Kit Package |
|---|---|---|
| Build step | Yes, separate project | No |
| Maintenance | Rebuild on FA updates | Re-download Kit |
| Flexibility | Full control | Limited to Kit structure |
| Source | `@fortawesome/pro-*-svg-icons` | `@awesome.me/kit-*` |

Both approaches produce the same result: ES Module icon files on a CDN that your app can dynamically import without slowing down your build.

---

## Results

After implementing the CDN approach:

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Build time | 3:31 | 2:33 | -27% |
| Bundle size | 66.6 MB | 51.2 MB | -23% |
| Gzip size | 17.4 MB | 12.2 MB | -30% |

The build time savings add up quickly in a CI pipeline that runs many times per day.

---

## Summary

1. FontAwesome's npm packages ship individual icon files as CommonJS
2. Browsers need ES Modules for dynamic imports
3. Pre-build the icons once (with Rollup or via a Kit package) and host on a CDN
4. Use `/* @vite-ignore */` to skip Vite's analysis of the CDN imports

The key insight is that icon files rarely change, so there is no reason to process them on every application build.