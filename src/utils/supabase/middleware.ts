import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
    const hasSession = request.cookies.get('sb-mock-session')?.value === 'true'
    const user = hasSession ? {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'local-user@leanity.dev',
      user_metadata: {
        full_name: 'Local User'
      }
    } : null
    return { response: supabaseResponse, user }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // refreshing the auth token
  const { data: { user } } = await supabase.auth.getUser()

  return { response: supabaseResponse, user }
}

