#!/usr/bin/env node
import crypto from 'node:crypto'
import process from 'node:process'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv()

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY ?? process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing Cloudinary env vars. Required:')
  console.error('- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME')
  console.error('- CLOUDINARY_API_KEY (or NEXT_PUBLIC_CLOUDINARY_API_KEY)')
  console.error('- CLOUDINARY_API_SECRET')
  process.exit(1)
}

const args = process.argv.slice(2)
const argMap = new Map(
  args
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [k, v] = arg.replace(/^--/, '').split('=')
      return [k, v ?? 'true']
    }),
)

const prefixesInput = argMap.get('prefix') || ''
const prefixes = prefixesInput
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean)

const mode = argMap.get('mode') || 'dry-run'
const apply = mode === 'apply' || argMap.get('apply') === 'true'
const invalidate = argMap.get('invalidate') !== 'false'
const maxPerType = Number(argMap.get('max') || 0)

const requestedType = (argMap.get('resource') || 'all').toLowerCase()
const resourceTypes = requestedType === 'all' ? ['image', 'video', 'raw'] : [requestedType]

if (prefixes.length === 0) {
  console.error('Usage: node scripts/cloudinary-cleanup.mjs --prefix=folderA,folderB [--resource=image|video|raw|all] [--mode=apply]')
  process.exit(1)
}

if (!['image', 'video', 'raw', 'all'].includes(requestedType)) {
  console.error('Invalid --resource value. Use image|video|raw|all')
  process.exit(1)
}

const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`

async function listResources(resourceType, prefix, max = 0) {
  const items = []
  let nextCursor = null

  do {
    const qs = new URLSearchParams({
      prefix,
      max_results: '500',
    })
    if (nextCursor) qs.set('next_cursor', nextCursor)

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}/upload?${qs.toString()}`
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: authHeader },
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`List failed (${resourceType}, ${prefix}): ${res.status} ${body}`)
    }

    const data = await res.json()
    const resources = data.resources || []
    for (const r of resources) {
      items.push(r.public_id)
      if (max > 0 && items.length >= max) {
        return items
      }
    }
    nextCursor = data.next_cursor || null
  } while (nextCursor)

  return items
}

function sign(params) {
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  return crypto.createHash('sha1').update(`${sorted}${apiSecret}`).digest('hex')
}

async function destroyOne(resourceType, publicId) {
  const timestamp = Math.floor(Date.now() / 1000)
  const paramsToSign = {
    invalidate: invalidate ? 'true' : 'false',
    public_id: publicId,
    timestamp,
  }
  const signature = sign(paramsToSign)
  const body = new URLSearchParams({
    api_key: apiKey,
    invalidate: invalidate ? 'true' : 'false',
    public_id: publicId,
    signature,
    timestamp: String(timestamp),
  })

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || (data.result && data.result !== 'ok' && data.result !== 'not found')) {
    throw new Error(`Destroy failed (${resourceType}, ${publicId}): ${res.status} ${JSON.stringify(data)}`)
  }
}

async function run() {
  console.log(`Cloudinary cleanup ${apply ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`Cloud: ${cloudName}`)
  console.log(`Prefixes: ${prefixes.join(', ')}`)
  console.log(`Resource types: ${resourceTypes.join(', ')}`)
  console.log('')

  const plan = []
  for (const prefix of prefixes) {
    for (const resourceType of resourceTypes) {
      const ids = await listResources(resourceType, prefix, maxPerType)
      plan.push({ prefix, resourceType, ids })
      console.log(`${resourceType.padEnd(5)}  ${prefix}  -> ${ids.length} assets`)
    }
  }

  const total = plan.reduce((sum, p) => sum + p.ids.length, 0)
  console.log(`\nTotal assets matched: ${total}`)

  if (!apply) {
    console.log('\nDry-run only. Re-run with --mode=apply (or --apply=true) to delete.')
    return
  }

  let deleted = 0
  for (const entry of plan) {
    for (const publicId of entry.ids) {
      await destroyOne(entry.resourceType, publicId)
      deleted += 1
      if (deleted % 25 === 0) {
        console.log(`Deleted ${deleted}/${total}...`)
      }
    }
  }

  console.log(`\nDeleted ${deleted} assets successfully.`)
}

run().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})

