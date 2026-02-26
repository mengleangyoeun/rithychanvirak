import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SignRequestBody {
  folder?: string
}

function createCloudinarySignature(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  return createHash('sha1').update(`${toSign}${apiSecret}`).digest('hex')
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY ?? process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary environment variables are not configured' },
        { status: 500 }
      )
    }

    const body = (await request.json().catch(() => ({}))) as SignRequestBody
    const folder = body.folder?.trim()

    if (folder && !/^[a-zA-Z0-9/_-]+$/.test(folder)) {
      return NextResponse.json({ error: 'Invalid folder format' }, { status: 400 })
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const paramsToSign: Record<string, string> = {
      timestamp: String(timestamp),
    }

    if (folder) {
      paramsToSign.folder = folder
    }

    const signature = createCloudinarySignature(paramsToSign, apiSecret)

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder: folder ?? null,
    })
  } catch (error) {
    console.error('Cloudinary signature error:', error)
    return NextResponse.json({ error: 'Failed to generate signature' }, { status: 500 })
  }
}
