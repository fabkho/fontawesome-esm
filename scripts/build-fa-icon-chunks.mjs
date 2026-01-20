import path from 'node:path'
import fs from 'node:fs/promises'
import { rollup } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import { glob } from 'glob'

/**
 * FontAwesome ESM Builder
 *
 * Converts FontAwesome CommonJS icon files to ES Modules for browser dynamic imports.
 *
 * Environment Variables:
 *   FA_ESM_STYLES      - Comma-separated styles (default: pro-regular-svg-icons)
 *   FA_ESM_OUTPUT      - Output directory (default: ./dist)
 *   FA_ESM_CONCURRENCY - Parallel builds (default: 20)
 *   FA_ESM_MINIFY      - Minify output (default: true)
 */

const STYLES = (process.env.FA_ESM_STYLES || 'pro-regular-svg-icons').split(',').map(s => s.trim())
const OUTPUT_DIR = path.resolve(process.cwd(), process.env.FA_ESM_OUTPUT || './dist')
const CONCURRENCY = parseInt(process.env.FA_ESM_CONCURRENCY || '20', 10)
const MINIFY = process.env.FA_ESM_MINIFY !== 'false'

async function asyncPool(limit, items, fn) {
  const executing = new Set()
  for (const item of items) {
    const promise = fn(item).then(() => executing.delete(promise))
    executing.add(promise)
    if (executing.size >= limit) await Promise.race(executing)
  }
  await Promise.all(executing)
}

async function buildIcon(inputFile, outputFile) {
  const plugins = [nodeResolve(), commonjs()]
  if (MINIFY) plugins.push(terser())

  const bundle = await rollup({ input: inputFile, plugins })
  await bundle.write({ file: outputFile, format: 'es' })
  await bundle.close()
}

async function processStyle(style) {
  const inputDir = path.resolve(process.cwd(), `node_modules/@fortawesome/${style}`)
  const shortName = style.match(/(?:pro|free)-(\w+)-svg-icons/)?.[1] || style
  const outputDir = path.join(OUTPUT_DIR, shortName)

  try {
    await fs.access(inputDir)
  } catch {
    console.error(`[!] Package not found: @fortawesome/${style}`)
    return []
  }

  await fs.mkdir(outputDir, { recursive: true })
  const files = await glob('fa*.js', { cwd: inputDir, absolute: true })

  console.log(`[${shortName}] ${files.length} icons`)

  let done = 0
  const icons = []

  await asyncPool(CONCURRENCY, files, async (inputFile) => {
    const name = path.basename(inputFile)
    await buildIcon(inputFile, path.join(outputDir, name))
    icons.push(name.replace(/^fa/, '').replace(/\.js$/, ''))
    done++
    process.stdout.write(`\r[${shortName}] ${done}/${files.length}`)
  })

  console.log('')
  return icons
}

async function main() {
  console.log(`Styles: ${STYLES.join(', ')}`)
  console.log(`Output: ${OUTPUT_DIR}`)

  await fs.rm(OUTPUT_DIR, { recursive: true, force: true })
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  const manifest = { generatedAt: new Date().toISOString(), styles: {} }

  for (const style of STYLES) {
    const shortName = style.match(/(?:pro|free)-(\w+)-svg-icons/)?.[1] || style
    const icons = await processStyle(style)
    if (icons.length) manifest.styles[shortName] = icons.sort()
  }

  await fs.writeFile(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`Done. ${Object.values(manifest.styles).flat().length} icons total.`)
}

main().catch(err => { console.error(err); process.exit(1) })
