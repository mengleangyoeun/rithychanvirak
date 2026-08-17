import { getCollectionDetail } from '@/lib/collections'
import { CollectionView } from '@/components/collection-view'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 0

interface CollectionPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const data = await getCollectionDetail(resolvedParams.slug)

  if (!data || !data.collection) {
    return {
      title: 'Collection Not Found | Rithy Chanvirak',
    }
  }

  return {
    title: `${data.collection.title} | Rithy Chanvirak Photography`,
    description: data.collection.description || `View ${data.collection.title} photo collection by Rithy Chanvirak.`,
  }
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const resolvedParams = await params
  const data = await getCollectionDetail(resolvedParams.slug)

  if (!data || !data.collection) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#030303]">
      <CollectionView collection={data.collection} photos={data.photos} />
    </main>
  )
}
