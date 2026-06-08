import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabaseInstance: any = null

export const getSupabaseBrowser = () => {
  if (supabaseInstance) return supabaseInstance

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Key missing. Database features will not work.')
  }

  // Determine cookie domain dynamically to allow local testing while matching production
  let cookieDomain: string | undefined = undefined
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname.endsWith('.codiceamico.app')) {
      cookieDomain = '.codiceamico.app'
    }
  }

  try {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey, {
      cookieOptions: {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
        secure: typeof window !== 'undefined' ? window.location.protocol === 'https:' : false,
        domain: cookieDomain,
      }
    })
    return supabaseInstance
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e)
    return null
  }
}

export const supabase = typeof window !== 'undefined' ? getSupabaseBrowser() : null
