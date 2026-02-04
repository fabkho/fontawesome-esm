import { defineEventHandler, setHeader, createError } from 'h3'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path

  if (!path || path.includes('..')) {
    throw createError({ statusCode: 400, message: 'Invalid path' })
  }

  const filePath = join(process.cwd(), '..', 'dist', path)

  try {
    const content = await readFile(filePath, 'utf-8')
    setHeader(event, 'Content-Type', 'application/javascript')
    setHeader(event, 'Access-Control-Allow-Origin', '*')
    return content
  } catch {
    throw createError({ statusCode: 404, message: `Icon not found: ${path}` })
  }
})
