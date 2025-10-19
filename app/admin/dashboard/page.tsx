'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Image, Video, FolderOpen, ArrowUpRight, TrendingUp, Clock,
  HardDrive, Activity, Calendar, Settings, BarChart3,
  Eye, Zap, Camera, Upload, Edit3, Globe, AlertCircle, RefreshCw,
  type LucideIcon
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import NextImage from 'next/image'
import { getThumbnailUrl } from '@/lib/cloudinary'
import type { Photo } from '@/types/database'

interface ActivityItem {
  id: string
  type: 'photo' | 'video' | 'collection'
  title: string
  created_at: string
  image_url?: string
  image_id?: string
}

interface QuickAction {
  title: string
  description: string
  icon: LucideIcon
  href: string
  color: string
  bgColor: string
  iconBgColor: string
}

export default function DashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({
    photos: 0,
    videos: 0,
    collections: 0,
    totalViews: 0,
  })
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [recentPhotos, setRecentPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Optimized data fetching with parallel execution and error handling
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      setActivityLoading(true)

      // Parallel execution of all data fetching
      const [
        photosCount,
        videosCount,
        collectionsCount,
        photosData,
        videosData,
        collectionsData,
        recentPhotosData
      ] = await Promise.all([
        // Stats - only count, no data fetching
        supabase.from('photos').select('*', { count: 'exact', head: true }),
        supabase.from('videos').select('*', { count: 'exact', head: true }),
        supabase.from('collections').select('*', { count: 'exact', head: true }),

        // Activity data - selective fields only
        supabase.from('photos').select('id, title, created_at, image_url, image_id').order('created_at', { ascending: false }).limit(3),
        supabase.from('videos').select('id, title, created_at, thumbnail_url').order('created_at', { ascending: false }).limit(3),
        supabase.from('collections').select('id, title, created_at, cover_image_url').order('created_at', { ascending: false }).limit(3),

        // Recent photos - selective fields for dashboard
        supabase.from('photos').select('id, title, image_url, image_id, created_at').order('created_at', { ascending: false }).limit(6)
      ])

      // Update stats
      setStats({
        photos: photosCount.count || 0,
        videos: videosCount.count || 0,
        collections: collectionsCount.count || 0,
        totalViews: 0, // Placeholder for now
      })

      // Process activity data
      const activity: ActivityItem[] = []

      if (photosData.data) {
        photosData.data.forEach(photo => {
          activity.push({
            id: photo.id,
            type: 'photo',
            title: photo.title,
            created_at: photo.created_at,
            image_url: photo.image_url,
            image_id: photo.image_id || undefined,
          })
        })
      }

      if (videosData.data) {
        videosData.data.forEach(video => {
          activity.push({
            id: video.id,
            type: 'video',
            title: video.title,
            created_at: video.created_at,
            image_url: video.thumbnail_url,
          })
        })
      }

      if (collectionsData.data) {
        collectionsData.data.forEach(collection => {
          activity.push({
            id: collection.id,
            type: 'collection',
            title: collection.title,
            created_at: collection.created_at,
            image_url: collection.cover_image_url,
          })
        })
      }

      // Sort and set activity
      activity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setRecentActivity(activity.slice(0, 8))

      // Set recent photos
      if (recentPhotosData.data) {
        setRecentPhotos(recentPhotosData.data as Photo[])
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data. Please try refreshing the page.')
    } finally {
      setLoading(false)
      setActivityLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Memoized stat cards to prevent unnecessary re-renders
  const statCards = useMemo(() => [
    {
      label: 'Photos',
      value: stats.photos,
      icon: Image,
      description: 'Total photos uploaded',
      href: '/admin/dashboard/collections',
      trend: '+12%',
      color: 'text-blue-700',
      bgColor: 'bg-blue-200'
    },
    {
      label: 'Videos',
      value: stats.videos,
      icon: Video,
      description: 'Total videos published',
      href: '/admin/dashboard/videos',
      trend: '+8%',
      color: 'text-green-700',
      bgColor: 'bg-green-200'
    },
    {
      label: 'Albums',
      value: stats.collections,
      icon: FolderOpen,
      description: 'Organized albums',
      href: '/admin/dashboard/collections',
      trend: '+5%',
      color: 'text-purple-700',
      bgColor: 'bg-purple-200'
    },
    {
      label: 'Total Views',
      value: stats.totalViews,
      icon: Eye,
      description: 'Portfolio views',
      href: '/',
      trend: '+24%',
      color: 'text-orange-700',
      bgColor: 'bg-orange-200'
    },
  ], [stats.photos, stats.videos, stats.collections, stats.totalViews])

  // Memoized quick actions to prevent unnecessary re-renders
  const quickActions: QuickAction[] = useMemo(() => [
    {
      title: 'Upload Photos',
      description: 'Add new photos to your gallery',
      icon: Upload,
      href: '/admin/dashboard/collections',
      color: 'text-blue-800',
      bgColor: 'bg-blue-200 hover:bg-blue-300',
      iconBgColor: 'bg-blue-200'
    },
    {
      title: 'Create Album',
      description: 'Organize photos into collections',
      icon: FolderOpen,
      href: '/admin/dashboard/collections',
      color: 'text-purple-800',
      bgColor: 'bg-purple-200 hover:bg-purple-300',
      iconBgColor: 'bg-purple-200'
    },
    {
      title: 'Add Video',
      description: 'Upload and manage video content',
      icon: Video,
      href: '/admin/dashboard/videos',
      color: 'text-green-800',
      bgColor: 'bg-green-200 hover:bg-green-300',
      iconBgColor: 'bg-green-200'
    },
    {
      title: 'Edit Content',
      description: 'Update website text and settings',
      icon: Edit3,
      href: '/admin/dashboard/content',
      color: 'text-orange-800',
      bgColor: 'bg-orange-200 hover:bg-orange-300',
      iconBgColor: 'bg-orange-200'
    },
    {
      title: 'View Website',
      description: 'See your portfolio live',
      icon: Globe,
      href: '/',
      color: 'text-indigo-800',
      bgColor: 'bg-indigo-200 hover:bg-indigo-300',
      iconBgColor: 'bg-indigo-200'
    },
    {
      title: 'Analytics',
      description: 'Track performance metrics',
      icon: BarChart3,
      href: '#',
      color: 'text-pink-800',
      bgColor: 'bg-pink-200 hover:bg-pink-300',
      iconBgColor: 'bg-pink-200'
    },
  ], [])

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-sm text-destructive/80 mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            className="mt-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back! 👋</h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your portfolio today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/dashboard/content">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/">
              <Eye className="w-4 h-4 mr-2" />
              View Site
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.label} href={stat.href}>
                <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 group border-l-4 border-l-primary cursor-pointer">
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-muted/80 transition-colors">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        {stat.trend}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground">{stat.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>

      {/* Quick Actions Grid */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Everything you need to manage your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-4 flex-col gap-3 hover:shadow-md transition-all hover:border-primary"
                  asChild
                >
                  <Link href={action.href}>
                    <div className="p-3 rounded-xl bg-muted">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-1">
                      <div className="font-semibold text-sm">{action.title}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </div>
                  </Link>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Content & Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Photos */}
        {recentPhotos.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Recent Photos
                </CardTitle>
                <CardDescription>Latest additions to your gallery</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/dashboard/photos">
                  View all →
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {recentPhotos.slice(0, 6).map((photo) => (
                  <Link
                    key={photo.id}
                    href="/admin/dashboard/collections"
                    className="group relative aspect-square rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all"
                  >
                    {photo.image_id ? (
                      <NextImage
                        src={getThumbnailUrl(photo.image_id, 200)}
                        alt={photo.title}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <NextImage
                        src={photo.image_url}
                        alt={photo.title}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-1 left-1 right-1">
                        <p className="text-white text-xs font-medium truncate">{photo.title}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates across your portfolio</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No recent activity</p>
                <p className="text-xs mt-1">Start adding content to see activity here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 6).map((item) => {
                  const icon = item.type === 'photo' ? Image : item.type === 'video' ? Video : FolderOpen
                  const Icon = icon
                  const href =
                    item.type === 'photo' ? '/admin/dashboard/collections' :
                    item.type === 'video' ? '/admin/dashboard/videos' :
                    '/admin/dashboard/collections'

                  const timeAgo = getTimeAgo(item.created_at)

                  return (
                    <Link
                      key={item.id}
                      href={href}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      {/* Thumbnail/Icon */}
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.image_url ? (
                          item.image_id && item.type === 'photo' ? (
                            <NextImage
                              src={getThumbnailUrl(item.image_id, 80)}
                              alt={item.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <NextImage
                              src={item.image_url}
                              alt={item.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          )
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            {item.type}
                          </Badge>
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {item.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{timeAgo}</span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest content updates across all sections
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No recent activity yet</p>
              <p className="text-xs mt-1">Start adding content to see activity here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item) => {
                const icon = item.type === 'photo' ? Image : item.type === 'video' ? Video : FolderOpen
                const Icon = icon
                const href =
                  item.type === 'photo' ? '/admin/dashboard/collections' :
                  item.type === 'video' ? '/admin/dashboard/videos' :
                  '/admin/dashboard/collections'

                const timeAgo = getTimeAgo(item.created_at)

                return (
                  <Link
                    key={item.id}
                    href={href}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors group"
                  >
                    {/* Thumbnail or icon */}
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.image_url ? (
                        item.image_id && item.type === 'photo' ? (
                          <NextImage
                            src={getThumbnailUrl(item.image_id, 100)}
                            alt={item.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <NextImage
                            src={item.image_url}
                            alt={item.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        )
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {item.type}
                        </Badge>
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{timeAgo}</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* System Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Database</span>
              </div>
              <Badge variant="secondary" className="text-xs">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Storage</span>
              </div>
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">CDN</span>
              </div>
              <Badge variant="secondary" className="text-xs">Optimized</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Content Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Content Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Items</span>
                <span className="font-semibold">{(stats.photos + stats.videos + stats.collections).toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Photos</span>
                  <span>{stats.photos}</span>
                </div>
                <Progress value={(stats.photos / Math.max(stats.photos + stats.videos + stats.collections, 1)) * 100} className="h-1" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Videos</span>
                  <span>{stats.videos}</span>
                </div>
                <Progress value={(stats.videos / Math.max(stats.photos + stats.videos + stats.collections, 1)) * 100} className="h-1" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Albums</span>
                  <span>{stats.collections}</span>
                </div>
                <Progress value={(stats.collections / Math.max(stats.photos + stats.videos + stats.collections, 1)) * 100} className="h-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted border">
                <div className="text-lg font-bold">
                  {recentActivity.filter(item => item.type === 'photo').length}
                </div>
                <div className="text-xs text-muted-foreground">Photos Added</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted border">
                <div className="text-lg font-bold">
                  {recentActivity.filter(item => item.type === 'video').length}
                </div>
                <div className="text-xs text-muted-foreground">Videos Added</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted border">
                <div className="text-lg font-bold">
                  {recentActivity.filter(item => item.type === 'collection').length}
                </div>
                <div className="text-xs text-muted-foreground">Albums Created</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted border">
                <div className="text-lg font-bold">
                  {stats.totalViews}
                </div>
                <div className="text-xs text-muted-foreground">Site Views</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`
  return date.toLocaleDateString()
}
