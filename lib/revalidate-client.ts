export async function revalidatePublicPaths(paths: string[]): Promise<void> {
  const uniquePaths = Array.from(new Set(paths.filter((path) => path.startsWith('/'))))

  await Promise.all(
    uniquePaths.map(async (path) => {
      try {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path }),
        })
      } catch (error) {
        console.warn(`Failed to revalidate path "${path}":`, error)
      }
    })
  )
}
