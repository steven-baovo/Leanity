import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'local-user@leanity.dev',
  user_metadata: {
    full_name: 'Local User'
  }
}

export async function createClient() {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
    const cookieStore = await cookies()
    const hasSession = cookieStore.get('sb-mock-session')?.value === 'true'

    return {
      auth: {
        getUser: async () => {
          return { data: { user: hasSession ? mockUser : null }, error: null }
        },
        signInWithPassword: async (data: any) => {
          cookieStore.set('sb-mock-session', 'true', { path: '/', maxAge: 31536000 })
          return { data: { user: mockUser }, error: null }
        },
        signUp: async (data: any) => {
          cookieStore.set('sb-mock-session', 'true', { path: '/', maxAge: 31536000 })
          return { data: { user: mockUser }, error: null }
        },
        signOut: async () => {
          cookieStore.delete('sb-mock-session')
          return { error: null }
        }
      },
      from: (table: string) => {
        return {
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => Promise.resolve({ data: null, error: null }),
          upsert: () => Promise.resolve({ data: null, error: null }),
          update: () => Promise.resolve({ data: null, error: null }),
          delete: () => Promise.resolve({ data: null, error: null }),
        }
      }
    } as any
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

