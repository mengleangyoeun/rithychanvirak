import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type MetadataLike = Record<string, unknown> | null | undefined

const readRole = (metadata: MetadataLike): string | null => {
  if (!metadata || typeof metadata !== 'object') return null
  const role = metadata.role
  return typeof role === 'string' ? role : null
}

const readIsAdminFlag = (metadata: MetadataLike): boolean => {
  if (!metadata || typeof metadata !== 'object') return false
  return metadata.is_admin === true
}

const isAdminUser = (user: { app_metadata?: unknown; user_metadata?: unknown }) => {
  if (readRole(user.app_metadata as MetadataLike) === 'admin') return true
  if (readRole(user.user_metadata as MetadataLike) === 'admin') return true
  if (readIsAdminFlag(user.user_metadata as MetadataLike)) return true

  return false
}

export async function POST(request: NextRequest) {
  try {
    const configuredSecret = process.env.REVALIDATE_SECRET
    const headerSecret = request.headers.get('x-revalidate-secret')
    const authHeader = request.headers.get('authorization')
    const bearerSecret = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : null

    const hasValidSecret =
      !!configuredSecret &&
      (headerSecret === configuredSecret || bearerSecret === configuredSecret)

    let isAuthorized = hasValidSecret

    if (!isAuthorized) {
      const supabase = await createClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (!authError && user && isAdminUser(user)) {
        isAuthorized = true
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { path } = body

    if (!path || typeof path !== 'string') {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      )
    }

    if (!path.startsWith('/')) {
      return NextResponse.json(
        { error: 'Path must start with /' },
        { status: 400 }
      )
    }

    // Revalidate the specified path
    revalidatePath(path)

    return NextResponse.json({
      revalidated: true,
      path,
      now: Date.now()
    })
  } catch (error) {
    console.error('Error revalidating:', error)
    return NextResponse.json(
      { error: 'Error revalidating' },
      { status: 500 }
    )
  }
}
