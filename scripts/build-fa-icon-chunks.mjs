import path from 'node:path'
import fs from 'node:fs/promises'
import { rollup } from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import { glob } from 'glob'

const STYLES = (process.env.FA_ESM_STYLES || 'pro-regular-svg-icons').split(',').map(s => s.trim())
const OUTPUT_DIR = path.resolve(process.cwd(), process.env.FA_ESM_OUTPUT || './dist')

async function buildIcon(inputFile, outputFile) {
  const bundle = await rollup({ input: inputFile, plugins: [commonjs()] })
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
    console.error(`Package not found: @fortawesome/${style}`)
    return 0
  }

  await fs.mkdir(outputDir, { recursive: true })
  const files = await glob('fa*.js', { cwd: inputDir, absolute: true })

  // Process in batches of 20
  for (let i = 0; i < files.length; i += 20) {
    const batch = files.slice(i, i + 20)
    await Promise.all(batch.map(f => buildIcon(f, path.join(outputDir, path.basename(f)))))
    process.stdout.write(`\r[${shortName}] ${Math.min(i + 20, files.length)}/${files.length}`)
  }

  console.log('')
  return files.length
}

async function main() {
  await fs.rm(OUTPUT_DIR, { recursive: true, force: true })
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  let total = 0
  for (const style of STYLES) {
    total += await processStyle(style)
  }

  console.log(`Done. ${total} icons built.`)
}

main().catch(err => { console.error(err); process.exit(1) })
