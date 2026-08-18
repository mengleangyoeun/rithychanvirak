import { createClient } from '@/lib/supabase/server'

export async function Footer() {
  const supabase = await createClient()

  // Fetch footer settings
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['footer_copyright', 'footer_made_by_name', 'footer_made_by_url'])

  const settingsMap = settings?.reduce((acc, curr) => {
    acc[curr.key] = curr.value || ''
    return acc
  }, {} as Record<string, string>) || {}

  const copyright = settingsMap['footer_copyright'] || '© 2026 Rithy Chanvirak. All rights reserved.'
  const madeByName = settingsMap['footer_made_by_name']
  const madeByUrl = settingsMap['footer_made_by_url']

  return (
    <footer className="w-full border-t border-zinc-800/80 bg-[#030303] py-8 text-sm text-zinc-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>{copyright}</p>
        
        {madeByName && (
          <p className="flex items-center gap-1.5">
            <span>Site by</span>
            {madeByUrl ? (
              <a 
                href={madeByUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {madeByName}
              </a>
            ) : (
              <span className="font-medium text-zinc-400">{madeByName}</span>
            )}
          </p>
        )}
      </div>
    </footer>
  )
}
