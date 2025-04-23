import path from 'node:path'
import fs from 'node:fs/promises'
import { rollup } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { sync as globSync } from 'glob'

/**
 * @description Directory containing the source FontAwesome icon files.
 *              Targets only pro-regular-svg-icons as requested.
 */
const inputDir = path.resolve(
  process.cwd(),
  'node_modules/@fortawesome/pro-regular-svg-icons',
)

/**
 * @description Output directory for the pre-built icon chunks.
 *              This 'dist' folder will contain the files to upload to the CDN.
 */
const outputDir = path.resolve(process.cwd(), 'dist')

/**
 * @async
 * @function buildIconChunks
 * @description Finds all FontAwesome icon source files from pro-regular-svg-icons,
 *              processes each one using Rollup into a separate, standard ES module chunk,
 *              and outputs them to the `dist` directory.
 */
async function buildIconChunks() {
  try {
    console.log(`[IconBuilder] Clearing existing output directory: ${outputDir}`)
    await fs.rm(outputDir, { recursive: true, force: true })
    await fs.mkdir(outputDir, { recursive: true })

    console.log(`[IconBuilder] Finding icon files in: ${inputDir}`)
    const iconFiles = globSync('fa*.js', { cwd: inputDir, absolute: true })

    if (!iconFiles.length) {
      console.error(`[IconBuilder] No FontAwesome icon files found in ${inputDir}. Did you run 'yarn install'?`)
      return
    }

    console.log(`[IconBuilder] Found ${iconFiles.length} icons. Starting Rollup build...`)

    // Process each icon file in parallel
    const buildPromises = iconFiles.map(async (inputFile) => {
      const baseName = path.basename(inputFile) // e.g., 'faSquare.js'
      let bundle
      try {
        bundle = await rollup({
          input: inputFile,
          plugins: [
            nodeResolve(), // Resolves node_modules imports (if any within the icon file)
            commonjs(), // Converts CommonJS modules (if any within the icon file)
          ],
        })

        // Write the processed icon file as an ES module chunk
        await bundle.write({
          file: path.join(outputDir, baseName), // Output to dist/faSquare.js etc.
          format: 'es',
          sourcemap: false,
        })
      } catch (error) {
        console.error(`[IconBuilder] Error processing file ${baseName}:`, error)
      } finally {
        if (bundle) {
          await bundle.close()
        }
      }
    })

    // Wait for all icon processing jobs to complete
    await Promise.all(buildPromises)
    console.log(`[IconBuilder] Successfully built ${iconFiles.length} icon chunks to ${outputDir}`)
  }
  catch (error) {
    console.error('[IconBuilder] Error during build process:', error)
    process.exit(1) 
  }
}

// Execute the build function when the script is run
buildIconChunks()
